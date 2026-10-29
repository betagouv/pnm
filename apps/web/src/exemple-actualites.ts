import type {Actualite} from '@pnm/shared'

// Example news for the home page of a parc, until their source is chosen. Made up for the parc du
// Cap Corse et de l'Agriate: the page says it is an example
export const exempleActualites: readonly Actualite[] = [
  {
    id: 'suivi-herbiers',
    titre: 'Les herbiers de posidonie sous surveillance',
    resume: 'Les agents du Parc ont achevé la campagne annuelle de suivi des herbiers de posidonie, de Saint-Florent à la pointe du Cap.',
    date: '2026-10-14',
    categorie: 'Suivi scientifique',
    pictogramme: 'environment/leaf',
  },
  {
    id: 'conseil-gestion',
    titre: 'Retour sur le conseil de gestion de septembre',
    resume: 'Le conseil de gestion a rendu ses avis sur les projets de la saison et fait le point sur l\'organisation des mouillages.',
    date: '2026-09-30',
    categorie: 'Gouvernance',
    pictogramme: 'leisure/community',
  },
  {
    id: 'manifestations-2027',
    titre: 'Préparer une manifestation nautique pour 2027',
    resume: 'Organisateurs de régates et de randonnées nautiques : anticipez vos démarches et tenez compte des recommandations du Parc.',
    date: '2026-09-12',
    categorie: 'Accompagnement',
    pictogramme: 'map/compass',
  },
]
