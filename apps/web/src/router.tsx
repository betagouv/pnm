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
import {loadEnjeuPage, loadHabitatPage, loadHabitatsStep} from './habitats.ts'
import {ActionPage} from './pages/action-page.tsx'
import {EnjeuxLayout} from './pages/enjeux-layout.tsx'
import {ErrorPage} from './pages/error-page.tsx'
import {EspecePage} from './pages/espece-page.tsx'
import {HomePage} from './pages/home-page.tsx'
import {NotFoundPage} from './pages/not-found-page.tsx'
import {ParcHomePage} from './pages/parc-home-page.tsx'
import {PreparerProjetPage} from './pages/preparer-projet-page.tsx'
import {ProjetLayout} from './pages/projet-layout.tsx'
import {RecommandationsStepPage} from './pages/recommandations-step-page.tsx'
import {SousObjectifPage} from './pages/sous-objectif-page.tsx'
import {loadRecommandationsStep} from './recommandations.ts'
import {
  fetchParcs,
  fetchPerimetre,
  parcRouteId,
  parcsRouteId,
} from './parcs.ts'
import {
  enjeuxSection,
  loadAction,
  loadEnjeux,
  loadEspece,
  loadPlanGestion,
  loadSousObjectif,
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
                    path: 'enjeux',
                    loader: loadHabitatsStep,
                    lazy: {
                      async Component() {
                        const {EnjeuxStepPage} = await import('./pages/enjeux-step-page.tsx')
                        return EnjeuxStepPage
                      },
                    },
                  },
                  {path: 'recommandations', loader: loadRecommandationsStep, Component: RecommandationsStepPage},
                ],
              },
              {
                id: planGestionRouteId,
                path: enjeuxSection,
                loader: loadPlanGestion,
                Component: EnjeuxLayout,
                children: [
                  {index: true, loader: loadEnjeux},
                  {
                    path: ':enjeuId',
                    loader: loadEnjeuPage,
                    // MapLibre is heavy: the page loads it only for an enjeu with a map
                    lazy: {
                      async Component() {
                        const {EnjeuPage} = await import('./pages/enjeu-page.tsx')
                        return EnjeuPage
                      },
                    },
                  },
                  {path: 'sous-objectifs/:sousObjectifId', loader: loadSousObjectif, Component: SousObjectifPage},
                  {path: 'actions/:actionId', loader: loadAction, Component: ActionPage},
                  {path: 'especes/:especeId', loader: loadEspece, Component: EspecePage},
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
