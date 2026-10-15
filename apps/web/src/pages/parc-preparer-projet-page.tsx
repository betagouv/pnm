import {Alert} from '@codegouvfr/react-dsfr/Alert'
import {Breadcrumb} from '@codegouvfr/react-dsfr/Breadcrumb'
import {Button} from '@codegouvfr/react-dsfr/Button'
import {preparerProjetPath, useParc} from '../parcs.ts'

export function ParcPreparerProjetPage() {
  // Always set here: the parc route loader answers 404 for an unknown parc
  const parc = useParc()!

  return (
    <div className='fr-container fr-pb-6w'>
      <title>{`Préparer mon projet - ${parc.nom} - Mon Parc Marin`}</title>
      <Breadcrumb
        homeLinkProps={{to: '/'}}
        segments={[{label: 'Préparer mon projet', linkProps: {to: preparerProjetPath}}]}
        currentPageLabel={parc.nom}
      />
      <h1>Préparer mon projet</h1>
      <p className='fr-text--lead'>{parc.nomComplet}</p>
      {parc.disponible
        ? (
          <Alert
            small
            severity='info'
            description='Les étapes du parcours arrivent prochainement : votre activité, sa localisation, puis les mesures à prendre en compte.'
          />
        )
        : (
          <>
            <Alert
              className='fr-mb-4w'
              severity='info'
              title='Ce parc sera bientôt disponible'
              description='Mon Parc Marin ouvre progressivement les parcs naturels marins.'
            />
            <Button priority='secondary' linkProps={{to: preparerProjetPath}}>
              Choisir un autre parc
            </Button>
          </>
        )}
    </div>
  )
}
