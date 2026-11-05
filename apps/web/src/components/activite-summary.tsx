import type {Activite} from '@pnm/shared'
import {Link, type To} from 'react-router'

type ActiviteSummaryProps = {
  readonly activite: Activite
  readonly changeLink: To
  readonly className?: string
}

export function ActiviteSummary({activite, changeLink, className = 'fr-mb-3w'}: ActiviteSummaryProps) {
  return (
    <p className={className}>
      <span className='fr-text--bold'>Votre activité :</span>
      {' '}
      {activite.nom}
      {/* Keeps the scroll position, like the other links between steps */}
      <Link preventScrollReset className='fr-link fr-link--sm fr-ml-2w' to={changeLink}>
        Modifier
        <span className='fr-sr-only'> l'activité</span>
      </Link>
    </p>
  )
}
