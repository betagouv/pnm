import type {Croisement, PlanGestion, Recommandation} from '@pnm/shared'
import type {LoaderFunctionArgs} from 'react-router'
import {fetchCroisement} from './habitats.ts'
import {fetchPlanGestion} from './plan-gestion.ts'
import {readProjet} from './projet-storage.ts'

// The recommandations of the plan de gestion for a projet. One meant for activités needs that of the
// projet, one meant for habitats needs one of them among those the projet concerns: inside it or
// near it. One that names neither is for every projet. Without the habitats of the projet, those
// meant for habitats are left out
export function selectRecommandations(
  recommandations: readonly Recommandation[],
  activite: number,
  habitats: ReadonlySet<string> | undefined,
): Recommandation[] {
  return recommandations.filter(recommandation => (recommandation.activites.length === 0 || recommandation.activites.includes(activite))
    && (recommandation.habitats.length === 0 || recommandation.habitats.some(code => habitats?.has(code))))
}

// What the recommandations step has to show
export type RecommandationsStepData =
  | {
    readonly status: 'loaded'
    readonly plan: PlanGestion
    // Undefined when the croisement failed: the porteur de projet still gets the other
    // recommandations
    readonly croisement?: Croisement
  }
  | {readonly status: 'noLocalisation'}

export async function loadRecommandationsStep({params}: LoaderFunctionArgs): Promise<RecommandationsStepData> {
  const parc = params.parcId!
  const localisation = readProjet(parc)?.localisation ?? []

  if (localisation.length === 0) {
    return {status: 'noLocalisation'}
  }

  const [plan, croisement] = await Promise.all([
    fetchPlanGestion(parc),
    fetchCroisement(parc, localisation).catch(() => undefined),
  ])
  return {status: 'loaded', plan, croisement}
}
