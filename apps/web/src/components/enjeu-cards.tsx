import {fr} from '@codegouvfr/react-dsfr'
import {Card} from '@codegouvfr/react-dsfr/Card'

type EnjeuCardsProps<Id extends string> = {
  readonly enjeux: ReadonlyArray<{
    readonly id: Id
    readonly titre: string
    // What the projet meets of it, in a few words
    readonly resume: string
  }>
  readonly selectedId: Id
  readonly onSelect: (id: Id) => void
}

// One card per enjeu. A card is a button: it shows its enjeu next to the cards
export function EnjeuCards<Id extends string>({enjeux, selectedId, onSelect}: EnjeuCardsProps<Id>) {
  return (
    <ul className='fr-grid-row fr-grid-row--gutters fr-raw-list'>
      {enjeux.map(enjeu => {
        const isSelected = enjeu.id === selectedId

        return (
          <li key={enjeu.id} className='fr-col-12 fr-col-md-4 fr-col-lg-12'>
            <Card
              className='fr-enlarge-button'
              size='small'
              // The DSFR has no selected card: the border of an active element marks it
              style={isSelected ? {boxShadow: `inset 0 0 0 2px ${fr.colors.decisions.border.active.blueFrance.default}`} : undefined}
              title={(
                <button
                  type='button'
                  aria-pressed={isSelected}
                  onClick={() => {
                    onSelect(enjeu.id)
                  }}
                >
                  {enjeu.titre}
                </button>
              )}
              titleAs='h3'
              desc={enjeu.resume}
            />
          </li>
        )
      })}
    </ul>
  )
}
