import {fr} from '@codegouvfr/react-dsfr'
import {Badge} from '@codegouvfr/react-dsfr/Badge'
import type {ReactNode} from 'react'

type ComingSoonProps = {
  // What will show here
  readonly children: ReactNode
}

// Holds the place of a content to come
export function ComingSoon({children}: ComingSoonProps) {
  return (
    <div className='fr-p-3w' style={{backgroundColor: fr.colors.decisions.background.alt.grey.default}}>
      <Badge small as='p' className='fr-mb-1w'>À venir</Badge>
      <p className='fr-mb-0'>{children}</p>
    </div>
  )
}
