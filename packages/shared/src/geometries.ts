import {z} from 'zod'

// Longitude then latitude, in WGS 84, as in GeoJSON
export const positionSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
])

// A closed ring: its last position repeats the first one
const ringSchema = z.array(positionSchema).min(4)

// The outer ring, then the holes
const polygonCoordinatesSchema = z.array(ringSchema).min(1)

export const multiPolygonSchema = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(polygonCoordinatesSchema).min(1),
})

export type Position = z.infer<typeof positionSchema>
export type MultiPolygon = z.infer<typeof multiPolygonSchema>
