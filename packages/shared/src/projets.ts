import {z} from 'zod'
import {activiteSchema} from './activites.ts'
import {parcSchema} from './parcs.ts'

// What the porteur de projet has described so far, filled in step by step
export const projetSchema = z.object({
  parc: parcSchema.shape.id,
  activite: activiteSchema.shape.id.optional(),
})

export type Projet = z.infer<typeof projetSchema>
