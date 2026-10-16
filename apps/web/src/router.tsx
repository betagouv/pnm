import type {Parc} from '@pnm/shared'
import {
  createBrowserRouter,
  data,
  isRouteErrorResponse,
  redirect,
  useRouteError,
  type LoaderFunctionArgs,
} from 'react-router'
import {AppLayout} from './app-layout.tsx'
import {PageLayout} from './components/page-layout.tsx'
import {ActiviteStepPage} from './pages/activite-step-page.tsx'
import {ErrorPage} from './pages/error-page.tsx'
import {HomePage} from './pages/home-page.tsx'
import {LocalisationStepPage} from './pages/localisation-step-page.tsx'
import {MesuresStepPage} from './pages/mesures-step-page.tsx'
import {NotFoundPage} from './pages/not-found-page.tsx'
import {PreparerProjetPage} from './pages/preparer-projet-page.tsx'
import {ProjetLayout} from './pages/projet-layout.tsx'
import {
  fetchParcs,
  parcPath,
  parcRouteId,
  parcsRouteId,
} from './parcs.ts'
import {fetchActivites, projetRouteId, projetStepPath} from './projet.ts'

async function loadParc({params}: LoaderFunctionArgs): Promise<Parc> {
  const parcs = await fetchParcs()
  const parc = parcs.find(candidate => candidate.id === params.parcId)

  if (!parc) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw data(null, {status: 404})
  }

  return parc
}

// Shown while the parcs load, and when they cannot: the layout needs them for its navigation
function EmptyLayout() {
  return <PageLayout navigation={[]} />
}

function RootErrorBoundary() {
  return (
    <PageLayout navigation={[]}>
      <ErrorPage />
    </PageLayout>
  )
}

function PageErrorBoundary() {
  const error = useRouteError()
  return isRouteErrorResponse(error) && error.status === 404 ? <NotFoundPage /> : <ErrorPage />
}

export const router = createBrowserRouter([
  {
    id: parcsRouteId,
    path: '/',
    loader: fetchParcs,
    Component: AppLayout,
    HydrateFallback: EmptyLayout,
    ErrorBoundary: RootErrorBoundary,
    children: [
      {
        ErrorBoundary: PageErrorBoundary,
        children: [
          {index: true, Component: HomePage},
          {path: 'preparer-mon-projet', Component: PreparerProjetPage},
          {
            id: parcRouteId,
            path: 'parcs/:parcId',
            loader: loadParc,
            children: [
              {index: true, loader: ({params}) => redirect(parcPath(params.parcId!))},
              {
                id: projetRouteId,
                path: 'preparer-mon-projet',
                loader: fetchActivites,
                Component: ProjetLayout,
                children: [
                  {index: true, loader: ({params}) => redirect(projetStepPath(params.parcId!, 'activite'))},
                  {path: 'activite', Component: ActiviteStepPage},
                  {path: 'localisation', Component: LocalisationStepPage},
                  {path: 'mesures', Component: MesuresStepPage},
                ],
              },
            ],
          },
          {path: '*', Component: NotFoundPage},
        ],
      },
    ],
  },
])
