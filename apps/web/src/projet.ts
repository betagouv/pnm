import type {Activite, Element, Position} from '@pnm/shared'
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

// Positions needed by each type of element, as in the element schema of @pnm/shared
export const minPositions: Record<Element['type'], number> = {lieux: 1, parcours: 2, zone: 3}

// A new element starts with no distance around it: the porteur de projet sets it afterwards
export function createElement(
  type: Element['type'],
  positions: readonly Position[],
  isBoucle: boolean,
): Element | undefined {
  if (positions.length < minPositions[type]) {
    return undefined
  }

  const id = crypto.randomUUID()

  switch (type) {
    case 'lieux': {
      return {
        id, type, positions: [...positions], rayon: 0,
      }
    }

    case 'parcours': {
      return {
        id, type, positions: [...positions], boucle: isBoucle, largeur: 0,
      }
    }

    case 'zone': {
      return {
        id, type, positions: [...positions], marge: 0,
      }
    }
  }
}

// Undefined until the porteur de projet has chosen one in this parc
export function useActivite(parcId: string): Activite | undefined {
  const activites = useActivites()
  const projet = useProjet(parcId)
  return activites.find(activite => activite.id === projet?.activite)
}
