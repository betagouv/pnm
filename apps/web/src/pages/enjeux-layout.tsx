import {fr} from '@codegouvfr/react-dsfr'
import {Breadcrumb} from '@codegouvfr/react-dsfr/Breadcrumb'
import {Outlet, useParams} from 'react-router'
import {parcHomePath, useParc} from '../parcs.ts'
import {
  enjeuPath,
  enjeuxPath,
  findAction,
  findEspece,
  findHabitat,
  findSousObjectif,
  sousObjectifEnjeu,
  usePlanGestion,
} from '../plan-gestion.ts'

// The pages that explore the enjeux of a parc share their place in the site
export function EnjeuxLayout() {
  const parc = useParc()!
  const plan = usePlanGestion()
  const {sousObjectifId, actionId, code, especeId} = useParams()
  const place = sousObjectifId === undefined ? undefined : findSousObjectif(plan, sousObjectifId)
  const action = findAction(plan, actionId)
  const habitat = findHabitat(plan, code)
  const espece = findEspece(plan, especeId)
  // A page of detail sits under the enjeu it belongs to: an action under the first one it serves
  const enjeu = place?.enjeu
    ?? (action && plan.enjeux.find(candidate => action.enjeux.includes(candidate.id)))
    ?? sousObjectifEnjeu(plan, habitat ?? espece ?? {})
  const pageLabel = place?.sousObjectif.libelle ?? action?.libelle ?? habitat?.nom ?? espece?.nom
  const isExplorer = pageLabel === undefined

  return (
    // The enjeux stand out as white boxes on a tinted page
    <div style={isExplorer ? {backgroundColor: fr.colors.decisions.background.alt.blueFrance.default} : undefined}>
      <div className='fr-container fr-pb-6w'>
        <Breadcrumb
          className='fr-mt-0 fr-pt-3v'
          homeLinkProps={{to: '/'}}
          segments={[
            {label: parc.nom, linkProps: {to: parcHomePath(parc.id)}},
            ...(isExplorer
              ? []
              : [
                {label: 'Explorer les enjeux', linkProps: {to: enjeuxPath(parc.id)}},
                ...(enjeu ? [{label: enjeu.libelle, linkProps: {to: enjeuPath(parc.id, enjeu.id)}}] : []),
              ]),
          ]}
          currentPageLabel={pageLabel ?? 'Explorer les enjeux'}
        />
        <p className='fr-text--sm fr-text--bold fr-mb-1w'>
          <span className='fr-icon-map-pin-2-line fr-icon--sm fr-mr-1v' aria-hidden='true' />
          {parc.nomComplet}
        </p>
        <Outlet />
      </div>
    </div>
  )
}
