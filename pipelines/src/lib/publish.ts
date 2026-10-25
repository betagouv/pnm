// Publishes the pivot files of the layers. The pieces of a habitat that touch, from one page or one
// layer to the other, become one surface: merged in WGS 84, as merging measures no distance. The
// surfaces are written for crossing with a projet (GeoParquet) and for display (PMTiles)
import {spawn} from 'node:child_process'
import {once} from 'node:events'
import {join} from 'node:path'
import type {DuckDBConnection} from '@duckdb/node-api'
import {quoteLiteral, readRows} from './duckdb.ts'

export type Publication = {
  // The pivot files of the layers
  readonly pieces: string[]
  readonly parquet: string
  readonly pmtiles: string
  // The name of the layer in the tiles
  readonly tileLayer: string
  // Where intermediate files go
  readonly workDir: string
}

async function run(command: string, args: string[]): Promise<void> {
  const child = spawn(command, args, {stdio: 'inherit'})
  const [code] = await once(child, 'close') as [unknown]

  if (code !== 0) {
    throw new Error(`${command} exited with ${String(code)}`)
  }
}

export async function publish(connection: DuckDBConnection, {
  pieces, parquet, pmtiles, tileLayer, workDir,
}: Publication): Promise<void> {
  let started = performance.now()
  await connection.run(`CREATE VIEW pieces AS SELECT habitat, geom FROM read_parquet([${pieces.map(file => quoteLiteral(file)).join(', ')}])`)
  await connection.run(`
    CREATE TABLE surfaces AS
    SELECT habitat, unnest(ST_Dump(merged)).geom AS geometry
    FROM (SELECT habitat, ST_Union_Agg(geom) AS merged FROM pieces GROUP BY habitat)
  `)
  console.log(`Merged in ${((performance.now() - started) / 1000).toFixed(0)} s`)

  const summary = await readRows<{habitat: string, merged: number, surfaces: number, points: number, km2: number}>(connection, `
    SELECT habitat, merged, count(*)::INTEGER AS surfaces, sum(ST_NPoints(geometry))::INTEGER AS points, round(sum(ST_Area_Spheroid(geometry)) / 1e6)::INTEGER AS km2
    FROM surfaces JOIN (SELECT habitat, count(*)::INTEGER AS merged FROM pieces GROUP BY habitat) USING (habitat)
    GROUP BY habitat, merged ORDER BY habitat
  `)

  for (const {habitat, merged, surfaces, points, km2} of summary) {
    console.log(`${habitat}: ${merged} pieces merged into ${surfaces} surfaces, ${points} points, ${km2} km²`)
  }

  // For crossing with a projet. Neighbouring surfaces share row groups, along a Hilbert curve: a
  // reader that filters on bbox skips the row groups far from its projet. DuckDB does not, on the
  // geometry alone. It writes no row group under 2048 rows
  await connection.run(`
    COPY (
      SELECT
        habitat, geometry,
        {xmin: ST_XMin(geometry), ymin: ST_YMin(geometry), xmax: ST_XMax(geometry), ymax: ST_YMax(geometry)} AS bbox
      FROM surfaces
      ORDER BY ST_Hilbert(geometry, (SELECT ST_Extent(ST_Extent_Agg(geometry)) FROM surfaces))
    ) TO ${quoteLiteral(parquet)} (FORMAT parquet, COMPRESSION zstd, ROW_GROUP_SIZE 2048)
  `)

  // For display: tippecanoe cuts the tiles, and merges surfaces of a crowded tile rather than leave
  // some out
  started = performance.now()
  const flatgeobuf = join(workDir, `${tileLayer}.fgb`)
  await connection.run(`COPY surfaces TO ${quoteLiteral(flatgeobuf)} (FORMAT GDAL, DRIVER 'FlatGeobuf', SRS 'EPSG:4326')`)
  await run('tippecanoe', [
    '--output',
    pmtiles,
    '--force',
    '--layer',
    tileLayer,
    '-zg',
    '--coalesce-densest-as-needed',
    '--extend-zooms-if-still-dropping',
    '--no-progress-indicator',
    flatgeobuf,
  ])
  console.log(`Tiled in ${((performance.now() - started) / 1000).toFixed(0)} s`)
}
