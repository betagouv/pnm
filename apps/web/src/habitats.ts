import type {
  Cartographie,
  Config,
  Croisement,
  Element,
  Enjeu,
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

// Ce que l'étape des enjeux montre des habitats
export type HabitatsStepData =
  | {
    readonly status: 'loaded'
    readonly croisement: Croisement
    readonly perimetre: MultiPolygon
    readonly tilesUrl: string
  }
  // Le croisement a échoué : le porteur de projet peut continuer
  | {readonly status: 'unavailable'}
  | {readonly status: 'noLocalisation'}

// Ce que montre l'étape des enjeux : les habitats que rencontre le projet, et les enjeux du plan de
// gestion, vers lesquels elle renvoie dans l'explorateur
export type EnjeuxStepData = {
  readonly habitats: HabitatsStepData
  // Vide pour un parc sans plan de gestion, ou si le plan ne peut être lu : l'étape s'en passe
  readonly planEnjeux: readonly Enjeu[]
}

export async function loadEnjeuxStep({params}: LoaderFunctionArgs): Promise<EnjeuxStepData> {
  const [habitats, plan] = await Promise.all([
    loadHabitatsStep(params.parcId!),
    fetchPlanGestion(params.parcId!).catch(() => undefined),
  ])
  return {habitats, planEnjeux: plan?.enjeux ?? []}
}

async function loadHabitatsStep(parc: string): Promise<HabitatsStepData> {
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
