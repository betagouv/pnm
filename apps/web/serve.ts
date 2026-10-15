import type {Server} from 'node:http'
import {fileURLToPath} from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

export const distDir = fileURLToPath(new URL('dist', import.meta.url))

export async function createDevMiddleware(httpServer: Server) {
  // Vite is a dev dependency: only load it in development
  const {createServer} = await import('vite')

  const vite = await createServer({
    root,
    appType: 'spa',
    server: {middlewareMode: true, hmr: {server: httpServer}},
  })

  return vite.middlewares
}
