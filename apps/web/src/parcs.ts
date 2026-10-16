import type {Parc} from '@pnm/shared'
import {useRouteLoaderData} from 'react-router'
import {fetchApi} from './api.ts'

export const parcsRouteId = 'root'
export const parcRouteId = 'parc'

export const preparerProjetPath = '/preparer-mon-projet'

export function parcPath(parcId: string, section = 'preparer-mon-projet'): string {
  return `/parcs/${parcId}/${section}`
}

export async function fetchParcs(): Promise<Parc[]> {
  return fetchApi<Parc[]>('/parcs')
}

export function useParcs(): Parc[] {
  return useRouteLoaderData<Parc[]>(parcsRouteId) ?? []
}

// Undefined outside of /parcs/:parcId
export function useParc(): Parc | undefined {
  return useRouteLoaderData<Parc>(parcRouteId)
}
