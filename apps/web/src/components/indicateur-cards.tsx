import {Badge} from '@codegouvfr/react-dsfr/Badge'
import {Card} from '@codegouvfr/react-dsfr/Card'
import type {Indicateur} from '@pnm/shared'

type IndicateurCardsProps = {
  readonly indicateurs: readonly Indicateur[]
  readonly titleAs: 'h3' | 'h4'
}

// One card per indicateur. Its state waits for the measures and the scale of the plan de gestion
export function IndicateurCards({indicateurs, titleAs}: IndicateurCardsProps) {
  return (
    <ul className='fr-grid-row fr-grid-row--gutters fr-raw-list'>
      {indicateurs.map(indicateur => (
        <li key={indicateur.code} className='fr-col-12 fr-col-md-6 fr-col-lg-4'>
          <Card
            border
            size='small'
            title={`${indicateur.libelle} (${indicateur.code})`}
            titleAs={titleAs}
            desc="L'état de cet indicateur n'est pas encore évalué."
            start={(
              <ul className='fr-badges-group'>
                <li>
                  <Badge small>Baromètre à venir</Badge>
                </li>
              </ul>
            )}
          />
        </li>
      ))}
    </ul>
  )
}
