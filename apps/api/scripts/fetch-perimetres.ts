// Fetches the perimetre of every parc from the OFB open data, simplified for display.
// Run again when a perimetre changes: npm run perimetres -w @pnm/api
import {writeFile} from 'node:fs/promises'
import {
  multiPolygonSchema,
  parcsSchema,
  type MultiPolygon,
  type Parc,
} from '@pnm/shared'
import simplify from '@turf/simplify'
import parcsData from '../src/parcs.json' with {type: 'json'}

// Layer of the marine protected areas on the OFB GeoServer
const wfsUrl = 'https://wxs.ofb.fr/geoserver/gestion/ows'
const layer = 'gestion:ges_omon_amp_ofb_pol_3857_vue'

// About 20 m: invisible at the zooms where a whole parc is shown
const tolerance = 0.0002
// About 1 m
const decimals = 5

async function fetchPerimetre(parc: Parc): Promise<MultiPolygon> {
  const url = new URL(wfsUrl)
  url.search = new URLSearchParams([
    ['SERVICE', 'WFS'],
    ['VERSION', '2.0.0'],
    ['REQUEST', 'GetFeature'],
    ['TYPENAMES', layer],
    ['OUTPUTFORMAT', 'application/json'],
    ['SRSNAME', 'EPSG:4326'],
    ['CQL_FILTER', `mpa_mnhnid='${parc.mnhnId}'`],
  ]).toString()

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`${parc.id}: WFS answered ${response.status}`)
  }

  const {features} = await response.json() as {features: Array<{geometry: unknown}>}

  if (features.length !== 1) {
    throw new Error(`${parc.id}: ${features.length} perimetres for ${parc.mnhnId}, expected 1`)
  }

  const geometry = multiPolygonSchema.parse(features[0]!.geometry)
  const simplified = simplify(geometry, {tolerance, highQuality: true})
  const factor = 10 ** decimals

  return multiPolygonSchema.parse({
    type: 'MultiPolygon',
    coordinates: simplified.coordinates.map(polygon => polygon.map(ring => ring.map(
      ([longitude, latitude]) => [Math.round(longitude * factor) / factor, Math.round(latitude * factor) / factor],
    ))),
  })
}

const parcs = parcsSchema.parse(parcsData)
const perimetres = await Promise.all(parcs.map(async parc => [parc.id, await fetchPerimetre(parc)] as const))
const path = new URL('../src/perimetres.json', import.meta.url)

await writeFile(path, JSON.stringify(Object.fromEntries(perimetres)) + '\n')

for (const [id, perimetre] of perimetres) {
  const points = perimetre.coordinates.flat().reduce((count, ring) => count + ring.length, 0)
  console.log(`${id}: ${points} points`)
}
