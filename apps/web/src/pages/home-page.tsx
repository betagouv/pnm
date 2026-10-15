import {fr} from '@codegouvfr/react-dsfr'
import {Button} from '@codegouvfr/react-dsfr/Button'
import {preparerProjetPath} from '../parcs.ts'

const etapes = [
  'Sélectionner l\'activité et la zone concernée',
  'Consulter les impacts et les mesures à mettre en place',
  'Consulter la documentation du parc',
  'Construire votre projet en tenant compte des enjeux du parc naturel marin',
]

export function HomePage() {
  return (
    <>
      <div className='fr-container fr-py-6w'>
        <h1>Préparez votre projet avec les parcs naturels marins</h1>
        <p className='fr-text--lead'>
          Vous avez un projet dans un parc naturel marin ? Découvrez comment atténuer ses
          incidences sur le milieu marin et mettre toutes les chances de votre côté dans
          l'instruction de votre demande d'autorisation.
        </p>
        <Button
          size='large'
          iconId='fr-icon-arrow-right-line'
          iconPosition='right'
          linkProps={{to: preparerProjetPath}}
        >
          Préparer mon projet
        </Button>
      </div>
      <section
        className='fr-py-6w'
        style={{backgroundColor: fr.colors.decisions.background.alt.grey.default}}
        aria-labelledby='etapes'
      >
        <div className='fr-container'>
          <h2 id='etapes'>Les grandes étapes pour monter votre projet</h2>
          <ol className='fr-grid-row fr-grid-row--gutters fr-raw-list'>
            {etapes.map((etape, index) => (
              <li key={etape} className='fr-col-12 fr-col-md-3'>
                <p className='fr-h1 fr-mb-1w' aria-hidden='true'>{index + 1}</p>
                <p>{etape}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  )
}
