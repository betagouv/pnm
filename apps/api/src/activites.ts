import {activitesSchema} from '@pnm/shared'
import express from 'express'
import data from './activites.json' with {type: 'json'}

// Parsed at startup: a malformed edit of activites.json stops the server instead of reaching users
const activites = activitesSchema.parse(data)

export function createActivitesRouter(): express.Router {
  const router = express.Router() // eslint-disable-line new-cap

  router.get('/', (_request, response) => {
    response.json(activites)
  })

  return router
}
