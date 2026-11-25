import {Button} from '@codegouvfr/react-dsfr/Button'
import {Link, useParams} from 'react-router'
import {ImagePlaceholder} from '../components/image-placeholder.tsx'
import {IndicateurCards} from '../components/indicateur-cards.tsx'
import {NiveauExigence} from '../components/niveau-exigence.tsx'
import {PlanText} from '../components/plan-text.tsx'
import {TagLinks} from '../components/tag-links.tsx'
import {useParc} from '../parcs.ts'
import {
  enjeuPath,
  especePath,
  findSousObjectif,
  habitatPath,
  objectifAnchor,
  sousObjectifEspeces,
  sousObjectifHabitats,
  usePlanGestion,
} from '../plan-gestion.ts'

// A sous-objectif of the plan de gestion: what it aims at, and where it stands
export function SousObjectifPage() {
  const parc = useParc()!
  const plan = usePlanGestion()
  // The route answers 404 for a sous-objectif that the plan does not hold
  const {enjeu, objectif, sousObjectif} = findSousObjectif(plan, useParams().sousObjectifId)!
  const habitats = sousObjectifHabitats(plan, sousObjectif).map(habitat => ({
    id: habitat.code,
    label: habitat.nom,
    to: habitatPath(parc.id, habitat.code),
  }))
  const especes = sousObjectifEspeces(plan, sousObjectif).map(espece => ({
    id: espece.id,
    label: espece.nom,
    to: especePath(parc.id, espece.id),
  }))

  return (
    <>
      <title>{`${sousObjectif.libelle} - ${enjeu.libelle} - ${parc.nom} - Mon Parc Marin`}</title>
      <Button
        className='fr-mb-4w'
        priority='secondary'
        iconId='fr-icon-arrow-left-line'
        linkProps={{to: enjeuPath(parc.id, enjeu.id)}}
      >
        Retour aux enjeux
      </Button>
      <h1>{sousObjectif.libelle}</h1>
      <p className='fr-text--sm'>
        {'Objectif à long terme : '}
        <Link to={`${enjeuPath(parc.id, enjeu.id)}#${objectifAnchor(objectif.id)}`}>{objectif.libelle}</Link>
      </p>

      <div className='fr-grid-row fr-grid-row--gutters fr-mt-2w'>
        <div className='fr-col-12 fr-col-md-6'>
          {sousObjectif.synthese === undefined
            ? <p>Le plan de gestion ne présente pas encore ce sous-objectif.</p>
            : <PlanText text={sousObjectif.synthese} />}
          {sousObjectif.niveauExigence !== undefined && <NiveauExigence text={sousObjectif.niveauExigence} />}
        </div>
        <div className='fr-col-12 fr-col-md-6'>
          <ImagePlaceholder />
        </div>
      </div>

      <p className='fr-text--sm fr-mt-6w fr-mb-1v'>Indicateurs</p>
      <h2>Où en est-on ?</h2>
      {sousObjectif.indicateurs.length === 0
        ? <p>Le plan de gestion ne donne pas encore d'indicateur pour ce sous-objectif.</p>
        : <IndicateurCards indicateurs={sousObjectif.indicateurs} titleAs='h3' />}

      {habitats.length > 0 && (
        <>
          <h2 className='fr-mt-6w'>Habitats concernés</h2>
          <TagLinks links={habitats} />
        </>
      )}

      {especes.length > 0 && (
        <>
          <h2 className='fr-mt-6w'>Espèces concernées</h2>
          <TagLinks links={especes} />
        </>
      )}
    </>
  )
}
