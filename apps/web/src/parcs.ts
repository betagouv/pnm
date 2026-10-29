import type {MultiPolygon, Parc} from '@pnm/shared'
import {useRouteLoaderData} from 'react-router'
import {fetchApi} from './api.ts'

export const parcsRouteId = 'root'
export const parcRouteId = 'parc'

export const preparerProjetPath = '/preparer-mon-projet'

export function parcPath(parcId: string, section = 'preparer-mon-projet'): string {
  return `/parcs/${parcId}/${section}`
}

// The home page of the parc
export function parcHomePath(parcId: string): string {
  return `/parcs/${parcId}`
}

export async function fetchParcs(): Promise<Parc[]> {
  return fetchApi<Parc[]>('/parcs')
}

export async function fetchPerimetre(parcId: string): Promise<MultiPolygon> {
  return fetchApi<MultiPolygon>(`/parcs/${parcId}/perimetre`)
}

export function useParcs(): Parc[] {
  return useRouteLoaderData<Parc[]>(parcsRouteId) ?? []
}

// Undefined outside of /parcs/:parcId
export function useParc(): Parc | undefined {
  return useRouteLoaderData<Parc>(parcRouteId)
}
