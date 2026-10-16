import type {ButtonProps} from '@codegouvfr/react-dsfr/Button'
import {ButtonsGroup} from '@codegouvfr/react-dsfr/ButtonsGroup'
import type {To} from 'react-router'

type StepNavigationProps = {
  readonly previous?: To
  // A link to the next step, or 'submit' when the step is a form that leads there
  readonly next?: To | 'submit'
}

// The links keep the scroll position: the projet layout brings the stepper into view
export function StepNavigation({previous, next}: StepNavigationProps) {
  const previousButton: ButtonProps | undefined = previous === undefined
    ? undefined
    : {
      children: 'Retour',
      priority: 'secondary',
      iconId: 'fr-icon-arrow-left-line',
      linkProps: {to: previous, preventScrollReset: true},
    }

  const nextButton: ButtonProps | undefined = next === undefined
    ? undefined
    : {
      children: 'Continuer',
      iconId: 'fr-icon-arrow-right-line',
      iconPosition: 'right',
      ...(next === 'submit' ? {type: 'submit'} : {linkProps: {to: next, preventScrollReset: true}}),
    }

  const [first, ...others] = [previousButton, nextButton].filter(button => button !== undefined)

  if (!first) {
    return null
  }

  return (
    <ButtonsGroup
      className='fr-mt-6w'
      buttonsSize='large'
      inlineLayoutWhen='md and up'
      alignment={previous === undefined ? 'right' : 'between'}
      buttons={[first, ...others]}
    />
  )
}
