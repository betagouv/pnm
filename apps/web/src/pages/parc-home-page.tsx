import {fr} from '@codegouvfr/react-dsfr'
import {Badge} from '@codegouvfr/react-dsfr/Badge'
import {Button} from '@codegouvfr/react-dsfr/Button'
import carte from '../assets/etapes/carte.svg'
import liste from '../assets/etapes/liste.svg'
import personnage from '../assets/etapes/personnage.svg'
import poissons from '../assets/etapes/poissons.svg'
import {ActualiteCards} from '../components/actualite-cards.tsx'
import {IllustratedSteps} from '../components/illustrated-steps.tsx'
import {PictogramList} from '../components/pictogram-list.tsx'
import {exempleActualites} from '../exemple-actualites.ts'
import {parcPath, useParc} from '../parcs.ts'

const etapes = [
  {illustration: carte, text: 'Sélectionner l\'activité et la zone concernée'},
  {illustration: poissons, text: 'Découvrir les espèces et habitats protégés'},
  {illustration: liste, text: 'Découvrir les bonnes actions, évaluer les effets possibles du projet sur le milieu marin'},
  {illustration: personnage, text: 'Intégrer les orientations au projet'},
]

const missions = [
  {
    pictogramme: 'environment/leaf',
    title: 'Protéger la biodiversité marine',
    description: 'Préserver les habitats, les espèces et l\'équilibre écologique des eaux du parc.',
  },
  {
    pictogramme: 'environment/human-cooperation',
    title: 'Concilier usages & conservation',
    description: 'Réconcilier les activités économiques avec les objectifs de protection.',
  },
  {
    pictogramme: 'leisure/community',
    title: 'Accompagner les acteurs locaux',
    description: 'Aider les porteurs de projets à développer des activités durables sur le territoire.',
  },
]

// The home page of a parc: what the service offers there, how a projet goes, what the parc is for
export function ParcHomePage() {
  // Always set here: the parc route loader answers 404 for an unknown parc
  const parc = useParc()!

  return (
    <>
      <title>{`${parc.nom} - Mon Parc Marin`}</title>
      <div className='fr-container fr-py-8w'>
        <div className='fr-grid-row fr-grid-row--gutters fr-grid-row--middle'>
          <div className='fr-col-12 fr-col-md-7'>
            <p className='fr-text--sm fr-text--bold fr-mb-1w'>
              <span className='fr-icon-map-pin-2-line fr-icon--sm fr-mr-1v' aria-hidden='true' />
              {parc.nomComplet}
            </p>
            <h1 className='fr-display--xs'>Un projet dans le Parc ?</h1>
            <p className='fr-text--lead'>
              Que vous portiez un projet, l'instruisiez ou soyez consulté pour donner votre avis,
              découvrez comment prendre en compte les enjeux du milieu marin et les recommandations du
              Parc.
            </p>
            <p className='fr-text--sm fr-mb-4w'>
              Les informations et orientations proposées permettent une approche contextuelle du
              territoire mais ne remplacent pas l'importance d'une étude terrain, notamment pour
              vérifier la présence effective des enjeux.
            </p>
            <Button iconId='fr-icon-arrow-right-line' iconPosition='right' linkProps={{to: parcPath(parc.id)}}>
              Préparer / Évaluer un projet
            </Button>
          </div>
          {parc.logo !== undefined && (
            <div className='fr-col-12 fr-col-md-5' style={{textAlign: 'center'}}>
              {/* The name of the parc is written above */}
              <img src={parc.logo} alt='' style={{width: '28rem', maxWidth: '100%'}} />
            </div>
          )}
        </div>
      </div>
      <section
        className='fr-py-8w'
        style={{backgroundColor: fr.colors.decisions.background.alt.blueFrance.default}}
        aria-labelledby='etapes'
      >
        <div className='fr-container'>
          <h2 id='etapes' className='fr-mb-4w'>Les grandes étapes pour adapter un projet aux enjeux du Parc</h2>
          <IllustratedSteps steps={etapes} />
        </div>
      </section>
      <section className='fr-container fr-py-8w' aria-labelledby='missions'>
        <div className='fr-grid-row fr-grid-row--gutters'>
          <div className='fr-col-12 fr-col-md-7'>
            <h2 id='missions'>Missions et objectifs du Parc</h2>
            <p className='fr-text--lg'>
              Le Parc protège la mer et le littoral tout en permettant des activités humaines
              respectueuses de ces milieux.
            </p>
            <PictogramList items={missions} />
          </div>
          {parc.photo !== undefined && (
            <div className='fr-col-12 fr-col-md-5 fr-mt-md-8w'>
              <img src={parc.photo} alt='' className='fr-responsive-img' />
            </div>
          )}
        </div>
      </section>
      <section className='fr-container fr-pb-8w' aria-labelledby='actualites'>
        <div className='fr-mb-4w' style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: `${fr.spacing('1w')} ${fr.spacing('2w')}`,
        }}>
          <h2 id='actualites' className='fr-mb-0'>Les dernières actualités</h2>
          <Badge small as='span'>Contenu d'exemple</Badge>
        </div>
        <ActualiteCards actualites={exempleActualites} />
      </section>
    </>
  )
}
