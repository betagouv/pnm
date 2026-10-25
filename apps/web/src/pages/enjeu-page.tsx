import type {Objectif} from '@pnm/shared'
import {Link, useParams} from 'react-router'
import {PlanText} from '../components/plan-text.tsx'
import {useParc} from '../parcs.ts'
import {
  actionPath,
  enjeuActions,
  enjeuHabitats,
  findEnjeu,
  habitatPath,
  objectifAnchor,
  sousObjectifAnchor,
  usePlanGestion,
} from '../plan-gestion.ts'

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('fr') + text.slice(1)
}

export function EnjeuPage() {
  const parc = useParc()!
  const plan = usePlanGestion()
  // The route answers 404 for an enjeu that the plan does not hold
  const enjeu = findEnjeu(plan, useParams().enjeuId)!
  const habitats = enjeuHabitats(plan, enjeu)
  const actions = enjeuActions(plan, enjeu)

  return (
    <>
      <title>{`${enjeu.libelle} - Plan de gestion - ${parc.nom} - Mon Parc Marin`}</title>
      <h1>{enjeu.libelle}</h1>
      {enjeu.formulation !== undefined && <p className='fr-text--lead'>{capitalize(enjeu.formulation)}</p>}
      {enjeu.synthese !== undefined && <PlanText text={enjeu.synthese} />}

      <h2 className='fr-mt-6w'>Objectifs à long terme</h2>
      {enjeu.objectifs.length === 0 && <p>Le plan de gestion ne détaille pas encore les objectifs de cet enjeu.</p>}
      {enjeu.objectifs.map(objectif => <ObjectifSection key={objectif.id} objectif={objectif} />)}

      {habitats.length > 0 && (
        <>
          <h2 className='fr-mt-6w'>Habitats concernés</h2>
          <ul>
            {habitats.map(habitat => (
              <li key={habitat.code}>
                <Link to={habitatPath(parc.id, habitat.code)}>{habitat.nom}</Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {actions.length > 0 && (
        <>
          <h2 className='fr-mt-6w'>Actions</h2>
          <ul>
            {actions.map(action => (
              <li key={action.id}>
                <Link to={actionPath(parc.id, action.id)}>{action.libelle}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

type ObjectifSectionProps = {
  readonly objectif: Objectif
}

// An objectif and its sous-objectifs, as a section of the page of its enjeu
function ObjectifSection({objectif}: ObjectifSectionProps) {
  return (
    <section id={objectifAnchor(objectif.id)} className='fr-mt-4w'>
      <h3 className='fr-h4'>{objectif.libelle}</h3>
      {objectif.sousObjectifs.length === 0
        ? <p className='fr-text--sm'>Ses sous-objectifs ne sont pas encore renseignés.</p>
        : (
          <ul className='fr-raw-list'>
            {objectif.sousObjectifs.map(sousObjectif => (
              <li key={sousObjectif.id} id={sousObjectifAnchor(sousObjectif.id)} className='fr-highlight fr-ml-0 fr-mb-3w'>
                <p className='fr-text--md fr-text--bold fr-mb-1w'>{sousObjectif.libelle}</p>
                {sousObjectif.niveauExigence !== undefined && (
                  <p className='fr-text--sm fr-mb-1w'>
                    <span className='fr-text--bold'>Niveau d'exigence :</span>
                    {` ${sousObjectif.niveauExigence}`}
                  </p>
                )}
                {sousObjectif.indicateurs.length > 0 && (
                  <p className='fr-text--sm fr-mb-0'>
                    <span className='fr-text--bold'>Indicateurs :</span>
                    {` ${sousObjectif.indicateurs.map(indicateur => `${indicateur.libelle.trim()} (${indicateur.code})`).join(', ')}`}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
    </section>
  )
}
