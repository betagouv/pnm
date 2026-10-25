import {readdir, readFile} from 'node:fs/promises'
import {join} from 'node:path'
import process from 'node:process'
import {type DuckDBConnection, DuckDBInstance} from '@duckdb/node-api'
import {
  type DownloadRecord,
  type Source,
  downloadFile,
  rawDir,
} from '../sources.ts'

// Some features of the OFB layers are larger than what GDAL decodes by default. GDAL reads this
// setting from the environment when it opens a file
process.env.OGR_GEOJSON_MAX_OBJ_SIZE = '0'

// In memory by default, or in a database file for tables larger than the memory
export async function connect(path = ':memory:'): Promise<DuckDBConnection> {
  const instance = await DuckDBInstance.create(path)
  const connection = await instance.connect()
  await connection.run('INSTALL spatial; LOAD spatial')
  return connection
}

export function quoteIdentifier(name: string): string {
  return `"${name.replaceAll('"', '""')}"`
}

export function quoteLiteral(value: string): string {
  return `'${value.replaceAll('\'', '\'\'')}'`
}

export type Values = Record<string, string | number>

export async function readRows<T>(connection: DuckDBConnection, sql: string, values: Values = {}): Promise<T[]> {
  const reader = await connection.runAndReadAll(sql, values)
  return reader.getRowObjectsJson() as T[]
}

export type RawPages = {
  readonly record: DownloadRecord
  // As GDAL opens them: ST_Read(page)
  readonly pages: string[]
}

// The pages of a source downloaded in data/raw, in order
export async function readRawPages(source: Source): Promise<RawPages> {
  const dir = rawDir(source)
  let record: DownloadRecord

  try {
    record = JSON.parse(await readFile(join(dir, downloadFile), 'utf8')) as DownloadRecord
  } catch {
    throw new Error(`${source.typeName} is not downloaded: npm run download -w @pnm/pipelines`)
  }

  const entries = await readdir(dir)
  const pages = entries
    .filter(name => /^page-\d+\.json(?:\.gz)?$/v.test(name))
    .toSorted()
    .map(name => name.endsWith('.gz') ? `/vsigzip/${join(dir, name)}` : join(dir, name))

  return {record, pages}
}

// Checks that a relation holds every feature of a source once. The download only checks the
// counts: a feature repeated on two pages, in place of one skipped, shows here
export async function checkFeatures(connection: DuckDBConnection, record: DownloadRecord, relation: string, key: string): Promise<void> {
  const column = quoteIdentifier(key)
  const reader = await connection.runAndReadAll(`
    SELECT count(*)::INTEGER AS features, count(DISTINCT ${column})::INTEGER AS keys, count(${column})::INTEGER AS filled
    FROM ${relation}
  `)
  const [{features, keys, filled}] = reader.getRowObjectsJson() as [{features: number, keys: number, filled: number}]

  if (features !== record.features) {
    throw new Error(`${record.typeName}: ${features} features read, ${record.features} downloaded`)
  }

  if (keys !== features || filled !== features) {
    throw new Error(`${record.typeName}: ${features} features but ${keys} distinct values of ${record.key}, ${features - filled} empty`)
  }
}

// The pages of a source downloaded in data/raw, as one table with its key, the given columns and
// the geometry, in the projection of the source
export async function loadRaw(connection: DuckDBConnection, source: Source, table: string, columns: string[]): Promise<void> {
  const {record, pages} = await readRawPages(source)
  const selects = pages.map(page => `SELECT ${[source.key, ...columns, 'geom'].map(column => quoteIdentifier(column)).join(', ')} FROM ST_Read(${quoteLiteral(page)})`)

  await connection.run(`CREATE TABLE ${quoteIdentifier(table)} AS ${selects.join(' UNION ALL ')}`)
  await checkFeatures(connection, record, quoteIdentifier(table), source.key)
}
