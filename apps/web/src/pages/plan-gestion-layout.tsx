import {Breadcrumb} from '@codegouvfr/react-dsfr/Breadcrumb'
import {Outlet, useParams} from 'react-router'
import {type PlanGestionPage, PlanGestionMenu} from '../components/plan-gestion-menu.tsx'
import {parcPath, useParc} from '../parcs.ts'
import {
  actionPath,
  enjeuPath,
  findAction,
  findEnjeu,
  findHabitat,
  habitatPath,
  planGestionPath,
  usePlanGestion,
} from '../plan-gestion.ts'

// The pages of the plan de gestion of a parc share its menu and their place in the site
export function PlanGestionLayout() {
  const parc = useParc()!
  const plan = usePlanGestion()
  const {enjeuId, actionId, code} = useParams()
  const enjeu = findEnjeu(plan, enjeuId)
  const action = findAction(plan, actionId)
  const habitat = findHabitat(plan, code)
  let current: PlanGestionPage = {type: 'presentation'}

  if (enjeu) {
    current = {type: 'enjeu', id: enjeu.id}
  } else if (action) {
    current = {type: 'action', id: action.id}
  } else if (habitat) {
    current = {type: 'habitat', code: habitat.code}
  }

  const pageLabel = enjeu?.libelle ?? action?.libelle ?? habitat?.nom
  const presentationPath = planGestionPath(parc.id)

  return (
    <div className='fr-container fr-pb-6w'>
      <Breadcrumb
        homeLinkProps={{to: '/'}}
        segments={[
          {label: parc.nom, linkProps: {to: parcPath(parc.id)}},
          ...(pageLabel === undefined ? [] : [{label: 'Plan de gestion', linkProps: {to: presentationPath}}]),
        ]}
        currentPageLabel={pageLabel ?? 'Plan de gestion'}
      />
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-md-4 fr-col-lg-3'>
          <PlanGestionMenu
            plan={plan}
            current={current}
            presentationPath={presentationPath}
            enjeuPath={id => enjeuPath(parc.id, id)}
            habitatPath={habitatCode => habitatPath(parc.id, habitatCode)}
            actionPath={id => actionPath(parc.id, id)}
          />
        </div>
        <div className='fr-col-12 fr-col-md-8 fr-col-lg-9'>
          <p className='fr-text--sm fr-text--bold fr-mb-1w'>
            <span className='fr-icon-map-pin-2-line fr-icon--sm fr-mr-1v' aria-hidden='true' />
            {parc.nomComplet}
          </p>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
