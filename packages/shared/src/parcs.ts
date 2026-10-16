import {z} from 'zod'

export const parcSchema = z.object({
  id: z.string().regex(/^[a-z]+(?:-[a-z]+)*$/v),
  nom: z.string().min(1),
  nomComplet: z.string().min(1),
  localisation: z.string().min(1),
  disponible: z.boolean(),
  // Identifier of the protected area in the national register (INPN), e.g. "FR9100008"
  mnhnId: z.string().regex(/^FR\d{7}$/v),
})

export const parcsSchema = z
  .array(parcSchema)
  .refine(list => new Set(list.map(parc => parc.id)).size === list.length, 'Duplicate parc id')

export type Parc = z.infer<typeof parcSchema>
