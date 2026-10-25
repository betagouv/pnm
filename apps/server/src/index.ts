import {createServer} from 'node:http'
import process from 'node:process'
import {fileURLToPath} from 'node:url'
import {createApiRouter} from '@pnm/api'
import express from 'express'
import {serveWeb} from './web.ts'

const mode = process.env.NODE_ENV === 'development' ? 'development' : 'production'
const port = Number(process.env.PORT ?? 3000)

// Where the data produced by the processing chain are read: an S3 folder over HTTPS in production,
// given by DATA_URL. Without it, the folder where the chain writes them, which this server serves
// under /data, as an S3 folder would
const dataSetting = process.env.DATA_URL === '' ? undefined : process.env.DATA_URL
const dataDir = new URL('../../../data/dist/', import.meta.url)
const dataUrl = dataSetting === undefined ? dataDir : new URL(dataSetting.replace(/\/?$/v, '/'))
const publicDataUrl = dataSetting === undefined ? '/data/' : dataUrl.href

const app = express()
app.disable('x-powered-by')

// Express types its request handler as returning `any`
const server = createServer(app) // eslint-disable-line @typescript-eslint/strict-void-return

if (dataSetting === undefined) {
  // A missing file is a 404, not the front's entry point
  app.use('/data', express.static(fileURLToPath(dataDir), {index: false}), (_request, response) => {
    response.sendStatus(404)
  })
}

// Without its data, the server does not start
app.use('/api', await createApiRouter({dataUrl, publicDataUrl}))
await serveWeb(app, server, mode)

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port} (${mode}), data from ${dataUrl.href}`)
})
