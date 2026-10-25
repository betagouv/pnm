// Reading the data produced by the processing chain, at an address: a local folder (file:) or an S3
// folder over HTTPS. A reading goes through a promise: the data need not all stay in memory
import {readFile, stat} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'

// Loads once, when first needed, and keeps the result. A load that fails is tried again the next
// time
export function lazily<T>(load: () => Promise<T>): () => Promise<T> {
  let loading: Promise<T> | undefined

  return async () => {
    loading ??= load().catch((error: unknown) => {
      loading = undefined
      throw error
    })
    return loading
  }
}

function isMissing(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

async function readText(url: URL): Promise<string | undefined> {
  if (url.protocol === 'file:') {
    try {
      return await readFile(url, 'utf8')
    } catch (error) {
      if (isMissing(error)) {
        return undefined
      }

      throw error
    }
  }

  const response = await fetch(url)

  if (response.status === 404) {
    return undefined
  }

  if (!response.ok) {
    throw new Error(`${url.href}: ${response.status}`)
  }

  return response.text()
}

// The JSON at an address, checked by a schema, or undefined when there is none. An error names the
// address
export async function readJson<T>(url: URL, schema: {parse: (data: unknown) => T}): Promise<T | undefined> {
  const text = await readText(url)

  if (text === undefined) {
    return undefined
  }

  try {
    return schema.parse(JSON.parse(text))
  } catch (error) {
    throw new Error(`${url.href}: ${(error as Error).message}`, {cause: error})
  }
}

export async function isPresent(url: URL): Promise<boolean> {
  if (url.protocol === 'file:') {
    try {
      await stat(url)
      return true
    } catch (error) {
      if (isMissing(error)) {
        return false
      }

      throw error
    }
  }

  const response = await fetch(url, {method: 'HEAD'})

  if (response.status === 404) {
    return false
  }

  if (!response.ok) {
    throw new Error(`${response.url}: ${response.status}`)
  }

  return true
}

// An address as DuckDB reads it: a path for a local file
export function duckdbLocation(url: URL): string {
  return url.protocol === 'file:' ? fileURLToPath(url) : url.href
}
