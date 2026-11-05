import type {Element} from '@pnm/shared'
import {Link, type To} from 'react-router'
import {formatSurface} from '../format.ts'
import {elementTitle} from './element-list.tsx'

type LocalisationSummaryProps = {
  readonly elements: readonly Element[]
  // Covered by the elements with the distances around them, when it is known
  readonly surface?: number
  readonly changeLink: To
  readonly className?: string
}

const listFormat = new Intl.ListFormat('fr', {type: 'conjunction'})

// "Boucle de 6,8 km" within a sentence
function lowerFirst(text: string): string {
  return `${text.charAt(0).toLocaleLowerCase('fr')}${text.slice(1)}`
}

export function LocalisationSummary({
  elements,
  surface,
  changeLink,
  className = 'fr-mb-3w',
}: LocalisationSummaryProps) {
  const words = listFormat.format(elements.map(element => lowerFirst(elementTitle(element))))

  return (
    <p className={className}>
      <span className='fr-text--bold'>Votre localisation :</span>
      {' '}
      {surface !== undefined && surface > 0 ? `${words}, ${formatSurface(surface)}` : words}
      {/* Keeps the scroll position, like the other links between steps */}
      <Link preventScrollReset className='fr-link fr-link--sm fr-ml-2w' to={changeLink}>
        Modifier
        <span className='fr-sr-only'> la localisation</span>
      </Link>
    </p>
  )
}
