import {readdir, readFile} from 'node:fs/promises'
import {join} from 'node:path'
import process from 'node:process'
import {type DuckDBConnection, DuckDBInstance} from '@duckdb/node-api'
import {
  type DownloadRecord,
  type Source,
  downloadFile,
  rawDir,
} from './sources.ts'

// Some features of the OFB layers are larger than what GDAL decodes by default. GDAL reads this
// setting from the environment when it opens a file
process.env.OGR_GEOJSON_MAX_OBJ_SIZE = '0'

export async function connect(): Promise<DuckDBConnection> {
  const instance = await DuckDBInstance.create(':memory:')
  const connection = await instance.connect()
  await connection.run('INSTALL spatial; LOAD spatial')
  return connection
}

function quoteIdentifier(name: string): string {
  return `"${name.replaceAll('"', '""')}"`
}

function quoteLiteral(value: string): string {
  return `'${value.replaceAll('\'', '\'\'')}'`
}

// The pages of a source downloaded in data/raw, as one table with its key, the given columns and
// the geometry, in the projection of the source
export async function loadRaw(connection: DuckDBConnection, source: Source, table: string, columns: string[]): Promise<void> {
  const dir = rawDir(source)
  let record: DownloadRecord

  try {
    record = JSON.parse(await readFile(join(dir, downloadFile), 'utf8')) as DownloadRecord
  } catch {
    throw new Error(`${source.typeName} is not downloaded: npm run download -w @pnm/pipelines`)
  }

  const entries = await readdir(dir)
  const pages = entries.filter(name => /^page-\d+\.json(?:\.gz)?$/v.test(name)).toSorted()
  const selects = pages.map(name => {
    const path = join(dir, name)
    const file = name.endsWith('.gz') ? `/vsigzip/${path}` : path
    return `SELECT ${[source.key, ...columns, 'geom'].map(column => quoteIdentifier(column)).join(', ')} FROM ST_Read(${quoteLiteral(file)})`
  })

  await connection.run(`CREATE TABLE ${quoteIdentifier(table)} AS ${selects.join(' UNION ALL ')}`)
  const key = quoteIdentifier(source.key)
  const reader = await connection.runAndReadAll(`
    SELECT count(*)::INTEGER AS features, count(DISTINCT ${key})::INTEGER AS keys, count(${key})::INTEGER AS filled
    FROM ${quoteIdentifier(table)}
  `)
  const [{features, keys, filled}] = reader.getRowObjectsJson() as [{features: number, keys: number, filled: number}]

  if (features !== record.features) {
    throw new Error(`${source.typeName}: ${features} features read, ${record.features} downloaded`)
  }

  // The download only checks the counts: a feature repeated on two pages, in place of one skipped,
  // shows here
  if (keys !== features || filled !== features) {
    throw new Error(`${source.typeName}: ${features} features but ${keys} distinct values of ${source.key}, ${features - filled} empty`)
  }
}
