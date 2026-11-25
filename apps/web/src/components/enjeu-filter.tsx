import {Tag} from '@codegouvfr/react-dsfr/Tag'

type EnjeuFilterProps = {
  readonly enjeux: ReadonlyArray<{readonly id: number, readonly libelle: string}>
  readonly selectedId: number
  readonly onSelect: (id: number) => void
}

// One selectable tag per enjeu: the pressed one is shown
export function EnjeuFilter({enjeux, selectedId, onSelect}: EnjeuFilterProps) {
  return (
    <>
      <p className='fr-text--bold fr-mb-2w'>Filtrer par grande thématique</p>
      <ul className='fr-tags-group'>
        {enjeux.map(enjeu => (
          <li key={enjeu.id}>
            <Tag
              pressed={enjeu.id === selectedId}
              // The tag is a button only with its native props. The script of the DSFR toggles a
              // pressed tag on its own when clicked: the click stops before it reaches the tag, and
              // the selection stays with the address
              nativeButtonProps={{
                onClickCapture(event) {
                  event.stopPropagation()
                  onSelect(enjeu.id)
                },
              }}
            >
              {enjeu.libelle}
            </Tag>
          </li>
        ))}
      </ul>
    </>
  )
}
