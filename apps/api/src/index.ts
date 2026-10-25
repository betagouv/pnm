import type {Config} from '@pnm/shared'
import express from 'express'
import {createActivitesRouter} from './activites.ts'
import {createHabitatsData, createHabitatsRouter, habitatsTilesFile} from './habitats.ts'
import {createParcsRouter, parcs} from './parcs.ts'
import {createPlansGestion, type PlansGestion} from './plan-gestion.ts'

export type ApiOptions = {
  // Where the API reads the data produced by the processing chain, ending with a slash: a local
  // folder (file:) or an S3 folder
  readonly dataUrl: URL
  // The same data, as the browser reaches it
  readonly publicDataUrl: string
}

// A parc open to porteurs de projet has its plan de gestion
async function checkPlansGestion(plans: PlansGestion): Promise<void> {
  await Promise.all(parcs.filter(parc => parc.disponible).map(async parc => {
    if (!await plans.get(parc.id)) {
      throw new Error(`No plan de gestion for the parc ${parc.id}`)
    }
  }))
}

// Resolves once the data that the API serves are all there and valid: without them, the server does
// not start, and a deployment fails rather than serve broken pages
export async function createApiRouter({dataUrl, publicDataUrl}: ApiOptions): Promise<express.Router> {
  const router = express.Router() // eslint-disable-line new-cap
  const config: Config = {habitatsTilesUrl: `${publicDataUrl}${habitatsTilesFile}`}
  const habitats = createHabitatsData(dataUrl)
  const plans = createPlansGestion(dataUrl)

  await Promise.all([habitats.check(), checkPlansGestion(plans)])

  router.get('/health', (_request, response) => {
    response.json({status: 'ok'})
  })

  router.get('/config', (_request, response) => {
    response.json(config)
  })

  router.use('/activites', createActivitesRouter())
  router.use('/habitats', createHabitatsRouter(habitats))
  router.use('/parcs', createParcsRouter(plans))

  // Unknown API routes must not fall through to the front
  router.use((_request, response) => {
    response.status(404).json({error: 'Not found'})
  })

  // A body that is not JSON, or a failure, answers in JSON too, not with the HTML page of Express
  router.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const status = typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number' ? error.status : 500

    if (status >= 500) {
      console.error(error)
    }

    response.status(status).json({error: status >= 500 ? 'Internal error' : 'Bad request'})
  })

  return router
}
