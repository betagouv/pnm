const requests = new Map<string, Promise<unknown>>()

// An answer of the API that is not a success, with its status: 404 for a resource it does not know
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// The API data does not change during a visit: every loader shares one request per path
export async function fetchApi<T>(path: string): Promise<T> {
  let request = requests.get(path)

  if (!request) {
    request = requestApi(path)
    requests.set(path, request)
  }

  try {
    return await (request as Promise<T>)
  } catch (error) {
    // Lets the next navigation try again
    requests.delete(path)
    throw error
  }
}

// The same body gets the same answer during a visit: one request per path and body
export async function postApi<T>(path: string, body: unknown): Promise<T> {
  const json = JSON.stringify(body)
  const key = `POST ${path} ${json}`
  let request = requests.get(key)

  if (!request) {
    request = requestApi(path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: json})
    requests.set(key, request)
  }

  try {
    return await (request as Promise<T>)
  } catch (error) {
    requests.delete(key)
    throw error
  }
}

async function requestApi(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`/api${path}`, init)

  if (!response.ok) {
    throw new ApiError(`${init?.method ?? 'GET'} /api${path} failed with status ${response.status}`, response.status)
  }

  return response.json()
}
