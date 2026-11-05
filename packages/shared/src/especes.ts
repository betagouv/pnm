import {z} from 'zod'
import {habitatSchema} from './habitats.ts'

// A species that a projet may meet in a parc. It lives in some habitats, or anywhere in the parc
// when it names none. Its source is still to be chosen, and with it its cdnom
export const especeSchema = z.object({
  nom: z.string().min(1),
  nomScientifique: z.string().min(1),
  // Its protection, as shown: "Protégée"
  statut: z.string().min(1),
  description: z.string().min(1).optional(),
  // By code habitat élémentaire
  habitats: z.array(habitatSchema.shape.code),
})

export type Espece = z.infer<typeof especeSchema>
