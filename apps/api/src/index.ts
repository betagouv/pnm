import express from 'express'
import {createParcsRouter} from './parcs.ts'

export function createApiRouter(): express.Router {
  const router = express.Router() // eslint-disable-line new-cap

  router.get('/health', (_request, response) => {
    response.json({status: 'ok'})
  })

  router.use('/parcs', createParcsRouter())

  // Unknown API routes must not fall through to the front
  router.use((_request, response) => {
    response.status(404).json({error: 'Not found'})
  })

  return router
}
