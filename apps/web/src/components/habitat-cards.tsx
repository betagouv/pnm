import {fr} from '@codegouvfr/react-dsfr'
import {Card} from '@codegouvfr/react-dsfr/Card'
import type {HabitatCroise} from '@pnm/shared'
import {habitatFigure} from '../format.ts'
import {habitatColor} from './map.ts'

type HabitatCardsProps = {
  readonly habitats: readonly HabitatCroise[]
  // The elements of the projet in words, by id, when there are several to tell apart
  readonly elementTitles?: ReadonlyMap<string, string>
  readonly selectedCode?: string
  readonly onSelect: (habitat: HabitatCroise) => void
}

// One card per habitat. A card is a button: it shows its habitat next to the cards
export function HabitatCards({
  habitats,
  elementTitles,
  selectedCode,
  onSelect,
}: HabitatCardsProps) {
  return (
    <ul className='fr-grid-row fr-grid-row--gutters fr-raw-list'>
      {habitats.map(habitat => (
        <li key={habitat.code} className='fr-col-12 fr-col-md-6 fr-col-lg-12'>
          <HabitatCard
            habitat={habitat}
            elementTitles={elementTitles}
            isSelected={habitat.code === selectedCode}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  )
}

type HabitatCardProps = {
  readonly habitat: HabitatCroise
  readonly elementTitles?: ReadonlyMap<string, string>
  readonly isSelected: boolean
  readonly onSelect: (habitat: HabitatCroise) => void
}

function HabitatCard({
  habitat,
  elementTitles,
  isSelected,
  onSelect,
}: HabitatCardProps) {
  const concerned = elementTitles && habitat.elements.flatMap(id => elementTitles.get(id) ?? [])

  return (
    <Card
      className='fr-enlarge-button'
      // The DSFR has no selected card: the border of an active element marks it
      style={isSelected ? {boxShadow: `inset 0 0 0 2px ${fr.colors.decisions.border.active.blueFrance.default}`} : undefined}
      title={(
        <button
          type='button'
          aria-pressed={isSelected}
          onClick={() => {
            onSelect(habitat)
          }}
        >
          {habitat.nom}
        </button>
      )}
      titleAs='h4'
      desc={habitatFigure(habitat)}
      end={habitat.surface > 0 && <PartMeter part={habitat.part} className='fr-mb-2w' />}
      endDetail={concerned && concerned.length > 0 ? `Concerne : ${concerned.join(', ')}` : undefined}
    />
  )
}

type PartMeterProps = {
  readonly part: number
  readonly className?: string
}

// The share of the projet in the habitat, as a strip of the projet filled in the colour of the
// habitat. The figure says it in words: the strip only shows it
export function PartMeter({part, className}: PartMeterProps) {
  return (
    <div
      aria-hidden
      className={className}
      style={{height: '0.5rem', backgroundColor: fr.colors.decisions.background.contrast.grey.default}}
    >
      {/* Never thinner than a sliver, so that a small share still shows */}
      <div style={{height: '100%', width: `max(${part * 100}%, 3px)`, backgroundColor: habitatColor}} />
    </div>
  )
}
