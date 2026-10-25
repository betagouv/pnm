import {z} from 'zod'

// What the front needs to know about where things are served
export const configSchema = z.object({
  // Where the browser reads the tiles of the habitats, among the data produced by the processing
  // chain
  habitatsTilesUrl: z.string().min(1),
})

export type Config = z.infer<typeof configSchema>
