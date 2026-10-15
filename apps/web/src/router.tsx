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
import {ErrorPage} from './pages/error-page.tsx'
import {HomePage} from './pages/home-page.tsx'
import {NotFoundPage} from './pages/not-found-page.tsx'
import {ParcPreparerProjetPage} from './pages/parc-preparer-projet-page.tsx'
import {PreparerProjetPage} from './pages/preparer-projet-page.tsx'
import {
  fetchParcs,
  parcPath,
  parcRouteId,
  parcsRouteId,
} from './parcs.ts'

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
              {path: 'preparer-mon-projet', Component: ParcPreparerProjetPage},
            ],
          },
          {path: '*', Component: NotFoundPage},
        ],
      },
    ],
  },
])
