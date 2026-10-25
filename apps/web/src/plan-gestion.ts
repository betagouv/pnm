import type {
  Action,
  Enjeu,
  Habitat,
  Objectif,
  PlanGestion,
  SousObjectif,
} from '@pnm/shared'
import {data, type LoaderFunctionArgs, useRouteLoaderData} from 'react-router'
import {ApiError, fetchApi} from './api.ts'
import {parcPath} from './parcs.ts'

export const planGestionRouteId = 'planGestion'

export function planGestionPath(parcId: string): string {
  return parcPath(parcId, 'plan-de-gestion')
}

export function enjeuPath(parcId: string, enjeuId: number): string {
  return `${planGestionPath(parcId)}/enjeux/${enjeuId}`
}

// The objectif, as a section of the page of its enjeu
export function objectifAnchor(objectifId: number): string {
  return `objectif-${objectifId}`
}

export function sousObjectifAnchor(sousObjectifId: number): string {
  return `sous-objectif-${sousObjectifId}`
}

export function actionPath(parcId: string, actionId: number): string {
  return `${planGestionPath(parcId)}/actions/${actionId}`
}

export function habitatPath(parcId: string, code: string): string {
  // A code is written as the managers of the parc choose
  return `${planGestionPath(parcId)}/habitats/${encodeURIComponent(code)}`
}

// The plan de gestion of a parc; a parc without one answers 404
export async function fetchPlanGestion(parcId: string): Promise<PlanGestion> {
  try {
    return await fetchApi<PlanGestion>(`/parcs/${parcId}/plan-de-gestion`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw data(null, {status: 404})
    }

    throw error
  }
}

export async function loadPlanGestion({params}: LoaderFunctionArgs): Promise<PlanGestion> {
  return fetchPlanGestion(params.parcId!)
}

export function usePlanGestion(): PlanGestion {
  // Always set under the plan de gestion route, which loads it
  return useRouteLoaderData<PlanGestion>(planGestionRouteId)!
}

function notFound(): never {
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw data(null, {status: 404})
}

export function findEnjeu(plan: PlanGestion, enjeuId: string | undefined): Enjeu | undefined {
  return plan.enjeux.find(enjeu => String(enjeu.id) === enjeuId)
}

export function findAction(plan: PlanGestion, actionId: string | undefined): Action | undefined {
  return plan.actions.find(action => String(action.id) === actionId)
}

export function findHabitat(plan: PlanGestion, code: string | undefined): Habitat | undefined {
  return plan.habitats.find(habitat => habitat.code === code)
}

// A page of the plan de gestion answers 404 for what the plan does not hold
export async function loadEnjeu({params}: LoaderFunctionArgs): Promise<undefined> {
  const plan = await fetchPlanGestion(params.parcId!)
  return findEnjeu(plan, params.enjeuId) ? undefined : notFound()
}

export async function loadAction({params}: LoaderFunctionArgs): Promise<undefined> {
  const plan = await fetchPlanGestion(params.parcId!)
  return findAction(plan, params.actionId) ? undefined : notFound()
}

export type ObjectifPlace = {
  readonly enjeu: Enjeu
  readonly objectif: Objectif
}

export type SousObjectifPlace = ObjectifPlace & {
  readonly sousObjectif: SousObjectif
}

export function findObjectif(plan: PlanGestion, objectifId: number): ObjectifPlace | undefined {
  for (const enjeu of plan.enjeux) {
    const objectif = enjeu.objectifs.find(candidate => candidate.id === objectifId)

    if (objectif) {
      return {enjeu, objectif}
    }
  }

  return undefined
}

export function findSousObjectif(plan: PlanGestion, sousObjectifId: number): SousObjectifPlace | undefined {
  for (const enjeu of plan.enjeux) {
    for (const objectif of enjeu.objectifs) {
      const sousObjectif = objectif.sousObjectifs.find(candidate => candidate.id === sousObjectifId)

      if (sousObjectif) {
        return {enjeu, objectif, sousObjectif}
      }
    }
  }

  return undefined
}

// The habitats whose sous-objectif belongs to the enjeu
export function enjeuHabitats(plan: PlanGestion, enjeu: Enjeu): Habitat[] {
  const sousObjectifs = new Set(enjeu.objectifs.flatMap(objectif => objectif.sousObjectifs.map(sousObjectif => sousObjectif.id)))
  return plan.habitats.filter(habitat => habitat.sousObjectif !== undefined && sousObjectifs.has(habitat.sousObjectif))
}

export function enjeuActions(plan: PlanGestion, enjeu: Enjeu): Action[] {
  return plan.actions.filter(action => action.enjeux.includes(enjeu.id))
}
