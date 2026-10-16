import type {Activite} from '@pnm/shared'
import {useRouteLoaderData} from 'react-router'
import {fetchApi} from './api.ts'
import {parcPath} from './parcs.ts'
import {useProjet} from './projet-storage.ts'

export const projetRouteId = 'projet'

// The steps of "Préparer mon projet", in order, each at /parcs/:parcId/preparer-mon-projet/:step
export const projetSteps = [
  {path: 'activite', titre: 'Votre activité'},
  {path: 'localisation', titre: 'Localisation du projet'},
  {path: 'mesures', titre: 'Mesures à prendre'},
] as const

export type ProjetStep = typeof projetSteps[number]

export function projetStepPath(parcId: string, step: ProjetStep['path']): string {
  return `${parcPath(parcId)}/${step}`
}

export async function fetchActivites(): Promise<Activite[]> {
  return fetchApi<Activite[]>('/activites')
}

export function useActivites(): Activite[] {
  return useRouteLoaderData<Activite[]>(projetRouteId) ?? []
}

// Undefined until the porteur de projet has chosen one in this parc
export function useActivite(parcId: string): Activite | undefined {
  const activites = useActivites()
  const projet = useProjet(parcId)
  return activites.find(activite => activite.id === projet?.activite)
}
