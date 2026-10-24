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

export const sources: Source[] = [airesMarinesProtegees]

const rawRoot = fileURLToPath(new URL('../../data/raw/', import.meta.url))

// Where the pages of a source are kept, mirroring its address: data/raw/<host>/<workspace>/<layer>
export function rawDir(source: Source): string {
  return join(rawRoot, new URL(source.url).host, ...source.typeName.split(':'))
}

// Written next to the pages once they are all downloaded and checked
export const downloadFile = 'download.json'

export type DownloadRecord = Source & {
  readonly features: number
  readonly pages: number
  readonly downloadedAt: string
}
