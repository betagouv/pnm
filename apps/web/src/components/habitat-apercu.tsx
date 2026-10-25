import type {Element, HabitatCroise, MultiPolygon} from '@pnm/shared'
import type {Ref} from 'react'
import {Link, type To} from 'react-router'
import {habitatFigure} from '../format.ts'
import {PartMeter} from './habitat-cards.tsx'
import {HabitatMap} from './habitat-map.tsx'
import {PlanText} from './plan-text.tsx'

type HabitatApercuProps = {
  readonly habitat: HabitatCroise
  readonly tilesUrl: string
  readonly perimetre: MultiPolygon
  readonly elements: readonly Element[]
  // The page of the habitat, apart from the projet
  readonly habitatLink: To
  // Takes the focus when the porteur de projet picks another habitat
  readonly headingRef?: Ref<HTMLHeadingElement>
}

// A habitat from the point of view of the projet: its figures, the map of the habitat around the
// projet, and a glimpse of what the plan de gestion says of it
export function HabitatApercu({
  habitat,
  tilesUrl,
  perimetre,
  elements,
  habitatLink,
  headingRef,
}: HabitatApercuProps) {
  return (
    <>
      <h3 ref={headingRef} tabIndex={-1} className='fr-h4 fr-mb-1w'>{habitat.nom}</h3>
      <p className='fr-mb-1w'>{habitatFigure(habitat)}</p>
      {habitat.surface > 0 && <PartMeter part={habitat.part} className='fr-mb-3w' />}
      <HabitatMap habitat={habitat} tilesUrl={tilesUrl} perimetre={perimetre} elements={elements} />
      <p className='fr-text--xs fr-mt-1w'>
        Les contours de l'habitat sont élargis et simplifiés : ils montrent où il se trouve, pas sa
        limite exacte.
      </p>
      {habitat.synthese !== undefined && <PlanText isFirstParagraphOnly text={habitat.synthese} />}
      <Link className='fr-link fr-icon-arrow-right-line fr-link--icon-right' to={habitatLink}>
        Voir la fiche de l'habitat
        <span className='fr-sr-only'>{` ${habitat.nom}`}</span>
      </Link>
    </>
  )
}
