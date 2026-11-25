import {PlanText} from './plan-text.tsx'

// What the plan de gestion requires to reach, set apart from the text around it
export function NiveauExigence({text}: {readonly text: string}) {
  return (
    <div className='fr-highlight fr-ml-0 fr-mt-3w'>
      <p className='fr-text--sm fr-text--bold fr-mb-1v'>Niveau d'exigence du plan de gestion</p>
      <PlanText text={text} />
    </div>
  )
}
