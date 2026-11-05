import type {Element, HabitatCroise, MultiPolygon} from '@pnm/shared'
import {Link, type To} from 'react-router'
import {formatDistance} from '../format.ts'
import {HabitatMap} from './habitat-map.tsx'
import {HabitatTags} from './habitat-tags.tsx'
import {PlanText} from './plan-text.tsx'

type HabitatsApercuProps = {
  // Those the projet meets, inside it first
  readonly habitats: readonly HabitatCroise[]
  // In meters: a habitat this close to the projet is listed
  readonly tolerance: number
  readonly highlighted?: HabitatCroise
  readonly onHighlight: (habitat: HabitatCroise) => void
  // Where the highlighted habitat lies from the projet and what it concerns, in words
  readonly highlightedDetail?: string
  // The page of the highlighted habitat, apart from the projet
  readonly highlightedLink?: To
  // The PMTiles of the surfaces of every habitat, as an absolute address
  readonly tilesUrl: string
  readonly perimetre: MultiPolygon
  readonly elements: readonly Element[]
}

// Every habitat the projet meets, as tags and on a map. A tag brings its habitat forward
export function HabitatsApercu({
  habitats,
  tolerance,
  highlighted,
  onHighlight,
  highlightedDetail,
  highlightedLink,
  tilesUrl,
  perimetre,
  elements,
}: HabitatsApercuProps) {
  const inside = habitats.filter(habitat => habitat.distance === 0)
  const near = habitats.filter(habitat => habitat.distance > 0)

  return (
    <>
      <div className='fr-grid-row fr-grid-row--gutters'>
        {inside.length > 0 && (
          <section className='fr-col-12 fr-col-md'>
            <h4 className='fr-h6 fr-mb-1w'>Dans votre zone de projet</h4>
            <HabitatTags habitats={inside} selectedCode={highlighted?.code} onSelect={onHighlight} />
          </section>
        )}
        {near.length > 0 && (
          <section className='fr-col-12 fr-col-md'>
            <h4 className='fr-h6 fr-mb-1v'>À proximité</h4>
            <p className='fr-text--sm fr-mb-1w'>{`À moins de ${formatDistance(tolerance)} de votre projet.`}</p>
            <HabitatTags habitats={near} selectedCode={highlighted?.code} onSelect={onHighlight} />
          </section>
        )}
      </div>
      <p className='fr-text--sm fr-mb-1w'>Choisissez un habitat pour le faire ressortir sur la carte.</p>
      <HabitatMap
        habitats={habitats}
        highlightedCode={highlighted?.code}
        tilesUrl={tilesUrl}
        perimetre={perimetre}
        elements={elements}
      />
      <p className='fr-text--xs fr-mt-1w'>
        Les contours des habitats sont élargis et simplifiés : ils montrent où ils se trouvent, pas
        leur limite exacte.
      </p>
      {highlighted && (
        <section aria-live='polite'>
          <h4 className='fr-h5 fr-mb-1w'>{highlighted.nom}</h4>
          {highlightedDetail !== undefined && <p className='fr-text--sm fr-mb-1w'>{highlightedDetail}</p>}
          {highlighted.synthese !== undefined && <PlanText isFirstParagraphOnly text={highlighted.synthese} />}
          {highlightedLink !== undefined && (
            <Link className='fr-link fr-icon-arrow-right-line fr-link--icon-right' to={highlightedLink}>
              Voir la fiche de l'habitat
              <span className='fr-sr-only'>{` ${highlighted.nom}`}</span>
            </Link>
          )}
        </section>
      )}
    </>
  )
}
