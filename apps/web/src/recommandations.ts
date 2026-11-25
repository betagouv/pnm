import type {Croisement, PlanGestion, Recommandation} from '@pnm/shared'
import type {LoaderFunctionArgs} from 'react-router'
import {fetchCartographies, fetchCroisement} from './habitats.ts'
import {fetchPlanGestion} from './plan-gestion.ts'
import {readProjet} from './projet-storage.ts'

// The recommandations of the plan de gestion for a projet. One meant for activités needs that of the
// projet. One meant for habitats needs one of them among those the projet concerns, inside it or
// near it, unless one of them has no map yet: nothing tells then whether the projet concerns it, and
// the recommandation stays. One that names neither is for every projet. Without the habitats of the
// projet, only the mapped habitats count as not concerned
export function selectRecommandations(
  recommandations: readonly Recommandation[],
  activite: number,
  habitats: ReadonlySet<string> | undefined,
  mapped: ReadonlySet<string>,
): Recommandation[] {
  return recommandations.filter(recommandation => (recommandation.activites.length === 0 || recommandation.activites.includes(activite))
    && (recommandation.habitats.length === 0 || recommandation.habitats.some(code => !mapped.has(code) || habitats?.has(code))))
}

// What the recommandations step has to show
export type RecommandationsStepData =
  | {
    readonly status: 'loaded'
    readonly plan: PlanGestion
    // Undefined when the croisement failed: the porteur de projet still gets the other
    // recommandations
    readonly croisement?: Croisement
    // The codes of the habitats that the processing chain has surfaces for
    readonly mapped: readonly string[]
  }
  | {readonly status: 'noLocalisation'}

export async function loadRecommandationsStep({params}: LoaderFunctionArgs): Promise<RecommandationsStepData> {
  const parc = params.parcId!
  const localisation = readProjet(parc)?.localisation ?? []

  if (localisation.length === 0) {
    return {status: 'noLocalisation'}
  }

  const [plan, croisement, cartographies] = await Promise.all([
    fetchPlanGestion(parc),
    fetchCroisement(parc, localisation).catch(() => undefined),
    fetchCartographies(),
  ])
  return {
    status: 'loaded',
    plan,
    croisement,
    mapped: cartographies.map(cartographie => cartographie.code),
  }
}
