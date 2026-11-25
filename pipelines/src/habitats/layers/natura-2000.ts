import {type HabitatRule, type Layer, lambert93} from '../../lib/layer.ts'
import {
  agriates,
  agriatesPoints,
  plateauCapCorse,
  plateauCapCorsePoints,
} from '../../sources.ts'

// Les objets dont le code habitat élémentaire est celui de l'habitat. Le code est seul dans sa
// colonne : aucune mosaïque n'en associe deux
function rule(habitat: string, buffer: number): HabitatRule {
  return {
    habitat,
    where: `trim(cod_ch2004) = '${habitat}'`,
    columns: ['cod_ch2004'],
    buffer,
  }
}

// Des cartes au 1/5 000 : un élargissement de 200 m, comme pour les inventaires nationaux, ferait
// d'une frange de quelques mètres une bande de 400 m. Les habitats du haut de la côte, étroits,
// s'élargissent peu ; ceux de l'infralittoral un peu plus
const frange = 25
const infralittoral = 50

const zoneRules: HabitatRule[] = [
  // Sables et galets de l'infralittoral
  rule('1110-5', infralittoral),
  rule('1110-6', infralittoral),
  rule('1110-7', infralittoral),
  rule('1110-9', infralittoral),
  // Sables et sédiments du haut de plage
  rule('1140-7', frange),
  rule('1140-8', frange),
  rule('1140-9', frange),
  rule('1140-10', frange),
  // Roches du supralittoral, du médiolittoral et de l'infralittoral
  rule('1170-10', frange),
  rule('1170-12', frange),
  rule('1170-13', infralittoral),
]

// Les laisses de mer et les grottes sont relevées en points : l'élargissement en fait des surfaces
const pointRules: HabitatRule[] = [
  rule('1210-3', infralittoral),
  rule('8330-2', infralittoral),
  rule('8330-3', infralittoral),
  rule('8330-4', infralittoral),
]

// La posidonie et le coralligène de ces cartes ne sont pas repris : les inventaires nationaux les
// couvrent déjà. Les objets sans correspondance (détritique côtier, fonds meubles…) ne sont
// rattachés à aucun habitat
export const natura2000Layers: Layer[] = [
  {source: plateauCapCorse, metricCrs: lambert93, rules: zoneRules},
  {source: agriates, metricCrs: lambert93, rules: zoneRules},
  {source: plateauCapCorsePoints, metricCrs: lambert93, rules: pointRules},
  {source: agriatesPoints, metricCrs: lambert93, rules: pointRules},
]
