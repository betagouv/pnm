import {fr} from '@codegouvfr/react-dsfr'
import {Breadcrumb} from '@codegouvfr/react-dsfr/Breadcrumb'
import {Stepper} from '@codegouvfr/react-dsfr/Stepper'
import type {Parc} from '@pnm/shared'
import type {CSSProperties, Ref} from 'react'
import type {To} from 'react-router'

type ProjetHeaderProps = {
  readonly parc: Parc
  readonly parcsLink: To
  readonly stepperRef?: Ref<HTMLDivElement>
  readonly step?: {
    readonly current: number
    readonly count: number
    readonly titre: string
    readonly nextTitre?: string
  }
}

const stepperStyle: CSSProperties & Record<`--${string}`, string> = {
  // The stepper sits on a tinted background: its upcoming steps take the page background to stay visible
  '--background-contrast-grey': fr.colors.decisions.background.default.grey.default,
  // Room above the stepper when it is scrolled into view
  scrollMarginTop: fr.spacing('3w'),
}

export function ProjetHeader({
  parc,
  parcsLink,
  stepperRef,
  step,
}: ProjetHeaderProps) {
  return (
    <div style={{backgroundColor: fr.colors.decisions.background.contrast.blueEcume.default}}>
      <div className='fr-container fr-pt-1w fr-pb-4w'>
        <Breadcrumb
          className='fr-mb-3w'
          homeLinkProps={{to: '/'}}
          segments={[{label: 'Préparer mon projet', linkProps: {to: parcsLink}}]}
          currentPageLabel={parc.nom}
        />
        <p className='fr-text--sm fr-text--bold fr-mb-1w'>
          <span className='fr-icon-map-pin-2-line fr-icon--sm fr-mr-1v' aria-hidden='true' />
          {parc.nomComplet}
        </p>
        <h1 className='fr-mb-2w'>Préparer mon projet</h1>
        <p className='fr-text--lead fr-mb-4w'>
          Préparez votre projet en mer en quatre étapes et découvrez les démarches adaptées.
        </p>
        {step && (
          <div className='fr-grid-row'>
            <div className='fr-col-12 fr-col-md-8 fr-col-lg-6'>
              <Stepper
                ref={stepperRef}
                className='fr-mb-0'
                style={stepperStyle}
                currentStep={step.current}
                stepCount={step.count}
                title={step.titre}
                nextTitle={step.nextTitre}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
