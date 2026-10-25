// The layers that the habitats step processes, each in its own file: its source, its projection, its
// rules, and its own treatment when it needs one
import type {Layer} from '../../lib/layer.ts'
import {coralligeneLayer} from './coralligene.ts'
import {herbiersPosidonieLayer} from './herbiers-posidonie.ts'
import {lagunesLayer} from './lagunes.ts'

export const habitatLayers: Layer[] = [herbiersPosidonieLayer, coralligeneLayer, lagunesLayer]
