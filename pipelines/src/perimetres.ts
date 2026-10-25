// The perimetre of every parc naturel marin, keyed by its INPN id, from the marine protected
// areas of the OFB, simplified for display. npm run perimetres -w @pnm/pipelines
import {mkdir, writeFile} from 'node:fs/promises'
import {type MultiPolygon, multiPolygonSchema} from '@pnm/shared'
import {connect, loadRaw} from './lib/duckdb.ts'
import {airesMarinesProtegees} from './sources.ts'

// About 20 m: invisible at the zooms where a whole parc is shown
const tolerance = 0.0002
// About 1 m
const precision = 1e-5

const output = new URL('../../data/dist/perimetres.json', import.meta.url)

const connection = await connect()
await loadRaw(connection, airesMarinesProtegees, 'aires', ['mpa_mnhnid', 'des_desigfr'])

const reader = await connection.runAndReadAll(`
  SELECT
    mpa_mnhnid AS "mnhnId",
    ST_AsGeoJSON(ST_Multi(ST_ReducePrecision(ST_SimplifyPreserveTopology(
      ST_Transform(geom, $crs, 'EPSG:4326', always_xy := true),
      $tolerance
    ), $precision)))::VARCHAR AS perimetre
  FROM aires
  WHERE des_desigfr = 'Parc naturel marin'
  ORDER BY "mnhnId"
`, {crs: airesMarinesProtegees.crs, tolerance, precision})
const rows = reader.getRowObjectsJson() as Array<{mnhnId: unknown, perimetre: string}>

if (rows.length === 0) {
  throw new Error('No parc naturel marin among the marine protected areas')
}

const perimetres = new Map<string, MultiPolygon>()

for (const {mnhnId, perimetre} of rows) {
  if (typeof mnhnId !== 'string' || perimetres.has(mnhnId)) {
    throw new Error(`Parc naturel marin with a missing or repeated INPN id: ${String(mnhnId)}`)
  }

  perimetres.set(mnhnId, multiPolygonSchema.parse(JSON.parse(perimetre)))
}

await mkdir(new URL('.', output), {recursive: true})
await writeFile(output, JSON.stringify(Object.fromEntries(perimetres)) + '\n')

for (const [mnhnId, {coordinates}] of perimetres) {
  const points = coordinates.flat().reduce((count, ring) => count + ring.length, 0)
  console.log(`${mnhnId}: ${points} points`)
}
