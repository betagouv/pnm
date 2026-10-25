// Reads a Grist document as it is, and writes to it on request. Values stay encoded as Grist
// stores them (lists as ["L", …], references as row ids, dates in seconds): the transformations
// decode them afterwards, from the type of each column
import {mkdir, readdir, writeFile} from 'node:fs/promises'
import {join} from 'node:path'

export type GristDocument = {
  // The Grist instance: "https://grist.numerique.gouv.fr"
  readonly url: string
  readonly docId: string
  // A personal key: it carries the rights of its owner on every document
  readonly apiKey: string
}

export type Column = {
  readonly id: string
  // Label, type ("Text", "Ref:Habitats", "ChoiceList"…), formula…
  readonly fields: Record<string, unknown>
}

export type GristRecord = {
  readonly id: number
  readonly fields: Record<string, unknown>
}

export type Table = {
  readonly id: string
  readonly columns: Column[]
  readonly records: GristRecord[]
}

export type DocumentDownload = {
  // Records of each table
  readonly tables: Record<string, number>
  readonly seconds: number
}

export type WriteOptions = {
  // Lets Grist read strings as the type of their column would ("1110-5" in a Date column becomes a
  // date). By default, values are written as given
  readonly parse?: boolean
}

export type UpsertOptions = WriteOptions & {
  // Which records to update when several match: the first one (default), none or all
  readonly onmany?: 'first' | 'none' | 'all'
  readonly noadd?: boolean
  readonly noupdate?: boolean
}

const attempts = 4
const timeout = 60_000
// Records per request
const batchSize = 500

class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(`HTTP ${status}: ${message}`)
    this.status = status
  }
}

type Request = {
  readonly method: 'GET' | 'POST' | 'PATCH' | 'PUT'
  readonly path: string
  readonly query?: Record<string, string>
  readonly body?: unknown
  // Gives the same result when sent twice. A request that is not, like adding records, could have
  // run before failing: it is tried again only when Grist turned it down without running it (429)
  readonly isIdempotent: boolean
}

// What the load balancer of a Grist instance answers when the server holding the document is gone.
// Grist itself takes it for a missing server and tries another one
function isWorkerMissing(error: HttpError): boolean {
  return error.status === 404 && error.message.includes('document worker not present')
}

function isRetryable(error: unknown, isIdempotent: boolean): boolean {
  return error instanceof HttpError
    ? error.status === 429 || (isIdempotent && (error.status >= 500 || isWorkerMissing(error)))
    : isIdempotent
}

async function send<T>(document: GristDocument, request: Request): Promise<T> {
  const url = new URL(`${document.url}/api/docs/${document.docId}${request.path}`)
  url.search = new URLSearchParams(request.query).toString()

  for (let attempt = 1; ; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await fetch(url, {
        method: request.method,
        headers: [
          ['Authorization', `Bearer ${document.apiKey}`],
          ...(request.body === undefined ? [] : [['Content-Type', 'application/json'] as [string, string]]),
        ],
        ...(request.body !== undefined && {body: JSON.stringify(request.body)}),
        signal: AbortSignal.timeout(timeout),
      })
      // eslint-disable-next-line no-await-in-loop
      const text = await response.text()

      if (!response.ok) {
        // Grist explains its errors in {"error": "…"}
        const reason = /"error":\s*"(?<reason>[^"]*)"/v.exec(text)?.groups?.reason ?? text
        throw new HttpError(response.status, reason.slice(0, 300))
      }

      // Some writes answer with nothing
      return (text === '' ? undefined : JSON.parse(text)) as T
    } catch (error) {
      if (attempt >= attempts || !isRetryable(error, request.isIdempotent)) {
        throw new Error(`${request.method} ${request.path}: ${(error as Error).message}`, {cause: error})
      }

      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => {
        setTimeout(resolve, 1000 * (2 ** attempt))
      })
    }
  }
}

function tablePath(tableId: string): string {
  return `/tables/${encodeURIComponent(tableId)}`
}

export async function listTables(document: GristDocument): Promise<string[]> {
  const {tables} = await send<{tables: Array<{id: string}>}>(document, {method: 'GET', path: '/tables', isIdempotent: true})
  return tables.map(table => table.id)
}

export async function fetchTable(document: GristDocument, tableId: string): Promise<Table> {
  const path = tablePath(tableId)
  const [{columns}, {records}] = await Promise.all([
    send<{columns: Column[]}>(document, {method: 'GET', path: `${path}/columns`, isIdempotent: true}),
    send<{records: GristRecord[]}>(document, {method: 'GET', path: `${path}/records`, isIdempotent: true}),
  ])

  if (new Set(records.map(record => record.id)).size !== records.length) {
    throw new Error(`${tableId}: repeated record ids`)
  }

  return {id: tableId, columns, records}
}

// Writes every table of the document in an empty or missing directory, one JSON file per table
export async function downloadDocument(document: GristDocument, outDir: string): Promise<DocumentDownload> {
  const started = performance.now()

  await mkdir(outDir, {recursive: true})
  const existing = await readdir(outDir)

  // Files left by another download would mix with these tables
  if (existing.length > 0) {
    throw new Error(`${outDir} is not empty`)
  }

  const tableIds = await listTables(document)
  const tables: Record<string, number> = {}

  // One table after the other: Grist limits the requests per document
  for (const tableId of tableIds) {
    /* eslint-disable no-await-in-loop -- one table after the other, see above */
    const table = await fetchTable(document, tableId)
    await writeFile(join(outDir, `${tableId}.json`), JSON.stringify(table) + '\n')
    /* eslint-enable no-await-in-loop */
    tables[tableId] = table.records.length
  }

  return {tables, seconds: (performance.now() - started) / 1000}
}

function writeQuery({parse = false}: WriteOptions): Record<string, string> {
  return parse ? {} : {noparse: 'true'}
}

function bySize<T>(items: readonly T[]): T[][] {
  const batches: T[][] = []

  for (let start = 0; start < items.length; start += batchSize) {
    batches.push(items.slice(start, start + batchSize))
  }

  return batches
}

// Grist writes the records of a request column by column, from the fields of them all: an update
// wants the same fields on every record, and an addition sets the fields that a record lacks to
// null rather than to their default. A batch thus holds records with the same fields, kept in the
// order given
function bySizeAndFields<T extends {readonly fields: Record<string, unknown>}>(records: readonly T[]): T[][] {
  const runs: T[][] = []
  let previousFields: string | undefined

  for (const record of records) {
    const fields = Object.keys(record.fields).toSorted().join(',')

    if (fields === previousFields) {
      runs.at(-1)!.push(record)
    } else {
      runs.push([record])
      previousFields = fields
    }
  }

  return runs.flatMap(run => bySize(run))
}

// Sends the batches one after the other. A batch that fails stops the others, and the error tells
// how many items were already written: they stay written
async function inBatches<T, R>(batches: readonly T[][], label: string, write: (batch: T[]) => Promise<R[]>): Promise<R[]> {
  const total = batches.reduce((count, batch) => count + batch.length, 0)
  const results: R[] = []
  let written = 0

  for (const batch of batches) {
    try {
      // eslint-disable-next-line no-await-in-loop
      results.push(...await write(batch))
    } catch (error) {
      throw new Error(`${label}: ${written} of ${total} written before the error. ${(error as Error).message}`, {cause: error})
    }

    written += batch.length
  }

  return results
}

// The ids of the new records, in the order given
export async function addRecords(
  document: GristDocument,
  tableId: string,
  records: ReadonlyArray<{readonly fields: Record<string, unknown>}>,
  options: WriteOptions = {},
): Promise<number[]> {
  return inBatches(bySizeAndFields(records), `${tableId}: add`, async batch => {
    const response = await send<{records: Array<{id: number}>}>(document, {
      method: 'POST',
      path: `${tablePath(tableId)}/records`,
      query: writeQuery(options),
      body: {records: batch},
      isIdempotent: false,
    })
    return response.records.map(record => record.id)
  })
}

export async function updateRecords(
  document: GristDocument,
  tableId: string,
  records: readonly GristRecord[],
  options: WriteOptions = {},
): Promise<void> {
  await inBatches(bySizeAndFields(records), `${tableId}: update`, async batch => {
    await send(document, {
      method: 'PATCH',
      path: `${tablePath(tableId)}/records`,
      query: writeQuery(options),
      body: {records: batch},
      isIdempotent: true,
    })
    return []
  })
}

// Updates the records matching `require`, or adds them. An empty `require`, which would update every
// record of the table, is refused
export async function upsertRecords(
  document: GristDocument,
  tableId: string,
  records: ReadonlyArray<{readonly require: Record<string, unknown>, readonly fields?: Record<string, unknown>}>,
  options: UpsertOptions = {},
): Promise<void> {
  if (records.some(record => Object.keys(record.require).length === 0)) {
    throw new Error(`${tableId}: upsert with an empty require`)
  }

  const {onmany, noadd, noupdate} = options
  const query = {
    ...writeQuery(options),
    ...(onmany !== undefined && {onmany}),
    ...(noadd === true && {noadd: 'true'}),
    ...(noupdate === true && {noupdate: 'true'}),
  }

  // Unlike an update or an addition, Grist sorts these records by their fields itself
  await inBatches(bySize(records), `${tableId}: upsert`, async batch => {
    await send(document, {
      method: 'PUT',
      path: `${tablePath(tableId)}/records`,
      query,
      body: {records: batch},
      isIdempotent: true,
    })
    return []
  })
}

export async function deleteRecords(document: GristDocument, tableId: string, ids: readonly number[]): Promise<void> {
  await inBatches(bySize(ids), `${tableId}: delete`, async batch => {
    await send(document, {
      method: 'POST',
      path: `${tablePath(tableId)}/records/delete`,
      body: batch,
      isIdempotent: false,
    })
    return []
  })
}
