// The usual treatment of a habitat layer: the objects that a rule selects, each widened by the
// buffer of the rule, then merged into polygons
import type {HabitatRule} from './layer.ts'

// A polygon with more points is simplified before its buffer, by a fortieth of the buffer: 5 m for
// 200 m. GEOS buffers it far faster, for a surface that barely changes. A smaller one, which a
// simplification could erase, is buffered as it is
const simplifiedFrom = 50

// The objects of the page tied to the habitat by the rule, each widened, then merged into polygons.
// A hole that cannot hold a disk of the buffer's radius is filled by the buffer: it is removed
// beforehand, which spares GEOS most of the work. The 0.8 keeps a margin, the buffer being a
// polygon a little smaller than a disk
export function widen(rule: HabitatRule): string {
  return `
    WITH parts AS (
      SELECT unnest(ST_Dump(geom)).geom AS geom FROM page WHERE (${rule.where ?? 'true'})
    ), shapes AS (
      SELECT CASE
        WHEN ST_NumInteriorRings(geom) > 0 THEN ST_MakePolygon(
          rings[1].geom,
          [ring.geom FOR ring IN rings[2:] IF ST_Area(ST_MakePolygon(ring.geom)) >= 0.8 * pi() * $buffer ** 2]
        )
        ELSE geom
      END AS geom
      FROM (SELECT geom, CASE WHEN ST_NumInteriorRings(geom) > 0 THEN ST_Dump(ST_Boundary(geom)) END AS rings FROM parts)
    )
    SELECT $habitat, unnest(ST_Dump(ST_Union_Agg(ST_Buffer(
      CASE WHEN ST_NPoints(geom) > ${simplifiedFrom} THEN ST_MakeValid(ST_Simplify(geom, $buffer / 40)) ELSE geom END,
      $buffer
    )))).geom
    FROM shapes
  `
}
