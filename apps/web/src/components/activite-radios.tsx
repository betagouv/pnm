import {RadioButtons} from '@codegouvfr/react-dsfr/RadioButtons'
import type {Activite} from '@pnm/shared'
import type {ReactNode} from 'react'
import {pictogramUrl} from '../pictograms.ts'
import {Pictogram} from './pictogram.tsx'

type ActiviteRadiosProps = {
  readonly activites: readonly Activite[]
  readonly legend: ReactNode
  readonly name: string
  readonly defaultValue?: string
  readonly errorMessage?: string
  readonly onChange?: () => void
}

export function ActiviteRadios({
  activites,
  legend,
  name,
  defaultValue,
  errorMessage,
  onChange,
}: ActiviteRadiosProps) {
  return (
    <RadioButtons
      legend={legend}
      name={name}
      state={errorMessage === undefined ? 'default' : 'error'}
      stateRelatedMessage={errorMessage}
      options={activites.map(activite => {
        const url = pictogramUrl(activite.pictogramme)
        return {
          label: activite.nom,
          hintText: activite.description,
          // An unknown pictogram leaves its space empty rather than breaking the step
          illustration: url === undefined ? undefined : <Pictogram url={url} />,
          nativeInputProps: {
            value: activite.id,
            defaultChecked: activite.id === defaultValue,
            onChange,
          },
        }
      })}
    />
  )
}
