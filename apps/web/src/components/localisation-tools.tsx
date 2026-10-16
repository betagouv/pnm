import type {ButtonProps} from '@codegouvfr/react-dsfr/Button'
import {ButtonsGroup} from '@codegouvfr/react-dsfr/ButtonsGroup'
import type {Element} from '@pnm/shared'
import {minPositions} from '../projet.ts'
import type {Draft} from './projet-map.tsx'

type LocalisationToolsProps = {
  readonly draft?: Draft
  readonly onStart: (type: Element['type']) => void
  readonly onUndo: () => void
  readonly onFinish: () => void
  readonly onCancel: () => void
}

// Fixed for each type, and true for a mouse as for a finger: the text above the map does not change
// while drawing, so the map does not move
const instructions: Record<Element['type'], string> = {
  lieux: 'Placez chaque lieu sur la carte, puis appuyez sur Terminer.',
  parcours: 'Placez le départ puis chaque point de passage sur la carte, et appuyez sur Terminer. Pour une boucle, finissez sur le premier point.',
  zone: 'Placez au moins trois angles de la zone sur la carte, puis finissez sur le premier point ou appuyez sur Terminer.',
}

// The instruction takes the place of the introduction, and the drawing buttons that of the add
// buttons: the map below does not move when drawing starts
export function LocalisationTools({
  draft,
  onStart,
  onUndo,
  onFinish,
  onCancel,
}: LocalisationToolsProps) {
  if (!draft) {
    return (
      <>
        <p>
          Ajoutez chaque élément de votre projet sur la carte : des lieux comme des mouillages, un
          parcours comme un circuit de course, ou une zone.
        </p>
        <ButtonsGroup
          inlineLayoutWhen='md and up'
          buttons={[
            {
              type: 'button',
              children: 'Ajouter des lieux',
              priority: 'secondary',
              iconId: 'fr-icon-map-pin-2-line',
              onClick() {
                onStart('lieux')
              },
            },
            {
              type: 'button',
              children: 'Ajouter un parcours',
              priority: 'secondary',
              iconId: 'ri-route-line',
              onClick() {
                onStart('parcours')
              },
            },
            {
              type: 'button',
              children: 'Ajouter une zone',
              priority: 'secondary',
              iconId: 'fr-icon-shape-line',
              onClick() {
                onStart('zone')
              },
            },
          ]}
        />
      </>
    )
  }

  // These buttons live in the step form: they must not send it
  // All the buttons stay from the first to the last point, disabled when they cannot serve: on
  // mobile they stack above the map, and a button appearing would move the map under the finger
  const finishButton: ButtonProps = {
    type: 'button',
    children: 'Terminer',
    iconId: 'fr-icon-check-line',
    disabled: draft.positions.length < minPositions[draft.type],
    onClick: onFinish,
  }
  const undoButton: ButtonProps = {
    type: 'button',
    children: 'Annuler le dernier point',
    priority: 'secondary',
    iconId: 'fr-icon-arrow-go-back-line',
    disabled: draft.positions.length === 0,
    onClick: onUndo,
  }
  const cancelButton: ButtonProps = {
    type: 'button',
    children: 'Abandonner',
    priority: 'tertiary',
    iconId: 'fr-icon-close-line',
    onClick: onCancel,
  }

  return (
    <>
      <p aria-live='polite' className='fr-text--bold'>{instructions[draft.type]}</p>
      <ButtonsGroup inlineLayoutWhen='md and up' buttons={[finishButton, undoButton, cancelButton]} />
    </>
  )
}
