import type {Activite, Element, Position} from '@pnm/shared'
import {type LoaderFunctionArgs, useRouteLoaderData} from 'react-router'
import {fetchParcs, parcPath} from './parcs.ts'
import {fetchPlanGestion} from './plan-gestion.ts'
import {useProjet} from './projet-storage.ts'

export const projetRouteId = 'projet'

// The steps of "Préparer mon projet", in order, each at /parcs/:parcId/preparer-mon-projet/:step
export const projetSteps = [
  {path: 'activite', titre: 'Votre activité'},
  {path: 'localisation', titre: 'Localisation du projet'},
  {path: 'habitats', titre: 'Habitats concernés'},
  {path: 'recommandations', titre: 'Recommandations'},
] as const

export type ProjetStep = typeof projetSteps[number]

export function projetStepPath(parcId: string, step: ProjetStep['path']): string {
  return `${parcPath(parcId)}/${step}`
}

// The activités of the parc, from its plan de gestion. A parc not yet open has none
export async function loadActivites({params}: LoaderFunctionArgs): Promise<Activite[]> {
  const parcs = await fetchParcs()
  const parc = parcs.find(candidate => candidate.id === params.parcId)

  if (!parc?.disponible) {
    return []
  }

  const plan = await fetchPlanGestion(parc.id)
  return plan.activites
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
