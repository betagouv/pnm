// The pivot format, where the layers meet: one Parquet file per layer, each row a habitat and a
// surface in WGS 84, longitude first, the CRS84 that GeoParquet assumes. A file carries the
// fingerprint of what produced it
import type {DuckDBConnection} from '@duckdb/node-api'
import {quoteLiteral, readRows} from './duckdb.ts'

// The habitats and geometries of a relation, given in a projection, as the pivot format holds them
export function pivotSelect(relation: string, crs: string): string {
  return `SELECT habitat, ST_Transform(geom, ${quoteLiteral(crs)}, 'EPSG:4326', always_xy := true) AS geom FROM ${relation}`
}

export async function writePivot(connection: DuckDBConnection, select: string, file: string, fingerprint: string): Promise<void> {
  await connection.run(`
    COPY (${select})
    TO ${quoteLiteral(file)} (FORMAT parquet, COMPRESSION zstd, KV_METADATA {fingerprint: ${quoteLiteral(fingerprint)}})
  `)
}

// What produced a pivot file, or nothing when it is missing or was cut short
export async function readFingerprint(connection: DuckDBConnection, file: string): Promise<string | undefined> {
  try {
    const [row] = await readRows<{value: string}>(connection, `
      SELECT decode(value) AS value FROM parquet_kv_metadata(${quoteLiteral(file)}) WHERE decode(key) = 'fingerprint'
    `)
    return row?.value
  } catch {
    return undefined
  }
}
