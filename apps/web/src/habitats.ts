import type {
  Cartographie,
  Config,
  Croisement,
  MultiPolygon,
} from '@pnm/shared'
import {data, type LoaderFunctionArgs} from 'react-router'
import {fetchApi, postApi} from './api.ts'
import {fetchPerimetre} from './parcs.ts'
import {fetchPlanGestion, findHabitat} from './plan-gestion.ts'
import {readProjet} from './projet-storage.ts'

async function fetchConfig(): Promise<Config> {
  return fetchApi<Config>('/config')
}

// The tiles of every habitat, as an absolute address: MapLibre reads them through pmtiles://
async function fetchTilesUrl(): Promise<string> {
  const {habitatsTilesUrl} = await fetchConfig()
  return new URL(habitatsTilesUrl, globalThis.location.href).href
}

// What the habitats step has to show
export type HabitatsStepData =
  | {
    readonly status: 'loaded'
    readonly croisement: Croisement
    readonly perimetre: MultiPolygon
    readonly tilesUrl: string
  }
  // The croisement failed: the porteur de projet can go on
  | {readonly status: 'unavailable'}
  | {readonly status: 'noLocalisation'}

export async function loadHabitatsStep({params}: LoaderFunctionArgs): Promise<HabitatsStepData> {
  const parc = params.parcId!
  const localisation = readProjet(parc)?.localisation ?? []

  if (localisation.length === 0) {
    return {status: 'noLocalisation'}
  }

  try {
    const [croisement, perimetre, tilesUrl] = await Promise.all([
      postApi<Croisement>('/croisement', {parc, localisation}),
      fetchPerimetre(parc),
      fetchTilesUrl(),
    ])
    return {
      status: 'loaded',
      croisement,
      perimetre,
      tilesUrl,
    }
  } catch {
    return {status: 'unavailable'}
  }
}

export type HabitatPageData = {
  readonly perimetre: MultiPolygon
  readonly tilesUrl: string
  // The processing chain has surfaces for the habitat
  readonly isMapped: boolean
}

// The page of a habitat of the plan de gestion, mapped or not
export async function loadHabitatPage({params}: LoaderFunctionArgs): Promise<HabitatPageData> {
  const plan = await fetchPlanGestion(params.parcId!)

  if (!findHabitat(plan, params.code)) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw data(null, {status: 404})
  }

  const [perimetre, tilesUrl, cartographies] = await Promise.all([
    fetchPerimetre(params.parcId!),
    fetchTilesUrl(),
    fetchApi<Cartographie[]>('/habitats'),
  ])

  return {perimetre, tilesUrl, isMapped: cartographies.some(cartographie => cartographie.code === params.code)}
}
