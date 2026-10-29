import {fr} from '@codegouvfr/react-dsfr'
import {pictogramUrl} from '../pictograms.ts'
import {Pictogram} from './pictogram.tsx'

type PictogramListProps = {
  readonly items: ReadonlyArray<{
    // A DSFR pictogram, as "<category>/<name>": "environment/leaf"
    readonly pictogramme: string
    readonly title: string
    readonly description: string
  }>
}

// Short statements, each beside its pictogram
export function PictogramList({items}: PictogramListProps) {
  return (
    <ul className='fr-raw-list'>
      {items.map(item => {
        const url = pictogramUrl(item.pictogramme)

        return (
          <li key={item.title} className='fr-mt-3w' style={{display: 'flex', alignItems: 'flex-start', gap: fr.spacing('3w')}}>
            {/* An unknown pictogram leaves its place empty, so that the texts stay aligned */}
            <div style={{flex: '0 0 80px'}}>{url !== undefined && <Pictogram url={url} />}</div>
            <div>
              <h3 className='fr-h4 fr-mb-1v'>{item.title}</h3>
              <p className='fr-mb-0'>{item.description}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
