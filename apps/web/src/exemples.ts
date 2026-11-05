import type {Espece, Regle} from '@pnm/shared'

// Example content for the synthèse, until the sources of the réglementation and of the espèces are
// chosen. Made up for the parc du Cap Corse et de l'Agriate, whose activités and habitats it names:
// the page says it is an example
export const exempleRegles: readonly Regle[] = [
  {
    id: 'mouillage-herbiers',
    niveau: 'interdiction',
    titre: 'Mouillage des navires de 24 m et plus sur les herbiers de posidonie',
    activites: [],
    habitats: ['1120-1'],
  },
  {
    id: 'avis-conforme',
    niveau: 'avisConforme',
    titre: 'Avis conforme du parc pour une activité qui peut altérer de façon notable le milieu marin',
    activites: [],
    habitats: [],
  },
  {
    id: 'declaration-manifestation',
    niveau: 'declaration',
    titre: 'Déclarer la manifestation nautique au préfet maritime',
    activites: [1],
    habitats: [],
  },
  {
    id: 'autorisation-rechargement',
    niveau: 'autorisation',
    titre: 'Autorisation au titre de la loi sur l\'eau pour le rechargement de plage',
    activites: [2],
    habitats: [],
  },
]

export const exempleEspeces: readonly Espece[] = [
  {
    nom: 'Grande nacre',
    nomScientifique: 'Pinna nobilis',
    statut: 'Protégée',
    description: 'Grand coquillage qui vit dans les herbiers de posidonie.',
    habitats: ['1120-1'],
  },
  {
    nom: 'Grand dauphin',
    nomScientifique: 'Tursiops truncatus',
    statut: 'Protégée',
    description: 'Fréquente l\'ensemble du parc.',
    habitats: [],
  },
]
