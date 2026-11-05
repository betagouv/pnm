import {Tag} from '@codegouvfr/react-dsfr/Tag'
import type {HabitatCroise} from '@pnm/shared'

type HabitatTagsProps = {
  readonly habitats: readonly HabitatCroise[]
  readonly selectedCode?: string
  readonly onSelect: (habitat: HabitatCroise) => void
}

// One selectable tag per habitat: the pressed one is brought forward
export function HabitatTags({habitats, selectedCode, onSelect}: HabitatTagsProps) {
  return (
    <ul className='fr-tags-group'>
      {habitats.map(habitat => (
        <li key={habitat.code}>
          <Tag
            pressed={habitat.code === selectedCode}
            // The tag is a button only with its native props. The script of the DSFR toggles a
            // pressed tag on its own when clicked, even the one already pressed: the click stops
            // before it reaches the tag, and the selection stays with React
            nativeButtonProps={{
              onClickCapture(event) {
                event.stopPropagation()
                onSelect(habitat)
              },
            }}
          >
            {habitat.nom}
          </Tag>
        </li>
      ))}
    </ul>
  )
}
