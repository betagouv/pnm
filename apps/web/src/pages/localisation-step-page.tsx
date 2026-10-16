import {Alert} from '@codegouvfr/react-dsfr/Alert'
import {Navigate} from 'react-router'
import {ActiviteSummary} from '../components/activite-summary.tsx'
import {StepNavigation} from '../components/step-navigation.tsx'
import {useParc} from '../parcs.ts'
import {projetStepPath, useActivite} from '../projet.ts'

export function LocalisationStepPage() {
  const parc = useParc()!
  const activite = useActivite(parc.id)

  if (!activite) {
    return <Navigate replace to={projetStepPath(parc.id, 'activite')} />
  }

  return (
    <>
      <h2>Où se situe votre projet ?</h2>
      <ActiviteSummary activite={activite} changeLink={projetStepPath(parc.id, 'activite')} />
      <Alert
        small
        severity='info'
        description='Vous pourrez bientôt situer votre projet sur une carte du parc : un point, un parcours ou une zone.'
      />
      <StepNavigation
        previous={projetStepPath(parc.id, 'activite')}
        next={projetStepPath(parc.id, 'mesures')}
      />
    </>
  )
}
