import type {Parc} from '@pnm/shared'
import {useRouteLoaderData} from 'react-router'

export const parcsRouteId = 'root'
export const parcRouteId = 'parc'

export const preparerProjetPath = '/preparer-mon-projet'

export function parcPath(parcId: string, section = 'preparer-mon-projet'): string {
  return `/parcs/${parcId}/${section}`
}

let parcsRequest: Promise<Parc[]> | undefined

// The list does not change during a visit: every loader shares one request
export async function fetchParcs(): Promise<Parc[]> {
  parcsRequest ??= requestParcs()

  try {
    return await parcsRequest
  } catch (error) {
    // Lets the next navigation try again
    parcsRequest = undefined
    throw error
  }
}

async function requestParcs(): Promise<Parc[]> {
  const response = await fetch('/api/parcs')

  if (!response.ok) {
    throw new Error(`GET /api/parcs failed with status ${response.status}`)
  }

  return response.json() as Promise<Parc[]>
}

export function useParcs(): Parc[] {
  return useRouteLoaderData<Parc[]>(parcsRouteId) ?? []
}

// Undefined outside of /parcs/:parcId
export function useParc(): Parc | undefined {
  return useRouteLoaderData<Parc>(parcRouteId)
}
