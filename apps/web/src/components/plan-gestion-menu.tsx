import {SideMenu, type SideMenuProps} from '@codegouvfr/react-dsfr/SideMenu'
import type {PlanGestion} from '@pnm/shared'

// What the page shows, to mark it in the menu
export type PlanGestionPage =
  | {readonly type: 'presentation'}
  | {readonly type: 'enjeu', readonly id: number}
  | {readonly type: 'habitat', readonly code: string}
  | {readonly type: 'action', readonly id: number}

type PlanGestionMenuProps = {
  readonly plan: PlanGestion
  readonly current: PlanGestionPage
  readonly presentationPath: string
  readonly enjeuPath: (id: number) => string
  readonly habitatPath: (code: string) => string
  readonly actionPath: (id: number) => string
}

// The pages of the plan de gestion: its enjeux, its habitats and its actions. The objectifs are
// sections of the page of their enjeu
export function PlanGestionMenu({
  plan,
  current,
  presentationPath,
  enjeuPath,
  habitatPath,
  actionPath,
}: PlanGestionMenuProps) {
  const items: SideMenuProps.Item[] = [
    {
      text: 'Présentation',
      linkProps: {to: presentationPath},
      isActive: current.type === 'presentation',
    },
    {
      text: 'Enjeux',
      expandedByDefault: current.type === 'enjeu',
      isActive: current.type === 'enjeu',
      items: plan.enjeux.map(enjeu => ({
        text: enjeu.libelle,
        linkProps: {to: enjeuPath(enjeu.id)},
        isActive: current.type === 'enjeu' && current.id === enjeu.id,
      })),
    },
    {
      text: 'Habitats',
      expandedByDefault: current.type === 'habitat',
      isActive: current.type === 'habitat',
      items: plan.habitats.map(habitat => ({
        text: habitat.nom,
        linkProps: {to: habitatPath(habitat.code)},
        isActive: current.type === 'habitat' && current.code === habitat.code,
      })),
    },
    {
      text: 'Actions',
      expandedByDefault: current.type === 'action',
      isActive: current.type === 'action',
      items: plan.actions.map(action => ({
        text: action.libelle,
        linkProps: {to: actionPath(action.id)},
        isActive: current.type === 'action' && current.id === action.id,
      })),
    },
  ]

  return <SideMenu title='Plan de gestion' burgerMenuButtonText='Dans le plan de gestion' items={items} />
}
