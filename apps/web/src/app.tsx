import {headerFooterDisplayItem} from '@codegouvfr/react-dsfr/Display'
import {Footer} from '@codegouvfr/react-dsfr/Footer'
import {Header} from '@codegouvfr/react-dsfr/Header'
import {SkipLinks} from '@codegouvfr/react-dsfr/SkipLinks'
import {useIsDark} from '@codegouvfr/react-dsfr/useIsDark'
import logoOfbDark from './assets/logo-ofb-dark.svg'
import logoOfb from './assets/logo-ofb.svg'
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
  const {isDark} = useIsDark()

  const operatorLogo = {
    orientation: 'horizontal',
    imgUrl: isDark ? logoOfbDark : logoOfb,
    alt: 'Office français de la biodiversité (OFB)',
  } as const

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
        operatorLogo={operatorLogo}
        serviceTitle='Mon Parc Marin'
        serviceTagline='Votre projet dans un parc naturel marin'
      />
      <main id='contenu' tabIndex={-1}>
        <HomePage />
      </main>
      <Footer
        id='footer'
        accessibility='non compliant'
        operatorLogo={operatorLogo}
        contentDescription={'Mon Parc Marin informe les porteurs de projet au regard des parcs naturels marins. Service proposé par l\'Office français de la biodiversité.'}
        bottomItems={[headerFooterDisplayItem]}
      />
    </>
  )
}
