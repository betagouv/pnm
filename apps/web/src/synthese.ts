import type {
  Croisement,
  Element,
  HabitatCroise,
  MultiPolygon,
  PlanGestion,
} from '@pnm/shared'
import type {LoaderFunctionArgs} from 'react-router'
import {fetchCroisement, fetchTilesUrl} from './habitats.ts'
import {fetchPerimetre} from './parcs.ts'
import {fetchPlanGestion} from './plan-gestion.ts'
import {readProjet} from './projet-storage.ts'

// What the projet meets, and what the map needs to show it
export type SyntheseCarte = {
  readonly croisement: Croisement
  readonly perimetre: MultiPolygon
  readonly tilesUrl: string
}

// What the synthèse step has to show
export type SyntheseStepData =
  | {
    readonly status: 'loaded'
    readonly plan: PlanGestion
    // Undefined when the croisement failed: the synthèse still shows what does not depend on the
    // habitats
    readonly carte?: SyntheseCarte
  }
  | {readonly status: 'noLocalisation'}

async function fetchCarte(parc: string, localisation: readonly Element[]): Promise<SyntheseCarte> {
  const [croisement, perimetre, tilesUrl] = await Promise.all([
    fetchCroisement(parc, localisation),
    fetchPerimetre(parc),
    fetchTilesUrl(),
  ])
  return {croisement, perimetre, tilesUrl}
}

export async function loadSyntheseStep({params}: LoaderFunctionArgs): Promise<SyntheseStepData> {
  const parc = params.parcId!
  const localisation = readProjet(parc)?.localisation ?? []

  if (localisation.length === 0) {
    return {status: 'noLocalisation'}
  }

  const [plan, carte] = await Promise.all([
    fetchPlanGestion(parc),
    fetchCarte(parc, localisation).catch(() => undefined),
  ])
  return {status: 'loaded', plan, carte}
}

// What a recommandation, a regle or an espèce is meant for: some activités, some habitats, or, when
// it names neither, every projet
type Target = {
  readonly activites?: readonly number[]
  readonly habitats: readonly string[]
}

// What is meant for the projet. One meant for activités needs that of the projet, one meant for
// habitats needs one of them among those the projet concerns: inside it or near it. Without the
// habitats of the projet, those meant for habitats are left out
export function selectForProjet<T extends Target>(
  items: readonly T[],
  activite: number,
  habitats: readonly HabitatCroise[] | undefined,
): T[] {
  return items.filter(item => (item.activites === undefined || item.activites.length === 0 || item.activites.includes(activite))
    && (item.habitats.length === 0 || item.habitats.some(code => habitats?.some(habitat => habitat.code === code))))
}

// Why something applies to the projet, from the most precise reason. Only the habitats have a place
// on the map
export type Scope =
  | {readonly type: 'habitats', readonly habitats: readonly HabitatCroise[]}
  | {readonly type: 'activite'}
  | {readonly type: 'parc'}

export function scopeOf(target: Target, habitats: readonly HabitatCroise[]): Scope {
  const concerned = habitats.filter(habitat => target.habitats.includes(habitat.code))

  const hasActivites = target.activites !== undefined && target.activites.length > 0

  return concerned.length > 0 ? {type: 'habitats', habitats: concerned} : {type: hasActivites ? 'activite' : 'parc'}
}

const scopeOrder: Record<Scope['type'], number> = {habitats: 0, activite: 1, parc: 2}

// The most precise first, in their order otherwise
export function byScope(a: {readonly scope: Scope}, b: {readonly scope: Scope}): number {
  return scopeOrder[a.scope.type] - scopeOrder[b.scope.type]
}

export function scopeLabel(scope: Scope): string {
  switch (scope.type) {
    case 'habitats': {
      const noms = scope.habitats.map(habitat => habitat.nom).join(', ')
      return `${noms}, ${scope.habitats.some(habitat => habitat.distance === 0) ? 'dans votre zone' : 'à proximité'}`
    }

    case 'activite': {
      return 'Pour votre activité'
    }

    case 'parc': {
      return 'Dans tout le parc'
    }
  }
}

// What the map shows of it, in words
export function scopeCaption(scope: Scope): string {
  switch (scope.type) {
    case 'habitats': {
      return `En évidence sur la carte : ${scope.habitats.map(habitat => habitat.nom).join(', ')}.`
    }

    case 'activite': {
      return 'S\'applique à votre activité, où qu\'elle ait lieu : rien à montrer sur la carte.'
    }

    case 'parc': {
      return 'S\'applique dans tout le parc : rien à montrer sur la carte.'
    }
  }
}

export function scopeCodes(scope: Scope): string[] {
  return scope.type === 'habitats' ? scope.habitats.map(habitat => habitat.code) : []
}
