import {parcsSchema} from '@pnm/shared'
import express from 'express'
import data from './parcs.json' with {type: 'json'}

// Parsed at startup: a malformed edit of parcs.json stops the server instead of reaching users
const parcs = parcsSchema.parse(data)

export function createParcsRouter(): express.Router {
  const router = express.Router() // eslint-disable-line new-cap

  router.get('/', (_request, response) => {
    response.json(parcs)
  })

  return router
}
