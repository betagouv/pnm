import {Alert} from '@codegouvfr/react-dsfr/Alert'
import {Navigate, useLoaderData} from 'react-router'
import {ActiviteSummary} from '../components/activite-summary.tsx'
import {RecommandationCards} from '../components/recommandation-cards.tsx'
import {StepNavigation} from '../components/step-navigation.tsx'
import {useParc} from '../parcs.ts'
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

  const {plan, croisement} = step
  const habitatNoms = new Map(croisement?.habitats.map(habitat => [habitat.code, habitat.nom]))
  const recommandations = selectRecommandations(plan.recommandations, activite.id, croisement && new Set(habitatNoms.keys()))
  // A recommandation meant for habitats says which ones of the projet it concerns
  const details = new Map(recommandations.flatMap(recommandation => {
    const noms = recommandation.habitats.flatMap(code => habitatNoms.get(code) ?? [])
    return noms.length === 0 ? [] : [[recommandation.id, `Habitat concerné : ${noms.join(', ')}`] as const]
  }))

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
            <p>Elles viennent du plan de gestion du parc, selon votre activité et les habitats concernés par votre projet.</p>
            <RecommandationCards recommandations={recommandations} enjeux={plan.enjeux} details={details} titleAs='h3' />
          </>
        )}
      <p className='fr-text--xs fr-mt-4w fr-mb-0'>
        Source : plan de gestion du parc.
      </p>
      <StepNavigation previous={projetStepPath(parc.id, 'habitats')} />
    </>
  )
}
