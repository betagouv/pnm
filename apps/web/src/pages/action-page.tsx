import {Link, useParams} from 'react-router'
import {PlanText} from '../components/plan-text.tsx'
import {useParc} from '../parcs.ts'
import {
  enjeuPath,
  findAction,
  findObjectif,
  findSousObjectif,
  objectifAnchor,
  sousObjectifAnchor,
  usePlanGestion,
} from '../plan-gestion.ts'

export function ActionPage() {
  const parc = useParc()!
  const plan = usePlanGestion()
  // The route answers 404 for an action that the plan does not hold
  const action = findAction(plan, useParams().actionId)!
  const details = [
    ['Période', action.periode],
    ['Porteur', action.porteur],
    ['Opérateur technique', action.operateurTechnique],
    ['Acteur opérationnel', action.acteurOperationnel],
    ['Financement', action.financement],
  ].flatMap(([label, value]) => value === undefined ? [] : [{label: label!, value}])
  const enjeux = plan.enjeux.filter(enjeu => action.enjeux.includes(enjeu.id))
  const objectifs = action.objectifs.flatMap(id => findObjectif(plan, id) ?? [])
  const sousObjectifs = action.sousObjectifs.flatMap(id => findSousObjectif(plan, id) ?? [])

  return (
    <>
      <title>{`${action.libelle} - Plan de gestion - ${parc.nom} - Mon Parc Marin`}</title>
      <h1>{action.libelle}</h1>
      {action.synthese === undefined
        ? <p>Le plan de gestion ne décrit pas encore cette action.</p>
        : <PlanText text={action.synthese} />}

      {details.length > 0 && (
        <ul className='fr-raw-list fr-mt-4w'>
          {details.map(({label, value}) => (
            <li key={label} className='fr-mb-1w'>
              <span className='fr-text--bold'>{`${label} :`}</span>
              {` ${value}`}
            </li>
          ))}
        </ul>
      )}

      {(enjeux.length > 0 || objectifs.length > 0 || sousObjectifs.length > 0) && (
        <>
          <h2 className='fr-mt-6w'>Dans le plan de gestion</h2>
          <ul>
            {enjeux.map(enjeu => (
              <li key={`enjeu-${enjeu.id}`}>
                {'Enjeu : '}
                <Link to={enjeuPath(parc.id, enjeu.id)}>{enjeu.libelle}</Link>
              </li>
            ))}
            {objectifs.map(({enjeu, objectif}) => (
              <li key={`objectif-${objectif.id}`}>
                {'Objectif à long terme : '}
                <Link to={`${enjeuPath(parc.id, enjeu.id)}#${objectifAnchor(objectif.id)}`}>{objectif.libelle}</Link>
              </li>
            ))}
            {sousObjectifs.map(({enjeu, sousObjectif}) => (
              <li key={`sous-objectif-${sousObjectif.id}`}>
                {'Sous-objectif : '}
                <Link to={`${enjeuPath(parc.id, enjeu.id)}#${sousObjectifAnchor(sousObjectif.id)}`}>{sousObjectif.libelle}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
