import {Accordion} from '@codegouvfr/react-dsfr/Accordion'
import type {Objectif} from '@pnm/shared'
import {Link, type To} from 'react-router'
import {NiveauExigence} from './niveau-exigence.tsx'
import {PlanText} from './plan-text.tsx'

type ObjectifListProps = {
  readonly objectifs: readonly Objectif[]
  readonly objectifAnchor: (objectifId: number) => string
  readonly sousObjectifPath: (sousObjectifId: number) => To
}

function Presentation({objectif}: {readonly objectif: Objectif}) {
  return (
    <>
      {objectif.synthese !== undefined && <PlanText text={objectif.synthese} />}
      {objectif.niveauExigence !== undefined && <NiveauExigence text={objectif.niveauExigence} />}
    </>
  )
}

// The objectifs of an enjeu, each with the links to its sous-objectifs. An objectif that the plan
// does not divide shows its presentation; the others keep it folded, above their sous-objectifs
export function ObjectifList({objectifs, objectifAnchor, sousObjectifPath}: ObjectifListProps) {
  if (objectifs.length === 0) {
    return <p className='fr-mb-0'>Le plan de gestion ne détaille pas encore les objectifs de cet enjeu.</p>
  }

  return objectifs.map(objectif => {
    const hasPresentation = objectif.synthese !== undefined || objectif.niveauExigence !== undefined

    return (
      <section key={objectif.id} id={objectifAnchor(objectif.id)} className='fr-mb-3w'>
        <h4 className='fr-h6 fr-mb-1w'>{objectif.libelle}</h4>
        {objectif.sousObjectifs.length === 0
          ? (hasPresentation
            ? <Presentation objectif={objectif} />
            : <p className='fr-text--sm fr-mb-0'>Le plan de gestion ne détaille pas encore cet objectif.</p>)
          : (
            <>
              {hasPresentation && (
                <Accordion className='fr-mb-2w' label='Présentation de l’objectif' titleAs='h5'>
                  <Presentation objectif={objectif} />
                </Accordion>
              )}
              <ul className='fr-raw-list'>
                {objectif.sousObjectifs.map(sousObjectif => (
                  <li key={sousObjectif.id} className='fr-mb-1w'>
                    <Link className='fr-link' to={sousObjectifPath(sousObjectif.id)}>{sousObjectif.libelle}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
      </section>
    )
  })
}
