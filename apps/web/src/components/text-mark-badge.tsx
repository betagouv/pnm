import {Badge} from '@codegouvfr/react-dsfr/Badge'
import type {TextMark} from '../format.ts'

type TextMarkBadgeProps = {
  readonly mark: TextMark
  // Within a line of text rather than above it
  readonly isInline?: boolean
}

const labels: Record<TextMark, string> = {
  generated: 'Texte généré',
  resume: 'Résumé du plan',
}

// Marks a text that Mon Parc Marin wrote where the plan de gestion lacks one
export function TextMarkBadge({mark, isInline = false}: TextMarkBadgeProps) {
  const severity = mark === 'resume' ? 'info' : undefined
  return isInline
    ? <Badge noIcon small as='span' severity={severity} className='fr-mr-1v'>{labels[mark]}</Badge>
    : <Badge noIcon small as='p' severity={severity} className='fr-mb-1w'>{labels[mark]}</Badge>
}
