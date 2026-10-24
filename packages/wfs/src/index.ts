// Downloads a whole WFS layer as it is on the server: no filter, no reprojection. The
// transformations happen afterwards, on our side
import {createReadStream, createWriteStream} from 'node:fs'
import {
  mkdir,
  readdir,
  rm,
  stat,
} from 'node:fs/promises'
import {get as httpGet, type IncomingMessage} from 'node:http'
import {get as httpsGet} from 'node:https'
import {join} from 'node:path'
import {pipeline} from 'node:stream/promises'
import {createGunzip} from 'node:zlib'

export type DownloadLayerOptions = {
  // The WFS endpoint, without parameters: "https://wxs.ofb.fr/geoserver/habitat/ows"
  readonly url: string
  // The layer, with its workspace: "habitat:eco_med_herbier_posidonia_oceanica_2022_pol_3857"
  readonly typeName: string
  // An attribute that orders the features the same way on every request, best the primary key.
  // Without it, GeoServer orders the pages by the primary key of the layer, when it knows one
  readonly sortBy?: string
  // An empty or missing directory, which receives one GeoJSON file per page
  readonly outDir: string
  // Features per page. Their weight varies a lot: a few detailed ones can make a page of hundreds
  // of megabytes
  readonly pageSize?: number
  // Pages downloaded at once. Each request is held back by the server, which compresses at about
  // 10 MB of GeoJSON per second: several at once are faster
  readonly concurrency?: number
  // Compressed transfer: about as fast, three times less data
  readonly gzip?: boolean
  // Attempts for each request before giving up
  readonly attempts?: number
  // Milliseconds without receiving anything before a request is dropped
  readonly idleTimeout?: number
  // Called when a page is written and checked
  readonly onPage?: (page: Page) => void
}

export type Page = {
  readonly index: number
  readonly file: string
  readonly features: number
  // As transferred, compressed or not
  readonly bytes: number
  readonly seconds: number
}

export type LayerDownload = {
  readonly features: number
  readonly pages: Page[]
  readonly seconds: number
}

type Encoding = 'gzip' | 'identity'

// Measured on the OFB GeoServer: 81 s for 76 824 features (475 MB compressed), against 155 s in a
// single request
const defaults = {
  pageSize: 2000,
  concurrency: 4,
  gzip: true,
  attempts: 4,
  idleTimeout: 120_000,
}

// The counts come after the features in the GeoJSON of GeoServer: this much of the end holds them
const tailLength = 4096

class HttpError extends Error {
  readonly status: number

  constructor(status: number, body: string) {
    super(`HTTP ${status}: ${body}`)
    this.status = status
  }
}

// A request rejected for what it asks is not tried again: it would fail the same way. Neither is a
// request cancelled because another one failed
function isRetryable(error: unknown): boolean {
  return error instanceof HttpError
    ? error.status >= 500 || error.status === 429
    : !(error instanceof Error && error.name === 'AbortError')
}

async function withRetry<T>(label: string, attempts: number, task: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await task()
    } catch (error) {
      if (attempt >= attempts || !isRetryable(error)) {
        throw new Error(`${label}: ${(error as Error).message}`, {cause: error})
      }

      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => {
        setTimeout(resolve, 1000 * (2 ** attempt))
      })
    }
  }
}

function requestUrl(url: string, typeName: string, parameters: Array<[string, string]>): URL {
  const result = new URL(url)
  result.search = new URLSearchParams([
    ['SERVICE', 'WFS'],
    ['VERSION', '2.0.0'],
    ['REQUEST', 'GetFeature'],
    ['TYPENAMES', typeName],
    ...parameters,
  ]).toString()
  return result
}

// The response as it comes, compressed or not
async function get(url: URL, encoding: Encoding, idleTimeout: number, signal?: AbortSignal): Promise<IncomingMessage> {
  const send = url.protocol === 'http:' ? httpGet : httpsGet

  return new Promise((resolve, reject) => {
    const request = send(url, {headers: {'Accept-Encoding': encoding}, timeout: idleTimeout, signal}, resolve)
    request.on('timeout', () => {
      request.destroy(new Error(`nothing received for ${idleTimeout} ms`))
    })
    request.on('error', reject)
  })
}

function isGzip(response: IncomingMessage): boolean {
  return response.headers['content-encoding'] === 'gzip'
}

// A short text answer: the count, or the error of the server
async function readText(response: IncomingMessage): Promise<string> {
  const decoder = new TextDecoder()
  let text = ''

  for await (const chunk of isGzip(response) ? response.pipe(createGunzip()) : response) {
    text += decoder.decode(chunk as Uint8Array, {stream: true})
  }

  return (text + decoder.decode()).trim()
}

// The reason given by the server, rather than its whole XML report
async function rejectResponse(response: IncomingMessage): Promise<never> {
  const text = await readText(response)
  const reason = /<ows:ExceptionText>(?<reason>[^<]*)<\/ows:ExceptionText>/v.exec(text)?.groups?.reason
  throw new HttpError(response.statusCode ?? 0, (reason ?? text).trim().slice(0, 500))
}

// Features matching the layer on the server
export async function countFeatures(url: string, typeName: string, idleTimeout = defaults.idleTimeout): Promise<number> {
  const response = await get(requestUrl(url, typeName, [['RESULTTYPE', 'hits']]), 'gzip', idleTimeout)

  if (response.statusCode !== 200) {
    return rejectResponse(response)
  }

  const text = await readText(response)
  const count = /numberMatched="(?<count>\d+)"/v.exec(text)?.groups?.count

  if (count === undefined) {
    throw new Error(`No count in the answer: ${text.slice(0, 500)}`)
  }

  return Number(count)
}

// The last numberReturned of the file. GeoServer writes it after the features: without it, the
// answer was cut short
async function readReturned(file: string, isCompressed: boolean): Promise<number | undefined> {
  // One character per byte, whatever the encoding: the counts are plain ASCII
  const decoder = new TextDecoder('latin1')
  const source = createReadStream(file)
  let tail = ''

  for await (const chunk of isCompressed ? source.pipe(createGunzip()) : source) {
    tail = (tail + decoder.decode(chunk as Uint8Array)).slice(-tailLength)
  }

  const key = '"numberReturned":'
  const count = /^"numberReturned":(?<count>\d+)/v.exec(tail.slice(tail.lastIndexOf(key)))?.groups?.count
  return count === undefined ? undefined : Number(count)
}

export async function downloadLayer(options: DownloadLayerOptions): Promise<LayerDownload> {
  const {url, typeName, sortBy, outDir, onPage} = options
  const {pageSize, concurrency, gzip, attempts, idleTimeout} = {...defaults, ...options}
  const encoding: Encoding = gzip ? 'gzip' : 'identity'
  const started = performance.now()

  await mkdir(outDir, {recursive: true})
  const existing = await readdir(outDir)

  // Files left by another download would mix with these pages
  if (existing.length > 0) {
    throw new Error(`${outDir} is not empty`)
  }

  const features = await withRetry('count', attempts, async () => countFeatures(url, typeName, idleTimeout))
  const pageCount = Math.ceil(features / pageSize)
  const pages: Page[] = []
  // Once a page fails, the others are cancelled
  const cancel = new AbortController()
  let failure: Error | undefined
  let next = 0

  async function downloadPage(index: number): Promise<Page> {
    const pageStarted = performance.now()
    const expected = Math.min(pageSize, features - (index * pageSize))
    const response = await get(requestUrl(url, typeName, [
      ['OUTPUTFORMAT', 'application/json'],
      ...(sortBy === undefined ? [] : [['SORTBY', sortBy] as [string, string]]),
      ['STARTINDEX', String(index * pageSize)],
      ['COUNT', String(pageSize)],
    ]), encoding, idleTimeout, cancel.signal)

    // The server answers some errors with a 200 and an XML report
    if (response.statusCode !== 200 || !response.headers['content-type']?.startsWith('application/json')) {
      return rejectResponse(response)
    }

    const isCompressed = isGzip(response)
    const file = join(outDir, `page-${String(index).padStart(5, '0')}.json${isCompressed ? '.gz' : ''}`)

    try {
      await pipeline(response, createWriteStream(file))
      const returned = await readReturned(file, isCompressed)

      if (returned !== expected) {
        throw new Error(returned === undefined
          ? 'answer cut short'
          : `${returned} features received, ${expected} expected`)
      }

      const {size} = await stat(file)
      return {
        index,
        file,
        features: returned,
        bytes: size,
        seconds: (performance.now() - pageStarted) / 1000,
      }
    } catch (error) {
      await rm(file, {force: true})
      throw error
    }
  }

  async function worker(): Promise<void> {
    while (!cancel.signal.aborted && next < pageCount) {
      const index = next++

      try {
        // eslint-disable-next-line no-await-in-loop
        const page = await withRetry(`page ${index}`, attempts, async () => downloadPage(index))
        pages.push(page)
        onPage?.(page)
      } catch (error) {
        // The first failure is the cause, the next ones are the cancellations
        failure ??= error instanceof Error ? error : new Error(String(error))
        cancel.abort()
      }
    }
  }

  // Waits for the cancelled pages too: once this returns or throws, no request is left running and
  // no partial file is left behind
  await Promise.all(Array.from({length: Math.min(concurrency, pageCount)}, async () => worker()))

  if (failure !== undefined) {
    throw failure
  }

  const received = pages.reduce((sum, page) => sum + page.features, 0)

  if (received !== features) {
    throw new Error(`${received} features received, ${features} announced`)
  }

  // Paging is not transactional on the server: a layer that changed meanwhile may have repeated or
  // skipped features
  const featuresAfter = await withRetry('count', attempts, async () => countFeatures(url, typeName, idleTimeout))

  if (featuresAfter !== features) {
    throw new Error(`The layer changed during the download: ${features} features, then ${featuresAfter}`)
  }

  return {
    features,
    pages: pages.toSorted((a, b) => a.index - b.index),
    seconds: (performance.now() - started) / 1000,
  }
}
