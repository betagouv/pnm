import {z} from 'zod'
import {habitatSchema} from './habitats.ts'
import {parcSchema} from './parcs.ts'
import {elementIdSchema, elementSchema} from './projets.ts'

// The localisation of a projet, to cross with the data of its parc
export const croisementRequestSchema = z.object({
  parc: parcSchema.shape.id,
  localisation: z.array(elementSchema).min(1),
})

// In square meters
const surfaceSchema = z.number().int().min(0)

export const habitatCroiseSchema = habitatSchema.extend({
  // The part of the projet that lies in the habitat
  surface: surfaceSchema,
  // That part over the surface of the projet, from 0 to 1. Habitats may overlap: the parts of
  // several habitats can add up to more than 1
  part: z.number().min(0).max(1),
  // From the projet to the habitat, in meters: 0 when they meet
  distance: z.number().int().min(0),
  // The elements of the projet near the habitat, in the order of the localisation
  elements: z.array(elementIdSchema).min(1),
})

// What the localisation of a projet meets, in figures, without geometries. Only the habitats of the
// plan de gestion of its parc for now; species and zones de gouvernance will come next to them
export const croisementSchema = z.object({
  // Covered by the elements of the projet with the distance around them. A lieu without rayon
  // or a parcours without largeur covers none
  surface: surfaceSchema,
  // The part of that surface in no habitat
  surfaceHorsHabitat: surfaceSchema,
  // In meters: a habitat this close to the projet is listed, even when the projet does not reach it
  tolerance: z.number().int().min(0),
  // The habitats near the projet, the largest part first
  habitats: z.array(habitatCroiseSchema),
})

export type CroisementRequest = z.infer<typeof croisementRequestSchema>
export type HabitatCroise = z.infer<typeof habitatCroiseSchema>
export type Croisement = z.infer<typeof croisementSchema>
