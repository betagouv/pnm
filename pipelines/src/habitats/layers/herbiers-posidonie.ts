import {type Layer, lambert93} from '../../lib/layer.ts'
import {herbiersPosidonie} from '../../sources.ts'

// The herbiers de Posidonia oceanica of the Mediterranean, OFB layer of 2022
export const herbiersPosidonieLayer: Layer = {
  source: herbiersPosidonie,
  metricCrs: lambert93,
  rules: [
    // Leaves out the matte morte, which has no code habitat élémentaire, and the herbier incertain.
    // Some objects have no legende, only a biocenose
    {
      habitat: '1120-1',
      where: 'legende = \'Herbier de Posidonia oceanica\' OR (legende IS NULL AND biocenose = \'Herbier à Posidonia oceanica\')',
      columns: ['legende', 'biocenose'],
      buffer: 200,
    },
  ],
}
