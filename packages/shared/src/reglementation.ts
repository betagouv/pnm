import {z} from 'zod'
import {habitatSchema} from './habitats.ts'
import {activiteSchema} from './plan-gestion.ts'

// What a regle asks of a projet, from the strongest
export const niveauRegleSchema = z.enum(['interdiction', 'avisConforme', 'autorisation', 'declaration'])

// A regle of the réglementation in a parc. Like a recommandation, it may be meant for some activités,
// for some habitats, or both; without either, it holds for every projet in the parc. Its source is
// still to be chosen
export const regleSchema = z.object({
  id: z.string().min(1),
  niveau: niveauRegleSchema,
  titre: z.string().min(1),
  activites: z.array(activiteSchema.shape.id),
  // By code habitat élémentaire
  habitats: z.array(habitatSchema.shape.code),
})

export type NiveauRegle = z.infer<typeof niveauRegleSchema>
export type Regle = z.infer<typeof regleSchema>
