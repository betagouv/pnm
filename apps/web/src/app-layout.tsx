import type {MainNavigationProps} from '@codegouvfr/react-dsfr/MainNavigation'
import {
  Outlet,
  ScrollRestoration,
  useLocation,
  useMatch,
} from 'react-router'
import {PageLayout} from './components/page-layout.tsx'
import {
  parcHomePath,
  parcPath,
  preparerProjetPath,
  useParc,
  useParcs,
} from './parcs.ts'
import {enjeuxPath, enjeuxSection} from './plan-gestion.ts'

export function AppLayout() {
  const parcs = useParcs()
  const parc = useParc()
  const {pathname} = useLocation()
  // Switching parc keeps the current section, e.g. "preparer-mon-projet"
  const section = useMatch('/parcs/:parcId/:section/*')?.params.section

  const navigation: MainNavigationProps.Item[] = [
    // The home page of the parc in view, if any
    {
      text: 'Accueil',
      linkProps: {to: parc ? parcHomePath(parc.id) : '/'},
      isActive: pathname === '/' || (parc !== undefined && section === undefined),
    },
    {
      text: parc?.nom ?? 'Choisir un parc',
      menuLinks: [
        ...parcs
          .filter(candidate => candidate.disponible)
          .map(candidate => ({
            text: candidate.nom,
            linkProps: {to: section === undefined ? parcHomePath(candidate.id) : parcPath(candidate.id, section)},
            isActive: candidate.id === parc?.id,
          })),
        {text: 'Tous les parcs', linkProps: {to: preparerProjetPath}},
      ],
    },
    // The enjeux of the parc in view, once the parc is open
    ...(parc?.disponible
      ? [{
        text: 'Explorer les enjeux',
        linkProps: {to: enjeuxPath(parc.id)},
        isActive: section === enjeuxSection,
      }]
      : []),
    {
      text: 'Préparer mon projet',
      linkProps: {to: parc ? parcPath(parc.id) : preparerProjetPath},
      isActive: pathname === preparerProjetPath || section === 'preparer-mon-projet',
    },
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
