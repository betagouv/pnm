import {
  type DuckDBInstance,
  LIST,
  VARCHAR,
  listValue,
} from '@duckdb/node-api'
import {
  type Croisement,
  type Element,
  type Habitat,
  type HabitatCroise,
  type Position,
  croisementRequestSchema,
} from '@pnm/shared'
import express from 'express'
import type {HabitatsData} from './habitats.ts'
import type {PlansGestion} from './plan-gestion.ts'

// Around the projet, in meters: a habitat this close is listed, with the elements near it, even
// when the projet does not reach it. Value to be confirmed
const tolerance = 50

// The codes of the habitats to cross, typed: a plan without habitats gives an empty list, whose type
// DuckDB cannot guess
const codesType = LIST(VARCHAR) // eslint-disable-line new-cap

function closed(positions: readonly Position[]): Position[] {
  return [...positions, positions[0]!]
}

// What the porteur de projet drew, and the distance around it in meters, as the map of the
// localisation draws them
function footprint(element: Element): {id: string, geometry: unknown, distance: number} {
  switch (element.type) {
    case 'lieux': {
      return {id: element.id, geometry: {type: 'MultiPoint', coordinates: element.positions}, distance: element.rayon}
    }

    // The corridor spreads on both sides of the route
    case 'parcours': {
      const coordinates = element.boucle ? closed(element.positions) : element.positions
      return {id: element.id, geometry: {type: 'LineString', coordinates}, distance: element.largeur / 2}
    }

    case 'zone': {
      return {id: element.id, geometry: {type: 'Polygon', coordinates: [closed(element.positions)]}, distance: element.marge}
    }
  }
}

// Lambert azimuthal equal-area, centered on the projet: exact surfaces, and distances true enough
// over the extent of a projet, in any parc, overseas too
function centeredCrs(localisation: readonly Element[]): string {
  const positions = localisation.flatMap(element => element.positions)
  const longitudes = positions.map(([longitude]) => longitude)
  const latitudes = positions.map(([, latitude]) => latitude)
  const longitude = (Math.min(...longitudes) + Math.max(...longitudes)) / 2
  const latitude = (Math.min(...latitudes) + Math.max(...latitudes)) / 2

  return `+proj=laea +lon_0=${longitude} +lat_0=${latitude} +datum=WGS84 +units=m +no_defs`
}

type HabitatRow = {habitat: string, surface: number, distance: number, elements: string[]}

// Only the habitats of the plan de gestion count
async function cross(instance: DuckDBInstance, contents: Map<string, Habitat>, localisation: readonly Element[]): Promise<Croisement> {
  const connection = await instance.connect()
  const elements = JSON.stringify(localisation.map(element => footprint(element)))
  const crs = centeredCrs(localisation)
  const codes = listValue(Array.from(contents.values(), habitat => habitat.code))

  try {
    // Each element with the distance around it, a lieu without rayon or a parcours without largeur
    // as drawn
    await connection.run(`
      CREATE TEMP TABLE footprints AS
      SELECT id, CASE WHEN distance > 0 THEN ST_Buffer(drawn, distance) ELSE drawn END AS geom
      FROM (
        SELECT
          element.id,
          element.distance,
          ST_MakeValid(ST_Transform(ST_GeomFromGeoJSON(element.geometry), 'EPSG:4326', $crs, always_xy := true)) AS drawn
        FROM (
          SELECT unnest(from_json($elements, '[{"id": "VARCHAR", "geometry": "JSON", "distance": "DOUBLE"}]')) AS element
        )
      )
    `, {elements, crs})
    // What the projet covers, and the extent of the elements with the tolerance, in WGS 84, to read
    // only the habitats around
    await connection.run(`
      CREATE TEMP TABLE projet AS
      SELECT
        coalesce(ST_Union_Agg(geom) FILTER (WHERE ST_Dimension(geom) = 2), ST_GeomFromText('POLYGON EMPTY')) AS surface,
        ST_Extent_Agg(ST_Transform(ST_Buffer(geom, $tolerance), $crs, 'EPSG:4326', always_xy := true)) AS around
      FROM footprints
    `, {crs, tolerance})
    await connection.run(`
      -- Not habitat IN (…): with it, DuckDB 1.5.6 fails to bind bbox in this query
      CREATE TEMP TABLE near AS
      SELECT habitat, ST_Transform(geometry, 'EPSG:4326', $crs, always_xy := true) AS geom
      FROM habitats, projet
      WHERE list_contains($codes, habitat)
        AND bbox.xmin <= ST_XMax(around) AND bbox.xmax >= ST_XMin(around)
        AND bbox.ymin <= ST_YMax(around) AND bbox.ymax >= ST_YMin(around)
    `, {crs, codes}, {codes: codesType})
    // The parts of the projet in each surface: the surfaces of a habitat do not overlap
    await connection.run(`
      CREATE TEMP TABLE inside AS
      SELECT habitat, ST_Intersection(surface, geom) AS geom
      FROM near, projet
      WHERE ST_Intersects(surface, geom)
    `)

    const habitatRows = await connection.runAndReadAll(`
      WITH reached AS (
        SELECT habitat, footprints.id, ST_Distance(footprints.geom, near.geom) AS distance
        FROM footprints JOIN near ON ST_DWithin(footprints.geom, near.geom, $tolerance)
      ), covered AS (
        SELECT habitat, sum(ST_Area(geom)) AS surface FROM inside GROUP BY habitat
      )
      SELECT habitat, coalesce(any_value(covered.surface), 0) AS surface, min(distance) AS distance, list(DISTINCT id) AS elements
      FROM reached LEFT JOIN covered USING (habitat)
      GROUP BY habitat
      ORDER BY surface DESC, distance, habitat
    `, {tolerance})
    const totals = await connection.runAndReadAll(`
      SELECT
        ST_Area(surface) AS surface,
        ST_Area(ST_Difference(surface, coalesce((SELECT ST_Union_Agg(geom) FROM inside), ST_GeomFromText('POLYGON EMPTY')))) AS horsHabitat
      FROM projet
    `)
    const [{surface, horsHabitat}] = totals.getRowObjectsJson() as [{surface: number, horsHabitat: number}]
    const ids = localisation.map(element => element.id)
    const crossed: HabitatCroise[] = (habitatRows.getRowObjectsJson() as HabitatRow[]).map(row => ({
      ...contents.get(row.habitat)!,
      surface: Math.round(row.surface),
      part: surface > 0 ? Math.min(row.surface / surface, 1) : 0,
      // Rounded up: 0 only when they meet
      distance: Math.ceil(row.distance),
      elements: ids.filter(id => row.elements.includes(id)),
    }))

    return {
      surface: Math.round(surface),
      surfaceHorsHabitat: Math.round(horsHabitat),
      tolerance,
      habitats: crossed,
    }
  } finally {
    connection.closeSync()
  }
}

// A parc without a plan de gestion has no habitats to cross
export function createCroisementRouter(habitats: HabitatsData, plans: PlansGestion): express.Router {
  const router = express.Router() // eslint-disable-line new-cap

  router.post('/', express.json(), async (request, response) => {
    const parsed = croisementRequestSchema.safeParse(request.body)

    if (!parsed.success) {
      response.status(400).json({error: 'Bad request', issues: parsed.error.issues})
      return
    }

    const [instance, plan] = await Promise.all([habitats.surfaces(), plans.get(parsed.data.parc)])

    if (!plan) {
      response.status(404).json({error: 'Not found'})
      return
    }

    const contents = new Map(plan.habitats.map(habitat => [habitat.code, habitat]))
    response.json(await cross(instance, contents, parsed.data.localisation))
  })

  return router
}
