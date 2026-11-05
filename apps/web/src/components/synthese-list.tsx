import {fr} from '@codegouvfr/react-dsfr'
import {Badge} from '@codegouvfr/react-dsfr/Badge'
import type {ReactNode} from 'react'

// Lays out what sits on one line and wraps on a small screen
const inline = {display: 'flex', flexWrap: 'wrap', alignItems: 'center'} as const
const mentionColor = fr.colors.decisions.text.mention.grey.default

type SyntheseSectionProps = {
  readonly id: string
  readonly title: string
  // Made-up content, until its source is chosen
  readonly isExample?: boolean
  readonly intro?: ReactNode
  readonly children: ReactNode
}

export function SyntheseSection({
  id,
  title,
  isExample = false,
  intro,
  children,
}: SyntheseSectionProps) {
  return (
    <section className='fr-mt-6w' aria-labelledby={id}>
      <div className='fr-mb-1w' style={{...inline, gap: `${fr.spacing('1w')} ${fr.spacing('2w')}`}}>
        <h3 id={id} className='fr-h4 fr-mb-0'>{title}</h3>
        {isExample && <Badge small as='span'>Contenu d'exemple</Badge>}
      </div>
      {intro !== undefined && <p className='fr-text--sm fr-mb-2w' style={{color: mentionColor}}>{intro}</p>}
      {children}
    </section>
  )
}

// One thing that concerns the projet: a regle, a habitat, an espèce, a recommandation
export type SyntheseEntry = {
  readonly id: string
  readonly title: ReactNode
  // A badge before the title, and labels after it
  readonly badge?: ReactNode
  readonly labels?: ReactNode
  readonly description?: ReactNode
  // Why it applies to the projet, in words
  readonly scopeLabel: string
  // It has a place on the map
  readonly isOnMap: boolean
  readonly link?: ReactNode
}

type SyntheseListProps<T extends SyntheseEntry> = {
  readonly entries: readonly T[]
  readonly activeId?: string
  // Pointed at or focused: the map brings it forward
  readonly onActivate: (entry: T) => void
  readonly onDeactivate: () => void
  // When the map is out of view: a button leads there
  readonly onShowOnMap?: (entry: T) => void
}

const border = `1px solid ${fr.colors.decisions.border.default.grey.default}`

export function SyntheseList<T extends SyntheseEntry>({
  entries,
  activeId,
  onActivate,
  onDeactivate,
  onShowOnMap,
}: SyntheseListProps<T>) {
  return (
    <ul className='fr-raw-list' style={{borderTop: border}}>
      {entries.map(entry => (
        <li
          key={entry.id}
          style={{
            padding: `${fr.spacing('2w')} ${fr.spacing('1w')}`,
            borderBottom: border,
            backgroundColor: entry.id === activeId ? fr.colors.decisions.background.alt.blueFrance.default : undefined,
          }}
          onMouseEnter={() => {
            onActivate(entry)
          }}
          onMouseLeave={onDeactivate}
          onFocus={() => {
            onActivate(entry)
          }}
          onBlur={onDeactivate}
        >
          <div style={{...inline, gap: `${fr.spacing('1v')} ${fr.spacing('3v')}`}}>
            {entry.badge}
            <h4 className='fr-text--md fr-text--bold fr-mb-0'>{entry.title}</h4>
            {entry.labels}
          </div>
          {entry.description !== undefined && <p className='fr-text--sm fr-mt-1v fr-mb-0'>{entry.description}</p>}
          <p className='fr-text--sm fr-mt-1w fr-mb-0' style={{...inline, gap: `${fr.spacing('1v')} ${fr.spacing('2w')}`}}>
            <Scope entry={entry} />
            {entry.isOnMap && onShowOnMap && (
              <button
                type='button'
                className='fr-link fr-link--sm'
                onClick={() => {
                  onShowOnMap(entry)
                }}
              >
                Voir sur la carte
              </button>
            )}
            {entry.link}
          </p>
        </li>
      ))}
    </ul>
  )
}

// A pin marks what the map shows
function Scope({entry}: {readonly entry: SyntheseEntry}) {
  return entry.isOnMap
    ? (
      // The pin stays beside the words when they wrap
      <span style={{
        display: 'flex', alignItems: 'flex-start', color: fr.colors.decisions.text.actionHigh.blueFrance.default, fontWeight: 500,
      }}>
        <span className='fr-icon-map-pin-2-line fr-icon--sm fr-mr-1v' aria-hidden='true' />
        <span>{entry.scopeLabel}</span>
      </span>
    )
    : <span style={{color: mentionColor}}>{entry.scopeLabel}</span>
}
