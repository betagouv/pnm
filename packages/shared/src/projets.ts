import {z} from 'zod'
import {positionSchema} from './geometries.ts'
import {parcSchema} from './parcs.ts'
import {activiteSchema} from './plan-gestion.ts'

// In meters
const distanceSchema = z.number().int().min(0)

export const elementIdSchema = z.string().min(1)

// One part of the localisation of a projet. Each part keeps what the porteur de projet drew and
// the distance around it, not the area computed from them
export const elementSchema = z.discriminatedUnion('type', [
  // A series of points: moorings, sampling stations…
  z.object({
    id: elementIdSchema,
    type: z.literal('lieux'),
    positions: z.array(positionSchema).min(1),
    rayon: distanceSchema,
  }),
  // A route, open or closed: a race circuit, a hike at sea…
  z.object({
    id: elementIdSchema,
    type: z.literal('parcours'),
    positions: z.array(positionSchema).min(2),
    // The route comes back to its first position
    boucle: z.boolean(),
    largeur: distanceSchema,
  }),
  // An area, given by its corners
  z.object({
    id: elementIdSchema,
    type: z.literal('zone'),
    positions: z.array(positionSchema).min(3),
    marge: distanceSchema,
  }),
])

// What the porteur de projet has described so far, filled in step by step
export const projetSchema = z.object({
  parc: parcSchema.shape.id,
  activite: activiteSchema.shape.id.optional(),
  localisation: z.array(elementSchema).optional(),
})

export type Element = z.infer<typeof elementSchema>
export type Projet = z.infer<typeof projetSchema>
