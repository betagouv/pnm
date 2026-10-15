import express from 'express'

export function createApiRouter(): express.Router {
  const router = express.Router() // eslint-disable-line new-cap

  router.get('/health', (_request, response) => {
    response.json({status: 'ok'})
  })

  // Unknown API routes must not fall through to the front
  router.use((_request, response) => {
    response.status(404).json({error: 'Not found'})
  })

  return router
}
