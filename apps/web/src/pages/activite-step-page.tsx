import {useState, type SubmitEvent} from 'react'
import {useNavigate} from 'react-router'
import {ActiviteRadios} from '../components/activite-radios.tsx'
import {StepNavigation} from '../components/step-navigation.tsx'
import {useParc} from '../parcs.ts'
import {saveProjet, useProjet} from '../projet-storage.ts'
import {projetStepPath, useActivites} from '../projet.ts'

const activiteField = 'activite'

export function ActiviteStepPage() {
  const parc = useParc()!
  const activites = useActivites()
  // Set when coming back to this step
  const projet = useProjet(parc.id)
  const navigate = useNavigate()
  const [isMissing, setIsMissing] = useState(false)

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const activite = new FormData(event.currentTarget).get(activiteField)

    if (typeof activite !== 'string') {
      setIsMissing(true)
      event.currentTarget.querySelector('input')?.focus()
      return
    }

    saveProjet({...projet, parc: parc.id, activite: Number(activite)})
    // Keeps the scroll position, like the other links between steps
    void navigate(projetStepPath(parc.id, 'localisation'), {preventScrollReset: true})
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div className='fr-grid-row'>
        <div className='fr-col-12 fr-col-md-8 fr-col-lg-6'>
          <ActiviteRadios
            activites={activites}
            legend={<h2 className='fr-mb-2w'>Quel est votre projet, votre activité ?</h2>}
            name={activiteField}
            defaultValue={projet?.activite}
            errorMessage={isMissing ? 'Choisissez une activité pour continuer.' : undefined}
            onChange={() => {
              setIsMissing(false)
            }}
          />
        </div>
      </div>
      <StepNavigation next='submit' />
    </form>
  )
}
