import {fr} from '@codegouvfr/react-dsfr'
import {Card} from '@codegouvfr/react-dsfr/Card'
import {Tag} from '@codegouvfr/react-dsfr/Tag'
import type {Actualite} from '@pnm/shared'
import {pictogramUrl} from '../pictograms.ts'
import {Pictogram} from './pictogram.tsx'

type ActualiteCardsProps = {
  readonly actualites: readonly Actualite[]
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', {dateStyle: 'long'})

export function ActualiteCards({actualites}: ActualiteCardsProps) {
  return (
    <ul className='fr-grid-row fr-grid-row--gutters fr-raw-list'>
      {actualites.map(actualite => (
        <li key={actualite.id} className='fr-col-12 fr-col-md-4'>
          <Card
            border
            title={actualite.titre}
            titleAs='h3'
            desc={actualite.resume}
            start={(
              <ul className='fr-tags-group'>
                <li>
                  <Tag small>{actualite.categorie}</Tag>
                </li>
              </ul>
            )}
            detail={<time dateTime={actualite.date}>{dateFormat.format(new Date(actualite.date))}</time>}
            imageComponent={<Illustration pictogramme={actualite.pictogramme} />}
          />
        </li>
      ))}
    </ul>
  )
}

// The pictogram of the news on a tinted band, until news come with their own pictures
function Illustration({pictogramme}: {readonly pictogramme?: string}) {
  const url = pictogramme === undefined ? undefined : pictogramUrl(pictogramme)

  return (
    <div
      className='fr-py-4w'
      style={{display: 'flex', justifyContent: 'center', backgroundColor: fr.colors.decisions.background.alt.blueFrance.default}}
    >
      {url !== undefined && <Pictogram url={url} />}
    </div>
  )
}
