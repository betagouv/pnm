import {multiPolygonSchema, parcsSchema} from '@pnm/shared'
import express from 'express'
import data from './parcs.json' with {type: 'json'}
import perimetresData from './perimetres.json' with {type: 'json'}

// Parsed at startup: a malformed edit of parcs.json stops the server instead of reaching users
const parcs = parcsSchema.parse(data)

// Produced by the processing chain (pipelines/), keyed by the INPN id of each parc
const perimetres = new Map(Object.entries(perimetresData).map(([mnhnId, perimetre]) => {
  const parc = parcs.find(candidate => candidate.mnhnId === mnhnId)

  if (!parc) {
    throw new Error(`perimetres.json: no parc with the INPN id ${mnhnId}`)
  }

  return [parc.id, multiPolygonSchema.parse(perimetre)]
}))

export function createParcsRouter(): express.Router {
  const router = express.Router() // eslint-disable-line new-cap

  router.get('/', (_request, response) => {
    response.json(parcs)
  })

  router.get('/:parcId/perimetre', (request, response) => {
    const perimetre = perimetres.get(request.params.parcId)

    if (!perimetre) {
      response.status(404).json({error: 'Not found'})
      return
    }

    response.json(perimetre)
  })

  return router
}
