import {fr} from '@codegouvfr/react-dsfr'

type FiguresProps = {
  readonly figures: ReadonlyArray<{readonly label: string, readonly value: number}>
}

// A few counts, side by side
export function Figures({figures}: FiguresProps) {
  return (
    <ul className='fr-grid-row fr-grid-row--gutters fr-raw-list'>
      {figures.map(({label, value}) => (
        <li key={label} className='fr-col-6 fr-col-md-3'>
          <div
            className='fr-p-2w'
            style={{
              backgroundColor: fr.colors.decisions.background.default.grey.default,
              border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
            }}
          >
            <p className='fr-text--sm fr-mb-1v'>{label}</p>
            <p className='fr-h4 fr-mb-0'>{value}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
