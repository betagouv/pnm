import {Alert} from '@codegouvfr/react-dsfr/Alert'
import type {Recommandation} from '@pnm/shared'
import {Navigate, useLoaderData} from 'react-router'
import {ActiviteSummary} from '../components/activite-summary.tsx'
import {type RecommandationGroup, RecommandationGroups} from '../components/recommandation-groups.tsx'
import {StepNavigation} from '../components/step-navigation.tsx'
import {useParc} from '../parcs.ts'
import {pictogramUrl} from '../pictograms.ts'
import {enjeuPath, findObjectif, objectifAnchor} from '../plan-gestion.ts'
import {projetStepPath, useActivite} from '../projet.ts'
import {type RecommandationsStepData, selectRecommandations} from '../recommandations.ts'

export function RecommandationsStepPage() {
  const parc = useParc()!
  const activite = useActivite(parc.id)
  const step = useLoaderData<RecommandationsStepData>()

  if (!activite) {
    return <Navigate replace to={projetStepPath(parc.id, 'activite')} />
  }

  if (step.status === 'noLocalisation') {
    return <Navigate replace to={projetStepPath(parc.id, 'localisation')} />
  }

  const {plan, croisement, mapped} = step
  const projetHabitats = new Map(croisement?.habitats.map(habitat => [habitat.code, habitat.nom]))
  const habitatNoms = new Map(plan.habitats.map(habitat => [habitat.code, habitat.nom]))
  const recommandations = selectRecommandations(plan.recommandations, activite.id, croisement && new Set(projetHabitats.keys()), new Set(mapped))

  // A recommandation meant for habitats says which ones of the projet it concerns, or, when none
  // has a map yet, which ones it is meant for
  function detail(recommandation: Recommandation): string | undefined {
    const concerned = recommandation.habitats.flatMap(code => projetHabitats.get(code) ?? [])

    if (concerned.length > 0) {
      return `Habitat de votre projet : ${concerned.join(', ')}`
    }

    const noms = recommandation.habitats.flatMap(code => habitatNoms.get(code) ?? [])
    return noms.length === 0 ? undefined : `Pour les habitats : ${noms.join(', ')}`
  }

  function item(recommandation: Recommandation) {
    const place = recommandation.objectif === undefined ? undefined : findObjectif(plan, recommandation.objectif)
    return {
      id: recommandation.id,
      titre: recommandation.titre,
      description: recommandation.description,
      objectif: place && {
        libelle: place.objectif.libelle,
        to: `${enjeuPath(parc.id, place.enjeu.id)}#${objectifAnchor(place.objectif.id)}`,
      },
      detail: detail(recommandation),
    }
  }

  // By enjeu, in the order of the plan; those that the plan does not place come last
  const groups: RecommandationGroup[] = [
    ...plan.enjeux.map(enjeu => ({
      id: enjeu.id,
      titre: enjeu.libelle,
      pictogrammeUrl: enjeu.pictogramme === undefined ? undefined : pictogramUrl(enjeu.pictogramme),
      recommandations: recommandations.filter(recommandation => recommandation.enjeu === enjeu.id).map(recommandation => item(recommandation)),
    })),
    {
      id: 'autres',
      titre: 'Autres recommandations',
      recommandations: recommandations.filter(recommandation => recommandation.enjeu === undefined).map(recommandation => item(recommandation)),
    },
  ].filter(group => group.recommandations.length > 0)

  return (
    <>
      <h2>Les recommandations pour votre projet</h2>
      <ActiviteSummary activite={activite} changeLink={projetStepPath(parc.id, 'activite')} />
      {croisement === undefined && (
        <Alert
          small
          className='fr-mb-3w'
          severity='warning'
          description='Les recommandations propres aux habitats concernés par votre projet ne peuvent pas être affichées pour le moment.'
        />
      )}
      {recommandations.length === 0
        ? <p>Le plan de gestion du parc n'a pas de recommandation pour votre projet.</p>
        : (
          <>
            <p>
              {recommandations.length === 1
                ? 'Une recommandation du plan de gestion du parc, selon votre activité et les habitats concernés par votre projet.'
                : `${recommandations.length} recommandations du plan de gestion du parc, selon votre activité et les habitats concernés par votre projet, rangées par enjeu.`}
            </p>
            <RecommandationGroups groups={groups} />
          </>
        )}
      <p className='fr-text--xs fr-mt-4w fr-mb-0'>
        Source : plan de gestion du parc.
      </p>
      <StepNavigation previous={projetStepPath(parc.id, 'enjeux')} />
    </>
  )
}
