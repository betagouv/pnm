import {fr} from '@codegouvfr/react-dsfr'
import {Alert, type AlertProps} from '@codegouvfr/react-dsfr/Alert'
import {Badge} from '@codegouvfr/react-dsfr/Badge'
import {Summary} from '@codegouvfr/react-dsfr/Summary'
import {Tag} from '@codegouvfr/react-dsfr/Tag'
import type {
  Activite,
  Croisement,
  Element,
  HabitatCroise,
  NiveauRegle,
  PlanGestion,
  Regle,
} from '@pnm/shared'
import {
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from 'react'
import {Link, Navigate, useLoaderData} from 'react-router'
import {ActiviteSummary} from '../components/activite-summary.tsx'
import {LocalisationSummary} from '../components/localisation-summary.tsx'
import {habitatColors} from '../components/map.ts'
import {StepNavigation} from '../components/step-navigation.tsx'
import {SyntheseList, SyntheseSection, type SyntheseEntry} from '../components/synthese-list.tsx'
import {SyntheseMapCard} from '../components/synthese-map.tsx'
import {exempleEspeces, exempleRegles} from '../exemples.ts'
import {formatDistance, formatSurface} from '../format.ts'
import {useIsWide} from '../media.ts'
import {useParc} from '../parcs.ts'
import {habitatPath} from '../plan-gestion.ts'
import {useProjet} from '../projet-storage.ts'
import {projetStepPath, useActivite} from '../projet.ts'
import {
  byScope,
  type Scope,
  scopeCaption,
  scopeCodes,
  scopeLabel,
  scopeOf,
  selectForProjet,
  type SyntheseCarte,
  type SyntheseStepData,
} from '../synthese.ts'

export function SyntheseStepPage() {
  const parc = useParc()!
  const activite = useActivite(parc.id)
  const projet = useProjet(parc.id)
  const step = useLoaderData<SyntheseStepData>()

  if (!activite || !projet) {
    return <Navigate replace to={projetStepPath(parc.id, 'activite')} />
  }

  if (step.status === 'noLocalisation') {
    return <Navigate replace to={projetStepPath(parc.id, 'localisation')} />
  }

  return (
    <Synthese
      parcId={parc.id}
      activite={activite}
      localisation={projet.localisation ?? []}
      plan={step.plan}
      carte={step.carte}
    />
  )
}

// A habitat of the projet, in its colour on the map
type HabitatColore = HabitatCroise & {readonly color: string}

// An entry, and why it applies to the projet: the map shows it from there
type Entry = SyntheseEntry & {readonly scope: Scope}

// What each niveau of regle reads as, from the strongest
const niveaux: Record<NiveauRegle, {readonly label: string, readonly severity: AlertProps.Severity}> = {
  interdiction: {label: 'Interdit', severity: 'error'},
  avisConforme: {label: 'Avis conforme', severity: 'warning'},
  autorisation: {label: 'Autorisation', severity: 'warning'},
  declaration: {label: 'Déclaration', severity: 'info'},
}
const niveauOrder = Object.keys(niveaux)

function scoped(scope: Scope): Pick<Entry, 'scope' | 'scopeLabel' | 'isOnMap'> {
  return {scope, scopeLabel: scopeLabel(scope), isOnMap: scope.type === 'habitats'}
}

// "2 règles", "1 règle", "aucune"
function count(value: number, singular: string, plural: string, none: string): string {
  return value === 0 ? none : `${value} ${value === 1 ? singular : plural}`
}

function regleEntries(regles: readonly Regle[], habitats: readonly HabitatCroise[]): Entry[] {
  return regles.map(regle => ({
    id: `regle-${regle.id}`,
    title: regle.titre,
    badge: <Badge small as='span' severity={niveaux[regle.niveau].severity}>{niveaux[regle.niveau].label}</Badge>,
    ...scoped(scopeOf(regle, habitats)),
  }))
}

function habitatEntries(parcId: string, habitats: readonly HabitatColore[]): Entry[] {
  return habitats.map(habitat => ({
    id: `habitat-${habitat.code}`,
    title: habitat.nom,
    scope: {type: 'habitats', habitats: [habitat]},
    scopeLabel: habitat.distance === 0 ? 'Dans votre zone' : `À ${formatDistance(habitat.distance)} de votre projet`,
    isOnMap: true,
    link: (
      <Link className='fr-link fr-link--sm' to={habitatPath(parcId, habitat.code)}>
        Fiche de l'habitat
        <span className='fr-sr-only'>{` ${habitat.nom}`}</span>
      </Link>
    ),
  }))
}

function especeEntries(activite: number, habitats: readonly HabitatCroise[] | undefined): Entry[] {
  return selectForProjet(exempleEspeces, activite, habitats)
    .map((espece): Entry => ({
      id: `espece-${espece.nomScientifique}`,
      title: (
        <>
          {espece.nom}
          {' '}
          <span lang='la' className='fr-text--regular' style={{fontStyle: 'italic'}}>{espece.nomScientifique}</span>
        </>
      ),
      labels: <Badge small as='span' className='fr-badge--green-emeraude'>{espece.statut}</Badge>,
      description: espece.description,
      ...scoped(scopeOf(espece, habitats ?? [])),
    }))
    .toSorted(byScope)
}

function recommandationEntries(plan: PlanGestion, activite: number, habitats: readonly HabitatCroise[] | undefined): Entry[] {
  const enjeux = new Map(plan.enjeux.map(enjeu => [enjeu.id, enjeu.libelle]))

  return selectForProjet(plan.recommandations, activite, habitats)
    .map((recommandation): Entry => {
      const enjeu = recommandation.enjeu === undefined ? undefined : enjeux.get(recommandation.enjeu)

      return {
        id: `recommandation-${recommandation.id}`,
        // Without a title, the description takes its place
        title: recommandation.titre ?? recommandation.description,
        description: recommandation.titre === undefined ? undefined : recommandation.description,
        labels: enjeu !== undefined && <Tag small as='span'>{enjeu}</Tag>,
        ...scoped(scopeOf(recommandation, habitats ?? [])),
      }
    })
    .toSorted(byScope)
}

function habitatsCount(habitats: readonly HabitatCroise[] | undefined): string {
  if (habitats === undefined) {
    return 'non disponibles pour le moment'
  }

  if (habitats.length === 0) {
    return 'aucun habitat connu'
  }

  const inside = habitats.filter(habitat => habitat.distance === 0).length
  const near = habitats.length - inside
  const parts = [
    inside > 0 && `${count(inside, 'habitat', 'habitats', '')} dans votre zone`,
    near > 0 && `${inside > 0 ? near : count(near, 'habitat', 'habitats', '')} à proximité`,
  ].filter(part => part !== false)
  return parts.join(' et ')
}

type SyntheseProps = {
  readonly parcId: string
  readonly activite: Activite
  readonly localisation: readonly Element[]
  readonly plan: PlanGestion
  readonly carte?: SyntheseCarte
}

function Synthese({
  parcId,
  activite,
  localisation,
  plan,
  carte,
}: SyntheseProps) {
  const isWide = useIsWide()
  const [active, setActive] = useState<Entry>()
  const cardRef = useRef<HTMLDivElement>(null)
  const croisement = carte?.croisement
  // In turn, the largest part of the projet first
  const habitats = useMemo(
    () => croisement?.habitats.map((habitat, index): HabitatColore => ({...habitat, color: habitatColors[index % habitatColors.length]!})),
    [croisement],
  )
  const regles = useMemo(
    () => selectForProjet(exempleRegles, activite.id, habitats)
      .toSorted((a, b) => niveauOrder.indexOf(a.niveau) - niveauOrder.indexOf(b.niveau)),
    [activite, habitats],
  )
  const entries = useMemo(() => ({
    regles: regleEntries(regles, habitats ?? []),
    habitats: habitatEntries(parcId, habitats ?? []),
    especes: especeEntries(activite.id, habitats),
    recommandations: recommandationEntries(plan, activite.id, habitats),
  }), [parcId, activite, plan, habitats, regles])
  const highlighted = useMemo(() => (active ? scopeCodes(active.scope) : []), [active])
  const interdictions = regles.filter(regle => regle.niveau === 'interdiction').length

  // On a small screen, the map sits above the lists
  function showOnMap(entry: Entry) {
    setActive(entry)
    const isMotionReduced = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    cardRef.current?.scrollIntoView({behavior: isMotionReduced ? 'instant' : 'smooth'})
  }

  const listProps = {
    activeId: active?.id,
    onActivate: setActive,
    onDeactivate() {
      setActive(undefined)
    },
    onShowOnMap: isWide || !carte ? undefined : showOnMap,
  }

  const enBref = (
    <Summary
      as='h3'
      title='En bref'
      links={[
        {
          text: `Réglementation : ${count(regles.length, 'règle', 'règles', 'aucune règle connue')}${interdictions > 0 ? `, dont ${count(interdictions, 'interdiction', 'interdictions', '')}` : ''}`,
          linkProps: {href: '#reglementation'},
        },
        {text: `Habitats : ${habitatsCount(habitats)}`, linkProps: {href: '#habitats'}},
        {
          text: `Espèces : ${count(entries.especes.length, 'espèce protégée', 'espèces protégées', 'aucune espèce signalée')}`,
          linkProps: {href: '#especes'},
        },
        {
          text: `Recommandations : ${count(entries.recommandations.length, 'recommandation du parc', 'recommandations du parc', 'aucune')}`,
          linkProps: {href: '#recommandations'},
        },
      ]}
    />
  )

  const mapCard = carte && habitats && (
    <SyntheseMapCard
      ref={cardRef}
      tilesUrl={carte.tilesUrl}
      perimetre={carte.perimetre}
      elements={localisation}
      habitats={habitats}
      highlighted={highlighted}
      caption={active ? scopeCaption(active.scope) : 'Votre projet et les habitats qu\'il rencontre.'}
    />
  )

  const sections = (
    <>
      <SyntheseSection isExample id='reglementation' title='Réglementation' intro="Ce qui s'impose à votre projet.">
        {entries.regles.length === 0
          ? <p>Aucune règle connue ne vise votre projet.</p>
          : <SyntheseList entries={entries.regles} {...listProps} />}
      </SyntheseSection>
      <HabitatsSection croisement={croisement}>
        {entries.habitats.length > 0 && <SyntheseList entries={entries.habitats} {...listProps} />}
      </HabitatsSection>
      <SyntheseSection isExample id='especes' title='Espèces' intro='Les espèces protégées que votre projet peut croiser.'>
        {entries.especes.length === 0
          ? <p>Aucune espèce protégée n'est signalée pour votre projet.</p>
          : <SyntheseList entries={entries.especes} {...listProps} />}
      </SyntheseSection>
      <SyntheseSection
        id='recommandations'
        title='Recommandations'
        intro='Les conseils du plan de gestion du parc, selon votre activité et les habitats de votre zone.'
      >
        {entries.recommandations.length === 0
          ? <p>Le plan de gestion du parc n'a pas de recommandation pour votre projet.</p>
          : <SyntheseList entries={entries.recommandations} {...listProps} />}
      </SyntheseSection>
    </>
  )

  return (
    <>
      <h2>Ce qui concerne votre projet</h2>
      <ActiviteSummary activite={activite} changeLink={projetStepPath(parcId, 'activite')} className='fr-mb-1w' />
      <LocalisationSummary elements={localisation} surface={croisement?.surface} changeLink={projetStepPath(parcId, 'localisation')} />
      {croisement === undefined && (
        <Alert
          small
          className='fr-mb-3w'
          severity='warning'
          description='La carte, les habitats et ce qui en dépend ne peuvent pas être affichés pour le moment.'
        />
      )}
      {isWide
        ? (
          <div className='fr-grid-row fr-grid-row--gutters'>
            <div className='fr-col-8'>
              {enBref}
              {sections}
            </div>
            <div className='fr-col-4'>
              {/* Stays in view while the lists scroll by */}
              <div style={{position: 'sticky', top: fr.spacing('2w')}}>{mapCard}</div>
            </div>
          </div>
        )
        : (
          <>
            {enBref}
            {mapCard && <div className='fr-mt-3w'>{mapCard}</div>}
            {sections}
          </>
        )}
      <p className='fr-text--xs fr-mt-6w fr-mb-0'>
        Sources : plan de gestion du parc, cartographies des habitats de l'OFB. Réglementation et
        espèces : contenus d'exemple, en attendant leurs sources.
      </p>
      <StepNavigation previous={projetStepPath(parcId, 'localisation')} />
    </>
  )
}

type HabitatsSectionProps = {
  // Undefined when the croisement failed
  readonly croisement?: Croisement
  // The habitats of the projet
  readonly children: ReactNode
}

function HabitatsSection({croisement, children}: HabitatsSectionProps) {
  if (!croisement) {
    return (
      <SyntheseSection id='habitats' title='Habitats'>
        <Alert small severity='warning' description='Les habitats ne peuvent pas être affichés pour le moment.' />
      </SyntheseSection>
    )
  }

  const {surface, tolerance} = croisement

  return (
    <SyntheseSection
      id='habitats'
      title='Habitats'
      intro={surface > 0
        ? `Ce que votre projet rencontre sur le fond. Il couvre ${formatSurface(surface)}.`
        : 'Ce que votre projet rencontre sur le fond. Il n\'a pas de surface : donnez un rayon à vos lieux, une largeur à votre parcours ou une marge à votre zone.'}
    >
      {croisement.habitats.length === 0 && (
        <Alert
          small
          severity='info'
          description={`Les données disponibles ne signalent aucun habitat dans votre zone de projet, ni à moins de ${formatDistance(tolerance)}.`}
        />
      )}
      {children}
    </SyntheseSection>
  )
}
