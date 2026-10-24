import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

// A layer the processing chain starts from, downloaded as it is on the server
export type Source = {
  // The WFS endpoint
  readonly url: string
  readonly typeName: string
  // The primary key of the layer: checked unique and never empty once downloaded
  readonly key: string
  // Asks the server to order the pages by this attribute, best the key. The server cannot read a
  // name with a space: GeoServer then orders by the primary key on its own
  readonly sortBy?: string
  // The projection of the coordinates, as served
  readonly crs: string
}

export const airesMarinesProtegees: Source = {
  url: 'https://wxs.ofb.fr/geoserver/gestion/ows',
  typeName: 'gestion:ges_omon_amp_ofb_pol_3857_vue',
  // Not gid, which 117 of the 719 areas lack
  key: 'identifiant amp',
  crs: 'EPSG:3857',
}

// A layer of the OFB GeoServer keyed by id and served in Web Mercator, as most of them are
function ofbLayer(typeName: string): Source {
  const [workspace] = typeName.split(':', 1)
  return {
    url: `https://wxs.ofb.fr/geoserver/${workspace}/ows`,
    typeName,
    key: 'id',
    sortBy: 'id',
    crs: 'EPSG:3857',
  }
}

export const herbiersPosidonie = ofbLayer('habitat:eco_med_herbier_posidonia_oceanica_2022_pol_3857')
export const coralligene = ofbLayer('habitat:eco_med_coralligene_ofb_pol_3857')
export const lagunes = ofbLayer('habitat:eco_med_ref_lagunes_1150_tdv_ofb_2021_pol_3857')

export const sources: Source[] = [
  airesMarinesProtegees,
  // Habitats
  herbiersPosidonie,
  ofbLayer('habitat:eco_met_banc_maerl_2024_ofb_pol_3857'),
  coralligene,
  ofbLayer('habitat:eco_med_apmcca_est_caremaerl_2025_ofb_pol_3857'),
  ofbLayer('habitat:eco_med_apmcca_ouest_caremaerl_2025_ofb_pol_3857'),
  lagunes,
  ofbLayer('espece:bio_med_recifs_biogenique3_ofb_pt'),
]

// A Grist document the processing chain starts from, downloaded table by table
export type GristSource = {
  // The Grist instance
  readonly url: string
  readonly docId: string
}

// The plan de gestion of a parc, a Grist document of its own: each one carries its content, from its
// habitats to its nomenclature of activités
export type PlanGestionSource = GristSource & {
  // The parc, by its id in the API
  readonly parc: string
}

export const plansGestion: PlanGestionSource[] = [
  // The dynamic plan de gestion of the parc du Cap Corse et de l'Agriate
  {parc: 'cap-corse-agriate', url: 'https://grist.numerique.gouv.fr', docId: 'rmbaSAnXZPhhDThfzWcTgU'},
]

export const gristSources: GristSource[] = plansGestion

const rawRoot = fileURLToPath(new URL('../../data/raw/', import.meta.url))

// Where the pages of a source are kept, mirroring its address: data/raw/<host>/<workspace>/<layer>
export function rawDir(source: Source): string {
  return join(rawRoot, new URL(source.url).host, ...source.typeName.split(':'))
}

// Where the tables of a Grist document are kept: data/raw/<host>/<docId>
export function gristRawDir(source: GristSource): string {
  return join(rawRoot, new URL(source.url).host, source.docId)
}

// Written next to the pages once they are all downloaded and checked
export const downloadFile = 'download.json'

export type DownloadRecord = Source & {
  readonly features: number
  readonly pages: number
  readonly downloadedAt: string
}

export type GristDownloadRecord = GristSource & {
  // Records of each table
  readonly tables: Record<string, number>
  readonly downloadedAt: string
}
