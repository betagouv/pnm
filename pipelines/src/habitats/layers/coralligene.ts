import {type Layer, lambert93} from '../../lib/layer.ts'
import {coralligene} from '../../sources.ts'

// The coralligène of the Mediterranean, OFB layer
export const coralligeneLayer: Layer = {
  source: coralligene,
  metricCrs: lambert93,
  rules: [{habitat: '1170-14', buffer: 200}],
}
