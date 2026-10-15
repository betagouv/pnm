import express from 'express'
import {z} from 'zod'
import data from './parcs.json' with {type: 'json'}

const parcSchema = z.object({
  id: z.string().regex(/^[a-z]+(?:-[a-z]+)*$/v),
  nom: z.string().min(1),
  nomComplet: z.string().min(1),
  localisation: z.string().min(1),
  disponible: z.boolean(),
})

export type Parc = z.infer<typeof parcSchema>

// Parsed at startup: a malformed edit of parcs.json stops the server instead of reaching users
const parcs = z
  .array(parcSchema)
  .refine(list => new Set(list.map(parc => parc.id)).size === list.length, 'Duplicate parc id')
  .parse(data)

export function createParcsRouter(): express.Router {
  const router = express.Router() // eslint-disable-line new-cap

  router.get('/', (_request, response) => {
    response.json(parcs)
  })

  return router
}
