import {z} from 'zod'

// A piece of news from a parc. Its source is still to be chosen
export const actualiteSchema = z.object({
  id: z.string().min(1),
  titre: z.string().min(1),
  resume: z.string().min(1),
  date: z.iso.date(),
  // What it is about, as shown: "Suivi scientifique"
  categorie: z.string().min(1),
  // A DSFR pictogram to illustrate it, as "<category>/<name>": "environment/leaf"
  pictogramme: z.string().regex(/^[a-z]+\/[a-z]+(?:-[a-z]+)*$/v).optional(),
})

export type Actualite = z.infer<typeof actualiteSchema>
