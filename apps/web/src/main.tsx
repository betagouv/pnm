import '@codegouvfr/react-dsfr/main.css'
import '@codegouvfr/react-dsfr/dsfr/utility/icons/icons.min.css'
import {startReactDsfr} from '@codegouvfr/react-dsfr/spa'
import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {Link} from 'react-router'
import {RouterProvider} from 'react-router/dom'
import {router} from './router.tsx'

startReactDsfr({defaultColorScheme: 'system', Link})

// DSFR components take React Router's link props (`to`) in their `linkProps`
declare module '@codegouvfr/react-dsfr/spa' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface RegisterLink {
    Link: typeof Link
  }
}

createRoot(document.querySelector('#root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
