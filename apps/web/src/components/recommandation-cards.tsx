import {fr} from '@codegouvfr/react-dsfr'
import {Card} from '@codegouvfr/react-dsfr/Card'
import {Tag} from '@codegouvfr/react-dsfr/Tag'
import type {Enjeu, Recommandation} from '@pnm/shared'
import {pictogramUrl} from '../pictograms.ts'
import {Pictogram} from './pictogram.tsx'

// Until the plan de gestion gives each recommandation its own illustration
const placeholderUrl = pictogramUrl('environment/environment')

type RecommandationCardsProps = {
  readonly recommandations: readonly Recommandation[]
  // A card shows the enjeu of its recommandation as a label
  readonly enjeux: readonly Enjeu[]
  // What each recommandation concerns, in words, by id
  readonly details?: ReadonlyMap<number, string>
  readonly titleAs: 'h3' | 'h4'
}

export function RecommandationCards({
  recommandations,
  enjeux,
  details,
  titleAs,
}: RecommandationCardsProps) {
  const enjeuLibelles = new Map(enjeux.map(enjeu => [enjeu.id, enjeu.libelle]))

  return (
    <ul className='fr-grid-row fr-grid-row--gutters fr-raw-list'>
      {recommandations.map(recommandation => {
        const enjeu = recommandation.enjeu === undefined ? undefined : enjeuLibelles.get(recommandation.enjeu)

        return (
          <li key={recommandation.id} className='fr-col-12 fr-col-md-6 fr-col-xl-4'>
            <Card
              border
              size='small'
              // Without a title, the description takes its place
              title={recommandation.titre ?? recommandation.description}
              titleAs={titleAs}
              desc={recommandation.titre === undefined ? undefined : recommandation.description}
              start={enjeu !== undefined && (
                <ul className='fr-tags-group'>
                  <li>
                    <Tag small>{enjeu}</Tag>
                  </li>
                </ul>
              )}
              endDetail={details?.get(recommandation.id)}
              imageComponent={<Illustration />}
            />
          </li>
        )
      })}
    </ul>
  )
}

function Illustration() {
  return (
    <div
      className='fr-py-2w'
      style={{display: 'flex', justifyContent: 'center', backgroundColor: fr.colors.decisions.background.alt.blueFrance.default}}
    >
      {placeholderUrl !== undefined && <Pictogram url={placeholderUrl} />}
    </div>
  )
}
