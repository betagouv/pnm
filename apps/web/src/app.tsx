import {headerFooterDisplayItem} from '@codegouvfr/react-dsfr/Display'
import {Footer} from '@codegouvfr/react-dsfr/Footer'
import {Header} from '@codegouvfr/react-dsfr/Header'
import {SkipLinks} from '@codegouvfr/react-dsfr/SkipLinks'
import {HomePage} from './pages/home-page.tsx'

const brandTop = (
  <>
    République
    <br />
    Française
  </>
)

const homeLinkProps = {href: '/', title: 'Accueil - Mon Parc Marin'}

export function App() {
  return (
    <>
      <SkipLinks
        links={[
          {label: 'Contenu', anchor: '#contenu'},
          {label: 'Pied de page', anchor: '#footer'},
        ]}
      />
      <Header
        brandTop={brandTop}
        homeLinkProps={homeLinkProps}
        serviceTitle='Mon Parc Marin'
        serviceTagline='Votre projet dans un parc naturel marin'
      />
      <main id='contenu' tabIndex={-1}>
        <HomePage />
      </main>
      <Footer
        id='footer'
        accessibility='non compliant'
        contentDescription={'Mon Parc Marin informe les porteurs de projet au regard des parcs naturels marins. Service proposé par l\'Office français de la biodiversité.'}
        bottomItems={[headerFooterDisplayItem]}
      />
    </>
  )
}
