import type {
  Action,
  Enjeu,
  Espece,
  Habitat,
  Objectif,
  PlanGestion,
  Recommandation,
  SousObjectif,
} from '@pnm/shared'
import {
  data,
  type LoaderFunctionArgs,
  redirect,
  useRouteLoaderData,
} from 'react-router'
import {ApiError, fetchApi} from './api.ts'
import {parcPath} from './parcs.ts'

// The section of a parc that explores the enjeux of its plan de gestion
export const planGestionRouteId = 'planGestion'
export const enjeuxSection = 'enjeux'

export function enjeuxPath(parcId: string): string {
  return parcPath(parcId, enjeuxSection)
}

export function enjeuPath(parcId: string, enjeuId: number): string {
  return `${enjeuxPath(parcId)}/${enjeuId}`
}

// The objectif, as a part of the page of its enjeu
export function objectifAnchor(objectifId: number): string {
  return `objectif-${objectifId}`
}

export function sousObjectifPath(parcId: string, sousObjectifId: number): string {
  return `${enjeuxPath(parcId)}/sous-objectifs/${sousObjectifId}`
}

export function actionPath(parcId: string, actionId: number): string {
  return `${enjeuxPath(parcId)}/actions/${actionId}`
}

export function habitatPath(parcId: string, code: string): string {
  // A code is written as the managers of the parc choose
  return `${enjeuxPath(parcId)}/habitats/${encodeURIComponent(code)}`
}

export function especePath(parcId: string, especeId: number): string {
  return `${enjeuxPath(parcId)}/especes/${especeId}`
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
  // Always set under the enjeux route, which loads it
  return useRouteLoaderData<PlanGestion>(planGestionRouteId)!
}

export function notFound(): never {
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

export function findEspece(plan: PlanGestion, especeId: string | undefined): Espece | undefined {
  return plan.especes.find(espece => String(espece.id) === especeId)
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

export function findSousObjectif(plan: PlanGestion, sousObjectifId: number | string | undefined): SousObjectifPlace | undefined {
  for (const enjeu of plan.enjeux) {
    for (const objectif of enjeu.objectifs) {
      const sousObjectif = objectif.sousObjectifs.find(candidate => String(candidate.id) === String(sousObjectifId))

      if (sousObjectif) {
        return {enjeu, objectif, sousObjectif}
      }
    }
  }

  return undefined
}

// A habitat or an espèce falls under a sous-objectif of the plan
type UnderSousObjectif = {readonly sousObjectif?: number}

// The enjeu of a habitat or an espèce, through its sous-objectif
export function sousObjectifEnjeu(plan: PlanGestion, item: UnderSousObjectif): Enjeu | undefined {
  return item.sousObjectif === undefined ? undefined : findSousObjectif(plan, item.sousObjectif)?.enjeu
}

// Those whose sous-objectif belongs to the enjeu, in the order of the sous-objectifs
function underEnjeu<T extends UnderSousObjectif>(items: readonly T[], enjeu: Enjeu): T[] {
  return enjeu.objectifs.flatMap(objectif => objectif.sousObjectifs.flatMap(sousObjectif => items.filter(item => item.sousObjectif === sousObjectif.id)))
}

export function enjeuHabitats(plan: PlanGestion, enjeu: Enjeu): Habitat[] {
  return underEnjeu(plan.habitats, enjeu)
}

export function enjeuEspeces(plan: PlanGestion, enjeu: Enjeu): Espece[] {
  return underEnjeu(plan.especes, enjeu)
}

export function sousObjectifHabitats(plan: PlanGestion, sousObjectif: SousObjectif): Habitat[] {
  return plan.habitats.filter(habitat => habitat.sousObjectif === sousObjectif.id)
}

export function sousObjectifEspeces(plan: PlanGestion, sousObjectif: SousObjectif): Espece[] {
  return plan.especes.filter(espece => espece.sousObjectif === sousObjectif.id)
}

export function enjeuActions(plan: PlanGestion, enjeu: Enjeu): Action[] {
  return plan.actions.filter(action => action.enjeux.includes(enjeu.id))
}

export function enjeuRecommandations(plan: PlanGestion, enjeu: Enjeu): Recommandation[] {
  return plan.recommandations.filter(recommandation => recommandation.enjeu === enjeu.id)
}

// Where an action stands on a day, from its dates: 2026-11-25
export function actionStatut(action: Action, today: string): string | undefined {
  if (action.debut !== undefined && today < action.debut) {
    return 'À venir'
  }

  if (action.fin !== undefined && action.fin < today) {
    return 'Terminée'
  }

  return action.debut === undefined && action.fin === undefined ? undefined : 'En cours'
}

// The section opens on the first enjeu of the plan
export async function loadEnjeux({params}: LoaderFunctionArgs): Promise<Response> {
  const plan = await fetchPlanGestion(params.parcId!)
  const [first] = plan.enjeux
  return first ? redirect(enjeuPath(params.parcId!, first.id)) : notFound()
}

// A page answers 404 for what the plan does not hold
export async function loadSousObjectif({params}: LoaderFunctionArgs): Promise<undefined> {
  const plan = await fetchPlanGestion(params.parcId!)
  return findSousObjectif(plan, params.sousObjectifId) ? undefined : notFound()
}

export async function loadAction({params}: LoaderFunctionArgs): Promise<undefined> {
  const plan = await fetchPlanGestion(params.parcId!)
  return findAction(plan, params.actionId) ? undefined : notFound()
}

export async function loadEspece({params}: LoaderFunctionArgs): Promise<undefined> {
  const plan = await fetchPlanGestion(params.parcId!)
  return findEspece(plan, params.especeId) ? undefined : notFound()
}
