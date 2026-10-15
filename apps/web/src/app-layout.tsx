import type {MainNavigationProps} from '@codegouvfr/react-dsfr/MainNavigation'
import {Outlet, useLocation, useMatch} from 'react-router'
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
  ]

  return (
    <PageLayout navigation={navigation}>
      <Outlet />
    </PageLayout>
  )
}
