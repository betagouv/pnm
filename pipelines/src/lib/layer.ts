// A layer, and the engine that turns it into the pivot format. A layer is processed whole and on its
// own, in a projection of where it lies, page by page from data/raw into a DuckDB database on disk:
// the memory follows the size of a page. Its pivot file is kept with the fingerprint of what
// produced it, and redone only when that changes: changing a rule redoes its layer alone
import {createHash} from 'node:crypto'
import type {DuckDBConnection} from '@duckdb/node-api'
import type {Source} from '../sources.ts'
import {
  type Values,
  checkFeatures,
  connect,
  quoteIdentifier,
  quoteLiteral,
  readRawPages,
  readRows,
} from './duckdb.ts'
import {pivotSelect, readFingerprint, writePivot} from './pivot.ts'
import {widen} from './widen.ts'

// Metropolitan France and Corsica, in meters
export const lambert93 = 'EPSG:2154'

// How the objects of a layer become a habitat élémentaire
export type HabitatRule = {
  // Code habitat élémentaire, as the Habitats table of the plans de gestion writes it
  readonly habitat: string
  // SQL condition on the columns of the source, when only some of its objects are this habitat
  readonly where?: string
  readonly columns?: string[]
  // Widens each object, in meters. It straightens the layer: crumbs of a few square meters, slivers
  // and points become a surface that stands for the habitat. The tolerance around a projet is not
  // this buffer: it widens the projet, when crossing
  readonly buffer: number
}

// A layer belongs to no parc: it may cover the whole country or a façade maritime
export type Layer = {
  readonly source: Source
  // In meters where the layer lies: its buffers and simplifications are computed in it
  readonly metricCrs: string
  readonly rules: HabitatRule[]
  // A treatment of its own, in place of widening: SQL that reads the table page, in the metric
  // projection, and returns the habitat and the geometry of each surface. It gets $habitat and
  // $buffer from the rule
  readonly treat?: (rule: HabitatRule) => string
}

// For the tables of the layers, in a database file. GDAL and GEOS allocate out of the memory limit:
// one page at a time keeps them in check. Longitude comes first in what GDAL writes, as everywhere
// else
export async function connectForLayers(path: string, temporaryDirectory: string): Promise<DuckDBConnection> {
  const connection = await connect(path)
  await connection.run(`
    SET memory_limit = '4GB';
    SET threads = 4;
    SET temp_directory = ${quoteLiteral(temporaryDirectory)};
    SET preserve_insertion_order = false;
    SET geometry_always_xy = true;
  `)
  return connection
}

async function readCount(connection: DuckDBConnection, sql: string): Promise<number> {
  const [row] = await readRows<{count: number}>(connection, sql)
  return row?.count ?? 0
}

// Turns a layer into its pivot file, unless the file comes from the same download, statements and
// libraries
export async function processLayer(connection: DuckDBConnection, layer: Layer, file: string): Promise<void> {
  const started = performance.now()
  const {source, metricCrs, rules} = layer
  const columns = [...new Set(rules.flatMap(rule => rule.columns ?? []))]
  const selected = rules.map(rule => `coalesce(${rule.where ?? 'true'}, false)`).join(' OR ')
  const {record, pages} = await readRawPages(source)
  const load = {
    sql: `
      CREATE OR REPLACE TEMP TABLE page AS
      SELECT
        CAST(${quoteIdentifier(source.key)} AS VARCHAR) AS id,
        ${columns.map(column => `${quoteIdentifier(column)}, `).join('')}
        ST_MakeValid(ST_Transform(geom, $crs, $metricCrs, always_xy := true)) AS geom
      FROM ST_Read($page)
    `,
    values: {crs: source.crs, metricCrs},
  }
  const treat = layer.treat ?? widen
  const treatments = rules.map(rule => ({rule, sql: treat(rule), values: {habitat: rule.habitat, buffer: rule.buffer}}))
  const pivot = pivotSelect('treated', metricCrs)
  // A new DuckDB or spatial extension may treat the same objects differently
  const [versions] = await readRows<Values>(connection, `
    SELECT version() AS duckdb, extension_version AS spatial FROM duckdb_extensions() WHERE extension_name = 'spatial'
  `)
  // The download, the statements and the libraries: while they stay the same, so does the pivot file
  const fingerprint = createHash('sha256')
    .update(JSON.stringify({
      record, versions, load, treatments: treatments.map(({sql, values}) => ({sql, values})), pivot,
    }))
    .digest('hex')

  if (await readFingerprint(connection, file) === fingerprint) {
    console.log(`${source.typeName}: unchanged`)
    return
  }

  await connection.run('CREATE OR REPLACE TABLE ids (id VARCHAR)')
  // The surfaces of the layer, treated page by page
  await connection.run('CREATE OR REPLACE TABLE treated (habitat VARCHAR, geom GEOMETRY)')
  const kept = new Map(rules.map(rule => [rule, 0]))
  let left = 0

  /* eslint-disable no-await-in-loop -- one page after the other, to bound the memory */
  for (const page of pages) {
    await connection.run(load.sql, {...load.values, page})
    await connection.run('INSERT INTO ids SELECT id FROM page')

    for (const {rule, sql, values} of treatments) {
      kept.set(rule, (kept.get(rule) ?? 0) + await readCount(connection, `SELECT count(*)::INTEGER AS count FROM page WHERE coalesce(${rule.where ?? 'true'}, false)`))
      await connection.run(`INSERT INTO treated ${sql}`, values)
    }

    // Objects that no rule ties to a habitat: never left out silently
    left += await readCount(connection, `SELECT count(*)::INTEGER AS count FROM page WHERE NOT (${selected})`)
  }
  /* eslint-enable no-await-in-loop */

  await checkFeatures(connection, record, 'ids', 'id')
  await writePivot(connection, pivot, file, fingerprint)
  const counts = [...kept].map(([rule, count]) => `${count} as ${rule.habitat}`).join(', ')
  console.log(`${source.typeName}: ${record.features} objects in ${pages.length} pages, ${counts}, ${left} tied to no habitat, ${((performance.now() - started) / 1000).toFixed(0)} s`)
}
