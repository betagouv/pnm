import {Tag} from '@codegouvfr/react-dsfr/Tag'
import type {To} from 'react-router'

export type TagLink = {
  readonly id: number | string
  readonly label: string
  readonly to: To
}

// One tag per page to go to: the habitats or the espèces of an enjeu…
export function TagLinks({links}: {readonly links: readonly TagLink[]}) {
  return (
    <ul className='fr-tags-group'>
      {links.map(link => (
        <li key={link.id}>
          <Tag linkProps={{to: link.to}}>{link.label}</Tag>
        </li>
      ))}
    </ul>
  )
}
