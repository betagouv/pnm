import {existsSync} from 'node:fs'
import type {Server} from 'node:http'
import {join} from 'node:path'
import {createDevMiddleware, distDir} from '@pnm/web/serve'
import express from 'express'

export async function serveWeb(
  app: express.Express,
  server: Server,
  mode: 'development' | 'production',
): Promise<void> {
  if (mode === 'development') {
    app.use(await createDevMiddleware(server))
    return
  }

  const indexHtml = join(distDir, 'index.html')

  if (!existsSync(indexHtml)) {
    throw new Error(`Front build not found in ${distDir}, run "npm run build" first`)
  }

  const assetsDir = join(distDir, 'assets')

  app.use(
    express.static(distDir, {
      index: false,
      setHeaders(response, filePath) {
        // Vite fingerprints the files it emits in assets/
        if (filePath.startsWith(assetsDir)) {
          response.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        }
      },
    }),
  )

  // Client-side routing: every other page gets the front's entry point
  app.get('/{*path}', (_request, response) => {
    response.setHeader('Cache-Control', 'no-cache')
    response.sendFile(indexHtml)
  })
}
