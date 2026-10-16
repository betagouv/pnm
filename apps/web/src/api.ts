const requests = new Map<string, Promise<unknown>>()

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

async function requestApi(path: string): Promise<unknown> {
  const response = await fetch(`/api${path}`)

  if (!response.ok) {
    throw new Error(`GET /api${path} failed with status ${response.status}`)
  }

  return response.json()
}
