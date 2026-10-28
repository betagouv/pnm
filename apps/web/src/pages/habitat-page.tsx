import {CallOut} from '@codegouvfr/react-dsfr/CallOut'
import {Link, useLoaderData, useParams} from 'react-router'
import {HabitatMap} from '../components/habitat-map.tsx'
import {PlanText} from '../components/plan-text.tsx'
import {RecommandationCards} from '../components/recommandation-cards.tsx'
import type {HabitatPageData} from '../habitats.ts'
import {useParc} from '../parcs.ts'
import {
  enjeuPath,
  findHabitat,
  findSousObjectif,
  sousObjectifAnchor,
  usePlanGestion,
} from '../plan-gestion.ts'

// A habitat of the plan de gestion, apart from any projet
export function HabitatPage() {
  const parc = useParc()!
  const plan = usePlanGestion()
  const {perimetre, tilesUrl, isMapped} = useLoaderData<HabitatPageData>()
  // The route answers 404 for a habitat that the plan does not hold
  const habitat = findHabitat(plan, useParams().code)!
  const place = habitat.sousObjectif === undefined ? undefined : findSousObjectif(plan, habitat.sousObjectif)
  const recommandations = plan.recommandations.filter(recommandation => recommandation.habitats.includes(habitat.code))
  const activiteNoms = new Map(plan.activites.map(activite => [activite.id, activite.nom]))
  // A recommandation meant for activités says which ones
  const details = new Map(recommandations.flatMap(recommandation => {
    const noms = recommandation.activites.flatMap(id => activiteNoms.get(id) ?? [])
    return noms.length === 0 ? [] : [[recommandation.id, `Pour : ${noms.join(', ')}`] as const]
  }))

  return (
    <>
      <title>{`${habitat.nom} - Plan de gestion - ${parc.nom} - Mon Parc Marin`}</title>
      <h1>{habitat.nom}</h1>
      {habitat.synthese === undefined
        ? <p>Le plan de gestion ne présente pas encore cet habitat.</p>
        : <PlanText text={habitat.synthese} />}

      {place && (
        <CallOut title='Dans le plan de gestion' titleAs='h2'>
          {`Objectif à long terme : ${place.objectif.libelle}. Sous-objectif : ${place.sousObjectif.libelle}.`}
          <br />
          <Link to={`${enjeuPath(parc.id, place.enjeu.id)}#${sousObjectifAnchor(place.sousObjectif.id)}`}>
            {`Voir l'enjeu « ${place.enjeu.libelle} »`}
          </Link>
        </CallOut>
      )}

      <p className='fr-text--sm fr-mb-1w'>
        <span className='fr-text--bold'>Code habitat élémentaire :</span>
        {` ${habitat.code}`}
      </p>
      {habitat.habitatGenerique && (
        <p className='fr-text--sm'>
          <span className='fr-text--bold'>Habitat générique :</span>
          {` ${habitat.habitatGenerique.code}, ${habitat.habitatGenerique.nom}`}
        </p>
      )}

      {recommandations.length > 0 && (
        <>
          <h2 className='fr-mt-6w'>Recommandations</h2>
          <RecommandationCards recommandations={recommandations} enjeux={plan.enjeux} details={details} titleAs='h3' />
        </>
      )}

      <h2 className='fr-mt-6w'>L'habitat dans le parc</h2>
      {isMapped
        ? (
          <>
            <HabitatMap habitat={habitat} tilesUrl={tilesUrl} perimetre={perimetre} />
            <p className='fr-text--xs fr-mt-1w fr-mb-0'>
              Les contours de l'habitat sont élargis et simplifiés : ils montrent où il se trouve, pas
              sa limite exacte. Source : cartographies des habitats de l'OFB.
            </p>
          </>
        )
        : <p>Mon Parc Marin n'a pas encore de cartographie de cet habitat.</p>}
    </>
  )
}
