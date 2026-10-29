import {Alert} from '@codegouvfr/react-dsfr/Alert'
import type {Activite, Element, HabitatCroise} from '@pnm/shared'
import {useMemo, useRef, useState} from 'react'
import {Link, Navigate, useLoaderData} from 'react-router'
import {ActiviteSummary} from '../components/activite-summary.tsx'
import {ComingSoon} from '../components/coming-soon.tsx'
import {elementTitle} from '../components/element-list.tsx'
import {EnjeuCards} from '../components/enjeu-cards.tsx'
import {HabitatsApercu} from '../components/habitats-apercu.tsx'
import {StepNavigation} from '../components/step-navigation.tsx'
import {formatDistance, formatSurface} from '../format.ts'
import type {HabitatsStepData} from '../habitats.ts'
import {useParc} from '../parcs.ts'
import {habitatPath} from '../plan-gestion.ts'
import {useProjet} from '../projet-storage.ts'
import {projetStepPath, useActivite} from '../projet.ts'

export function EnjeuxStepPage() {
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
    <Enjeux
      parcId={parc.id}
      activite={activite}
      localisation={projet.localisation ?? []}
      habitats={habitats}
    />
  )
}

type EnjeuId = 'gouvernance' | 'habitats' | 'especes'

// "2 habitats dans votre zone et 1 à proximité"
function habitatsResume(habitats: HabitatsStepData): string {
  if (habitats.status !== 'loaded') {
    return 'Indisponibles pour le moment'
  }

  const inside = habitats.croisement.habitats.filter(habitat => habitat.distance === 0).length
  const near = habitats.croisement.habitats.length - inside

  if (inside === 0 && near === 0) {
    return 'Aucun habitat connu'
  }

  const plural = (count: number) => `${count} habitat${count > 1 ? 's' : ''}`
  return [
    inside > 0 && `${plural(inside)} dans votre zone`,
    near > 0 && `${inside > 0 ? near : plural(near)} à proximité`,
  ].filter(part => part !== false).join(' et ')
}

type EnjeuxProps = {
  readonly parcId: string
  readonly activite: Activite
  readonly localisation: readonly Element[]
  readonly habitats: HabitatsStepData
}

function Enjeux({
  parcId,
  activite,
  localisation,
  habitats,
}: EnjeuxProps) {
  // The habitats first: the other enjeux have nothing to show yet
  const [selectedId, setSelectedId] = useState<EnjeuId>('habitats')
  const [highlightedCode, setHighlightedCode] = useState<string>()
  const apercuHeadingRef = useRef<HTMLHeadingElement>(null)
  const enjeux = useMemo(() => [
    {id: 'gouvernance' as const, titre: 'Gouvernance', resume: 'À venir'},
    {id: 'habitats' as const, titre: 'Habitats', resume: habitatsResume(habitats)},
    {id: 'especes' as const, titre: 'Espèces', resume: 'À venir'},
  ], [habitats])
  const selected = enjeux.find(enjeu => enjeu.id === selectedId)!

  function select(id: EnjeuId) {
    setSelectedId(id)
    // Below the cards on a small screen: the heading of the enjeu comes into view, and screen
    // readers announce it
    requestAnimationFrame(() => {
      apercuHeadingRef.current?.focus()
    })
  }

  return (
    <>
      <h2>Les enjeux concernés par votre projet</h2>
      <ActiviteSummary activite={activite} changeLink={projetStepPath(parcId, 'activite')} />
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-lg-4'>
          <EnjeuCards enjeux={enjeux} selectedId={selectedId} onSelect={select} />
        </div>
        <section className='fr-col-12 fr-col-lg-8' aria-labelledby='apercu-enjeu'>
          <h3 ref={apercuHeadingRef} id='apercu-enjeu' tabIndex={-1} className='fr-h4 fr-mb-2w'>{selected.titre}</h3>
          {selectedId === 'gouvernance' && (
            <ComingSoon>Les zones de gouvernance que rencontre votre projet apparaîtront ici.</ComingSoon>
          )}
          {selectedId === 'especes' && (
            <ComingSoon>Les espèces protégées que votre projet peut rencontrer apparaîtront ici.</ComingSoon>
          )}
          {selectedId === 'habitats' && (habitats.status === 'loaded'
            ? (
              <Habitats
                parcId={parcId}
                habitats={habitats}
                localisation={localisation}
                highlightedCode={highlightedCode}
                onHighlight={habitat => {
                  // The highlighted habitat, chosen again, fades back among the others
                  setHighlightedCode(code => code === habitat.code ? undefined : habitat.code)
                }}
              />
            )
            : (
              <Alert
                small
                severity='warning'
                description='Les habitats ne peuvent pas être affichés pour le moment. Vous pouvez continuer, et revenir à cette étape plus tard.'
              />
            ))}
        </section>
      </div>
      <StepNavigation previous={projetStepPath(parcId, 'localisation')} next={projetStepPath(parcId, 'recommandations')} />
    </>
  )
}

type HabitatsProps = {
  readonly parcId: string
  readonly habitats: Extract<HabitatsStepData, {status: 'loaded'}>
  readonly localisation: readonly Element[]
  readonly highlightedCode?: string
  readonly onHighlight: (habitat: HabitatCroise) => void
}

function Habitats({
  parcId,
  habitats: {croisement, perimetre, tilesUrl},
  localisation,
  highlightedCode,
  onHighlight,
}: HabitatsProps) {
  const {surface, tolerance} = croisement
  const highlighted = croisement.habitats.find(habitat => habitat.code === highlightedCode)
  // With a single element, the habitat need not say which one it concerns
  const elementTitles = localisation.length > 1
    ? new Map(localisation.map(element => [element.id, elementTitle(element)]))
    : undefined

  // Where the habitat lies from the projet, and which elements of the projet it concerns
  function detail(habitat: HabitatCroise): string | undefined {
    const parts = [
      habitat.distance > 0 && `À ${formatDistance(habitat.distance)} de votre projet`,
      elementTitles && `Concerne : ${habitat.elements.flatMap(id => elementTitles.get(id) ?? []).join(', ')}`,
    ].filter(part => typeof part === 'string')
    return parts.length > 0 ? parts.join(' · ') : undefined
  }

  return (
    <>
      <p>
        {surface > 0
          ? `Votre projet couvre ${formatSurface(surface)}.`
          : 'Votre projet n\'a pas de surface : donnez un rayon à vos lieux, une largeur à votre parcours ou une marge à votre zone.'}
        {/* Keeps the scroll position, like the other links between steps */}
        <Link preventScrollReset className='fr-link fr-link--sm fr-ml-2w' to={projetStepPath(parcId, 'localisation')}>
          Modifier la localisation
        </Link>
      </p>
      {croisement.habitats.length === 0
        ? (
          <Alert
            small
            severity='info'
            description={`Les données disponibles ne signalent aucun habitat dans votre zone de projet, ni à moins de ${formatDistance(tolerance)}.`}
          />
        )
        : (
          <HabitatsApercu
            habitats={croisement.habitats}
            tolerance={tolerance}
            highlighted={highlighted}
            highlightedDetail={highlighted && detail(highlighted)}
            highlightedLink={highlighted && habitatPath(parcId, highlighted.code)}
            tilesUrl={tilesUrl}
            perimetre={perimetre}
            elements={localisation}
            onHighlight={onHighlight}
          />
        )}
      <p className='fr-text--xs fr-mt-4w fr-mb-0'>
        Sources : cartographies des habitats de l'OFB, plan de gestion du parc.
      </p>
    </>
  )
}
