import {useParams} from 'react-router'
import {PlanText} from '../components/plan-text.tsx'
import {SousObjectifCallOut} from '../components/sous-objectif-call-out.tsx'
import {useParc} from '../parcs.ts'
import {
  findEspece,
  findSousObjectif,
  sousObjectifPath,
  usePlanGestion,
} from '../plan-gestion.ts'

// An espèce that the plan de gestion follows
export function EspecePage() {
  const parc = useParc()!
  const plan = usePlanGestion()
  // The route answers 404 for an espèce that the plan does not hold
  const espece = findEspece(plan, useParams().especeId)!
  const place = espece.sousObjectif === undefined ? undefined : findSousObjectif(plan, espece.sousObjectif)

  return (
    <>
      <title>{`${espece.nom} - Explorer les enjeux - ${parc.nom} - Mon Parc Marin`}</title>
      <h1 className={espece.nomScientifique === undefined ? undefined : 'fr-mb-1w'}>{espece.nom}</h1>
      {espece.nomScientifique !== undefined && (
        // A scientific name is written in italics
        <p className='fr-text--lead'><i lang='la'>{espece.nomScientifique}</i></p>
      )}
      {espece.synthese === undefined
        ? <p>Le plan de gestion ne présente pas encore cette espèce.</p>
        : <PlanText text={espece.synthese} />}

      {place && (
        <SousObjectifCallOut
          enjeu={place.enjeu.libelle}
          objectif={place.objectif.libelle}
          sousObjectif={place.sousObjectif.libelle}
          to={sousObjectifPath(parc.id, place.sousObjectif.id)}
        />
      )}
    </>
  )
}
