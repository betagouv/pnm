import {type PlanGestion, planGestionSchema} from '@pnm/shared'
import {lazily, readJson} from './data.ts'

// The plan de gestion of each parc, produced by the processing chain (pipelines/). A parc without
// one has none
export type PlansGestion = {
  readonly get: (parcId: string) => Promise<PlanGestion | undefined>
}

export function createPlansGestion(dataUrl: URL): PlansGestion {
  const plans = new Map<string, () => Promise<PlanGestion | undefined>>()

  return {
    async get(parcId) {
      let plan = plans.get(parcId)

      if (!plan) {
        plan = lazily(async () => readJson(new URL(`plan-de-gestion/${encodeURIComponent(parcId)}.json`, dataUrl), planGestionSchema))
        plans.set(parcId, plan)
      }

      return plan()
    },
  }
}
