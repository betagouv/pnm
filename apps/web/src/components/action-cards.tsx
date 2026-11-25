import {Badge} from '@codegouvfr/react-dsfr/Badge'
import {Card} from '@codegouvfr/react-dsfr/Card'
import type {To} from 'react-router'

type ActionCardsProps = {
  readonly actions: ReadonlyArray<{
    readonly id: number
    readonly libelle: string
    // Its kind in the nomenclature of the actions
    readonly categorie?: string
    // Where it stands: "En cours"
    readonly statut?: string
    readonly to: To
  }>
  readonly titleAs: 'h3' | 'h4'
}

// One card per action of the parc, which leads to its page
export function ActionCards({actions, titleAs}: ActionCardsProps) {
  return (
    <ul className='fr-raw-list'>
      {actions.map(action => (
        <li key={action.id} className='fr-mb-2w'>
          <Card
            border
            enlargeLink
            size='small'
            title={action.libelle}
            titleAs={titleAs}
            linkProps={{to: action.to}}
            start={action.categorie !== undefined && (
              <ul className='fr-badges-group'>
                <li>
                  <Badge small noIcon severity='new'>{action.categorie}</Badge>
                </li>
              </ul>
            )}
            endDetail={action.statut}
          />
        </li>
      ))}
    </ul>
  )
}
