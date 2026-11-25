import type {
  Cartographie,
  Config,
  Croisement,
  Element,
  MultiPolygon,
} from '@pnm/shared'
import type {LoaderFunctionArgs} from 'react-router'
import {fetchApi, postApi} from './api.ts'
import {fetchPerimetre} from './parcs.ts'
import {
  enjeuHabitats,
  fetchPlanGestion,
  findEnjeu,
  findHabitat,
  notFound,
} from './plan-gestion.ts'
import {readProjet} from './projet-storage.ts'

async function fetchConfig(): Promise<Config> {
  return fetchApi<Config>('/config')
}

// The habitats that the processing chain has surfaces for
export async function fetchCartographies(): Promise<Cartographie[]> {
  return fetchApi<Cartographie[]>('/habitats')
}

// The tiles of every habitat, as an absolute address: MapLibre reads them through pmtiles://
async function fetchTilesUrl(): Promise<string> {
  const {habitatsTilesUrl} = await fetchConfig()
  return new URL(habitatsTilesUrl, globalThis.location.href).href
}

// What the localisation of a projet meets. Asked once per visit for the same localisation, whichever
// step asks
export async function fetchCroisement(parc: string, localisation: readonly Element[]): Promise<Croisement> {
  return postApi<Croisement>('/croisement', {parc, localisation})
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
      fetchCroisement(parc, localisation),
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

// The habitats of an enjeu that the processing chain has surfaces for, on a map of the parc
export type EnjeuCarte = {
  readonly perimetre: MultiPolygon
  readonly tilesUrl: string
  readonly codes: readonly string[]
}

export type EnjeuPageData = {
  // An enjeu without mapped habitats has no map
  readonly carte?: EnjeuCarte
}

export async function loadEnjeuPage({params}: LoaderFunctionArgs): Promise<EnjeuPageData> {
  const plan = await fetchPlanGestion(params.parcId!)
  const enjeu = findEnjeu(plan, params.enjeuId) ?? notFound()
  const habitats = enjeuHabitats(plan, enjeu)

  if (habitats.length === 0) {
    return {}
  }

  const [perimetre, tilesUrl, cartographies] = await Promise.all([
    fetchPerimetre(params.parcId!),
    fetchTilesUrl(),
    fetchCartographies(),
  ])
  const mapped = new Set(cartographies.map(cartographie => cartographie.code))
  const codes = habitats.filter(habitat => mapped.has(habitat.code)).map(habitat => habitat.code)
  return codes.length === 0 ? {} : {carte: {perimetre, tilesUrl, codes}}
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
    notFound()
  }

  const [perimetre, tilesUrl, cartographies] = await Promise.all([
    fetchPerimetre(params.parcId!),
    fetchTilesUrl(),
    fetchCartographies(),
  ])

  return {perimetre, tilesUrl, isMapped: cartographies.some(cartographie => cartographie.code === params.code)}
}
