import {Alert} from '@codegouvfr/react-dsfr/Alert'
import {Button} from '@codegouvfr/react-dsfr/Button'
import {useEffect, useRef} from 'react'
import {Outlet, useMatch} from 'react-router'
import {ProjetHeader} from '../components/projet-header.tsx'
import {preparerProjetPath, useParc} from '../parcs.ts'
import {projetSteps} from '../projet.ts'

export function ProjetLayout() {
  // Always set here: the parc route loader answers 404 for an unknown parc
  const parc = useParc()!
  const stepPath = useMatch('/parcs/:parcId/preparer-mon-projet/:step')?.params.step
  const index = projetSteps.findIndex(step => step.path === stepPath)
  // A parc that is not yet available shows no step
  const step = parc.disponible ? projetSteps[index] : undefined
  const pageTitle = `Préparer mon projet - ${parc.nom} - Mon Parc Marin`
  const stepperRef = useRef<HTMLDivElement>(null)
  const shownStepPath = useRef(stepPath)

  // Step links keep the scroll position. From there, the stepper comes back into view smoothly if
  // it has scrolled out, and its title takes the focus so that screen readers announce the new step
  useEffect(() => {
    if (shownStepPath.current === stepPath) {
      return
    }

    shownStepPath.current = stepPath
    const stepper = stepperRef.current
    const title = stepper?.querySelector('h2')

    if (!stepper || !title) {
      return
    }

    title.tabIndex = -1
    title.focus({preventScroll: true})

    if (stepper.getBoundingClientRect().top >= 0) {
      return
    }

    const isMotionReduced = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    stepper.scrollIntoView({behavior: isMotionReduced ? 'instant' : 'smooth'})
  }, [stepPath])

  return (
    <>
      <title>
        {step ? `${step.titre}, étape ${index + 1} sur ${projetSteps.length} - ${pageTitle}` : pageTitle}
      </title>
      <ProjetHeader
        parc={parc}
        parcsLink={preparerProjetPath}
        stepperRef={stepperRef}
        step={step && {
          current: index + 1,
          count: projetSteps.length,
          titre: step.titre,
          nextTitre: projetSteps[index + 1]?.titre,
        }}
      />
      <div className='fr-container fr-py-6w'>
        {parc.disponible
          ? <Outlet />
          : (
            <>
              <Alert
                className='fr-mb-4w'
                severity='info'
                title='Ce parc sera bientôt disponible'
                description='Mon Parc Marin ouvre progressivement les parcs naturels marins.'
              />
              <Button priority='secondary' linkProps={{to: preparerProjetPath}}>
                Choisir un autre parc
              </Button>
            </>
          )}
      </div>
    </>
  )
}
