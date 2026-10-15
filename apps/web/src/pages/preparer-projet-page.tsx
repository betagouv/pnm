import {Breadcrumb} from '@codegouvfr/react-dsfr/Breadcrumb'
import {ParcTiles} from '../components/parc-tiles.tsx'
import {parcPath, useParcs} from '../parcs.ts'

export function PreparerProjetPage() {
  const parcs = useParcs()

  return (
    <div className='fr-container fr-pb-6w'>
      <title>Préparer mon projet - Mon Parc Marin</title>
      <Breadcrumb
        homeLinkProps={{to: '/'}}
        segments={[]}
        currentPageLabel='Préparer mon projet'
      />
      <h1>Préparer mon projet</h1>
      <p className='fr-text--lead'>Dans quel parc naturel marin se situe votre projet ?</p>
      <ParcTiles parcs={parcs} linkTo={parc => parcPath(parc.id)} />
    </div>
  )
}
