import {z} from 'zod'

export const activiteSchema = z.object({
  id: z.string().regex(/^[a-z]+(?:-[a-z]+)*$/v),
  nom: z.string().min(1),
  description: z.string().min(1),
  // A DSFR pictogram, as "<category>/<name>": "institutions/navy-anchor"
  pictogramme: z.string().regex(/^[a-z]+\/[a-z]+(?:-[a-z]+)*$/v),
})

export const activitesSchema = z
  .array(activiteSchema)
  .refine(list => new Set(list.map(activite => activite.id)).size === list.length, 'Duplicate activite id')

export type Activite = z.infer<typeof activiteSchema>
