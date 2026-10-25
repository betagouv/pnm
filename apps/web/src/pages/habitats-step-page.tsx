import {Alert} from '@codegouvfr/react-dsfr/Alert'
import type {
  Croisement,
  Element,
  HabitatCroise,
  MultiPolygon,
} from '@pnm/shared'
import {useRef, useState} from 'react'
import {Link, Navigate, useLoaderData} from 'react-router'
import {ActiviteSummary} from '../components/activite-summary.tsx'
import {elementTitle} from '../components/element-list.tsx'
import {HabitatApercu} from '../components/habitat-apercu.tsx'
import {HabitatCards} from '../components/habitat-cards.tsx'
import {StepNavigation} from '../components/step-navigation.tsx'
import {formatDistance, formatPart, formatSurface} from '../format.ts'
import type {HabitatsStepData} from '../habitats.ts'
import {useParc} from '../parcs.ts'
import {habitatPath} from '../plan-gestion.ts'
import {useProjet} from '../projet-storage.ts'
import {projetStepPath, useActivite} from '../projet.ts'

export function HabitatsStepPage() {
  const parc = useParc()!
  const activite = useActivite(parc.id)
  const projet = useProjet(parc.id)
  const habitats = useLoaderData<HabitatsStepData>()

  if (!activite || !projet) {
    return <Navigate replace to={projetStepPath(parc.id, 'activite')} />
  }

  if (habitats.status === 'noLocalisation') {
    return <Navigate replace to={projetStepPath(parc.id, 'localisation')} />
  }

  return (
    <>
      <h2>Les habitats concernés par votre projet</h2>
      <ActiviteSummary activite={activite} changeLink={projetStepPath(parc.id, 'activite')} />
      {habitats.status === 'loaded'
        ? (
          <HabitatsCrossed
            parcId={parc.id}
            croisement={habitats.croisement}
            perimetre={habitats.perimetre}
            tilesUrl={habitats.tilesUrl}
            localisation={projet.localisation ?? []}
          />
        )
        : (
          <Alert
            small
            severity='warning'
            description='Les habitats ne peuvent pas être affichés pour le moment. Vous pouvez continuer, et revenir à cette étape plus tard.'
          />
        )}
      <StepNavigation previous={projetStepPath(parc.id, 'localisation')} next={projetStepPath(parc.id, 'mesures')} />
    </>
  )
}

type HabitatsCrossedProps = {
  readonly parcId: string
  readonly croisement: Croisement
  readonly perimetre: MultiPolygon
  readonly tilesUrl: string
  readonly localisation: readonly Element[]
}

function HabitatsCrossed({
  parcId,
  croisement,
  perimetre,
  tilesUrl,
  localisation,
}: HabitatsCrossedProps) {
  const {surface, surfaceHorsHabitat, tolerance} = croisement
  const inside = croisement.habitats.filter(habitat => habitat.distance === 0)
  const near = croisement.habitats.filter(habitat => habitat.distance > 0)
  // The largest part of the projet first, until the porteur de projet picks another habitat
  const [selectedCode, setSelectedCode] = useState(croisement.habitats[0]?.code)
  const selected = croisement.habitats.find(habitat => habitat.code === selectedCode)
  const apercuHeadingRef = useRef<HTMLHeadingElement>(null)
  // With a single element, the cards need not say which one
  const elementTitles = localisation.length > 1
    ? new Map(localisation.map(element => [element.id, elementTitle(element)]))
    : undefined

  function select(habitat: HabitatCroise) {
    setSelectedCode(habitat.code)
    // Below the cards on a small screen: the heading of the habitat comes into view, and screen
    // readers announce it
    requestAnimationFrame(() => {
      apercuHeadingRef.current?.focus()
    })
  }

  return (
    <>
      <p>
        {surface > 0
          ? `Votre projet couvre ${formatSurface(surface)}.`
          : 'Votre projet n\'a pas de surface : donnez un rayon à vos lieux, une largeur à votre parcours ou une marge à votre zone pour mesurer sa part dans chaque habitat.'}
        {/* Keeps the scroll position, like the other links between steps */}
        <Link preventScrollReset className='fr-link fr-link--sm fr-ml-2w' to={projetStepPath(parcId, 'localisation')}>
          Modifier la localisation
        </Link>
      </p>
      {croisement.habitats.length === 0 && (
        <Alert
          small
          severity='info'
          description={`Les données disponibles ne signalent aucun habitat dans votre zone de projet, ni à moins de ${formatDistance(tolerance)}.`}
        />
      )}
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-lg-5'>
          {inside.length > 0 && (
            <section className='fr-mt-2w'>
              <h3 className='fr-h5'>Dans votre zone de projet</h3>
              <HabitatCards
                habitats={inside}
                elementTitles={elementTitles}
                selectedCode={selectedCode}
                onSelect={select}
              />
              {surface > 0 && surfaceHorsHabitat > 0 && (
                <p className='fr-text--sm fr-mt-2w'>
                  {`Le reste de votre projet, ${formatPart(surfaceHorsHabitat / surface)} soit ${formatSurface(surfaceHorsHabitat)}, ne recoupe aucun habitat connu.`}
                </p>
              )}
            </section>
          )}
          {near.length > 0 && (
            <section className='fr-mt-2w'>
              <h3 className='fr-h5 fr-mb-1w'>À proximité</h3>
              <p className='fr-text--sm'>{`À moins de ${formatDistance(tolerance)} de votre projet.`}</p>
              <HabitatCards
                habitats={near}
                elementTitles={elementTitles}
                selectedCode={selectedCode}
                onSelect={select}
              />
            </section>
          )}
        </div>
        {selected && (
          <div className='fr-col-12 fr-col-lg-7'>
            {/* Stays in view while the cards scroll by */}
            <div className='fr-mt-2w' style={{position: 'sticky', top: '1rem'}}>
              <HabitatApercu
                habitat={selected}
                tilesUrl={tilesUrl}
                perimetre={perimetre}
                elements={localisation}
                habitatLink={habitatPath(parcId, selected.code)}
                headingRef={apercuHeadingRef}
              />
            </div>
          </div>
        )}
      </div>
      <p className='fr-text--xs fr-mt-4w fr-mb-0'>
        Sources : cartographies des habitats de l'OFB, plan de gestion du parc.
      </p>
    </>
  )
}
