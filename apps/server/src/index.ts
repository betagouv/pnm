import {createServer} from 'node:http'
import process from 'node:process'
import {createApiRouter} from '@pnm/api'
import express from 'express'
import {serveWeb} from './web.ts'

const mode = process.env.NODE_ENV === 'development' ? 'development' : 'production'
const port = Number(process.env.PORT ?? 3000)

const app = express()
app.disable('x-powered-by')

// Express types its request handler as returning `any`
const server = createServer(app) // eslint-disable-line @typescript-eslint/strict-void-return

app.use('/api', createApiRouter())
await serveWeb(app, server, mode)

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port} (${mode})`)
})
