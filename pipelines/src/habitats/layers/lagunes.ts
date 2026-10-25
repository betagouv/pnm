import {type Layer, lambert93} from '../../lib/layer.ts'
import {lagunes} from '../../sources.ts'

// The lagunes of the Mediterranean, OFB reference of 2021
export const lagunesLayer: Layer = {
  source: lagunes,
  metricCrs: lambert93,
  // A lagune needs little straightening, and the land lies all around it
  rules: [{habitat: '1150-2', buffer: 50}],
}
