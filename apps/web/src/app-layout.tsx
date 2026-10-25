import type {MainNavigationProps} from '@codegouvfr/react-dsfr/MainNavigation'
import {
  Outlet,
  ScrollRestoration,
  useLocation,
  useMatch,
} from 'react-router'
import {PageLayout} from './components/page-layout.tsx'
import {
  parcPath,
  preparerProjetPath,
  useParc,
  useParcs,
} from './parcs.ts'

export function AppLayout() {
  const parcs = useParcs()
  const parc = useParc()
  const {pathname} = useLocation()
  // Switching parc keeps the current section, e.g. "preparer-mon-projet"
  const section = useMatch('/parcs/:parcId/:section/*')?.params.section

  const navigation: MainNavigationProps.Item[] = [
    {
      text: 'Accueil',
      linkProps: {to: '/'},
      isActive: pathname === '/',
    },
    {
      text: parc?.nom ?? 'Choisir un parc',
      menuLinks: [
        ...parcs
          .filter(candidate => candidate.disponible)
          .map(candidate => ({
            text: candidate.nom,
            linkProps: {to: parcPath(candidate.id, section)},
            isActive: candidate.id === parc?.id,
          })),
        {text: 'Tous les parcs', linkProps: {to: preparerProjetPath}},
      ],
    },
    {
      text: 'Préparer mon projet',
      linkProps: {to: parc ? parcPath(parc.id) : preparerProjetPath},
      isActive: pathname === preparerProjetPath || section === 'preparer-mon-projet',
    },
    // The plan de gestion of the parc in view, once the parc is open
    ...(parc?.disponible
      ? [{
        text: 'Plan de gestion',
        linkProps: {to: parcPath(parc.id, 'plan-de-gestion')},
        isActive: section === 'plan-de-gestion',
      }]
      : []),
  ]

  return (
    <PageLayout navigation={navigation}>
      <Outlet />
      {/* Every first page of a tab has the key "default": the path tells them apart */}
      <ScrollRestoration
        getKey={location => location.key === 'default' ? location.pathname : location.key}
      />
    </PageLayout>
  )
}
