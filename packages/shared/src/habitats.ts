import {z} from 'zod'

export const recommandationSchema = z.object({
  // The activité it is meant for, in words
  activite: z.string().min(1).optional(),
  texte: z.string().min(1).optional(),
  // Where the recommandation is laid out, POOLPE for one
  lien: z.url().optional(),
  // An avis that goes with it, as a document
  avis: z.url().optional(),
})

// What the plan de gestion of a parc says of a habitat élémentaire
export const habitatSchema = z.object({
  // Code habitat élémentaire, as the managers of the parc write it: 1120-1 for the herbiers à
  // posidonie
  code: z.string().min(1),
  nom: z.string().min(1),
  // The habitat générique it belongs to: 1120 for the herbiers de Posidonia
  habitatGenerique: z.object({
    code: z.string().min(1),
    nom: z.string().min(1),
  }).optional(),
  // A short presentation, in paragraphs separated by a blank line
  synthese: z.string().min(1).optional(),
  // The id of the sous-objectif of the plan de gestion that it falls under
  sousObjectif: z.number().int().positive().optional(),
  recommandations: z.array(recommandationSchema),
})

// The habitats that the surfaces produced by the processing chain cover, and the layers they come
// from
export const cartographieSchema = z.object({
  code: habitatSchema.shape.code,
  layers: z.array(z.string().min(1)).min(1),
})

export const cartographiesSchema = z.array(cartographieSchema)

export type Recommandation = z.infer<typeof recommandationSchema>
export type Habitat = z.infer<typeof habitatSchema>
export type Cartographie = z.infer<typeof cartographieSchema>
