import {Alert} from '@codegouvfr/react-dsfr/Alert'
import {Navigate} from 'react-router'
import {ActiviteSummary} from '../components/activite-summary.tsx'
import {StepNavigation} from '../components/step-navigation.tsx'
import {useParc} from '../parcs.ts'
import {projetStepPath, useActivite} from '../projet.ts'

export function MesuresStepPage() {
  const parc = useParc()!
  const activite = useActivite(parc.id)

  if (!activite) {
    return <Navigate replace to={projetStepPath(parc.id, 'activite')} />
  }

  return (
    <>
      <h2>Les mesures concrètes à prendre</h2>
      <ActiviteSummary activite={activite} changeLink={projetStepPath(parc.id, 'activite')} />
      <Alert
        small
        severity='info'
        description='Vous trouverez bientôt ici les mesures à prendre pour votre projet, selon votre activité et sa localisation dans le parc.'
      />
      <StepNavigation previous={projetStepPath(parc.id, 'habitats')} />
    </>
  )
}
