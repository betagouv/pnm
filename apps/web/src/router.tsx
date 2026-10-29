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
import {loadHabitatPage, loadHabitatsStep} from './habitats.ts'
import {ActionPage} from './pages/action-page.tsx'
import {EnjeuPage} from './pages/enjeu-page.tsx'
import {ErrorPage} from './pages/error-page.tsx'
import {HomePage} from './pages/home-page.tsx'
import {NotFoundPage} from './pages/not-found-page.tsx'
import {ParcHomePage} from './pages/parc-home-page.tsx'
import {PlanGestionLayout} from './pages/plan-gestion-layout.tsx'
import {PlanGestionPage} from './pages/plan-gestion-page.tsx'
import {PreparerProjetPage} from './pages/preparer-projet-page.tsx'
import {ProjetLayout} from './pages/projet-layout.tsx'
import {RecommandationsStepPage} from './pages/recommandations-step-page.tsx'
import {loadRecommandationsStep} from './recommandations.ts'
import {
  fetchParcs,
  fetchPerimetre,
  parcRouteId,
  parcsRouteId,
} from './parcs.ts'
import {
  loadAction,
  loadEnjeu,
  loadPlanGestion,
  planGestionRouteId,
} from './plan-gestion.ts'
import {loadActivites, projetRouteId, projetStepPath} from './projet.ts'

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
              {index: true, Component: ParcHomePage},
              {
                id: projetRouteId,
                path: 'preparer-mon-projet',
                loader: loadActivites,
                Component: ProjetLayout,
                children: [
                  {index: true, loader: ({params}) => redirect(projetStepPath(params.parcId!, 'activite'))},
                  {path: 'activite', Component: ActiviteStepPage},
                  {
                    path: 'localisation',
                    loader: async ({params}) => fetchPerimetre(params.parcId!),
                    // MapLibre is heavy: only the pages with a map load it
                    lazy: {
                      async Component() {
                        const {LocalisationStepPage} = await import('./pages/localisation-step-page.tsx')
                        return LocalisationStepPage
                      },
                    },
                  },
                  {
                    path: 'habitats',
                    loader: loadHabitatsStep,
                    lazy: {
                      async Component() {
                        const {HabitatsStepPage} = await import('./pages/habitats-step-page.tsx')
                        return HabitatsStepPage
                      },
                    },
                  },
                  {path: 'recommandations', loader: loadRecommandationsStep, Component: RecommandationsStepPage},
                ],
              },
              {
                id: planGestionRouteId,
                path: 'plan-de-gestion',
                loader: loadPlanGestion,
                Component: PlanGestionLayout,
                children: [
                  {index: true, Component: PlanGestionPage},
                  {path: 'enjeux/:enjeuId', loader: loadEnjeu, Component: EnjeuPage},
                  {path: 'actions/:actionId', loader: loadAction, Component: ActionPage},
                  {
                    path: 'habitats/:code',
                    loader: loadHabitatPage,
                    // MapLibre is heavy: only the pages with a map load it
                    lazy: {
                      async Component() {
                        const {HabitatPage} = await import('./pages/habitat-page.tsx')
                        return HabitatPage
                      },
                    },
                  },
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
