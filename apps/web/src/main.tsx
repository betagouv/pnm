import '@codegouvfr/react-dsfr/main.css'
import '@codegouvfr/react-dsfr/dsfr/utility/icons/icons.min.css'
import {startReactDsfr} from '@codegouvfr/react-dsfr/spa'
import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {App} from './app.tsx'

startReactDsfr({defaultColorScheme: 'system'})

createRoot(document.querySelector('#root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
