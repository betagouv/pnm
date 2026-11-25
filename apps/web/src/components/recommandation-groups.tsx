import {Accordion} from '@codegouvfr/react-dsfr/Accordion'
import {Card} from '@codegouvfr/react-dsfr/Card'
import {Link, type To} from 'react-router'
import {Pictogram} from './pictogram.tsx'

export type RecommandationItem = {
  readonly id: number
  readonly titre?: string
  readonly description: string
  // The objectif à long terme it serves, and where the plan presents it
  readonly objectif?: {readonly libelle: string, readonly to: To}
  // What it concerns, in words
  readonly detail?: string
}

export type RecommandationGroup = {
  readonly id: number | string
  readonly titre: string
  readonly pictogrammeUrl?: string
  readonly recommandations: readonly RecommandationItem[]
}

// The recommandations, folded by enjeu: the porteur de projet sees the enjeux at a glance and opens
// those that matter
export function RecommandationGroups({groups}: {readonly groups: readonly RecommandationGroup[]}) {
  return (
    <div className='fr-accordions-group'>
      {groups.map(group => (
        <Accordion
          key={group.id}
          titleAs='h3'
          label={(
            <span style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
              {group.pictogrammeUrl !== undefined && <Pictogram url={group.pictogrammeUrl} size={40} />}
              {`${group.titre} (${group.recommandations.length})`}
            </span>
          )}
        >
          <ul className='fr-grid-row fr-grid-row--gutters fr-raw-list'>
            {group.recommandations.map(recommandation => (
              <li key={recommandation.id} className='fr-col-12 fr-col-md-6'>
                <Card
                  border
                  size='small'
                  // Without a title, the description takes its place
                  title={recommandation.titre ?? recommandation.description}
                  titleAs='h4'
                  // A description that only repeats the title is left out
                  desc={recommandation.titre === undefined || recommandation.description.trim() === recommandation.titre.trim() ? undefined : recommandation.description}
                  end={(recommandation.objectif !== undefined || recommandation.detail !== undefined) && (
                    <>
                      {recommandation.objectif !== undefined && (
                        <p className='fr-text--sm fr-mb-1v'>
                          {'Objectif à long terme : '}
                          <Link to={recommandation.objectif.to}>{recommandation.objectif.libelle}</Link>
                        </p>
                      )}
                      {recommandation.detail !== undefined && <p className='fr-card__detail'>{recommandation.detail}</p>}
                    </>
                  )}
                />
              </li>
            ))}
          </ul>
        </Accordion>
      ))}
    </div>
  )
}
