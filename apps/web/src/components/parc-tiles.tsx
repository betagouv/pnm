import {Badge} from '@codegouvfr/react-dsfr/Badge'
import {Tile} from '@codegouvfr/react-dsfr/Tile'
import type {Parc} from '@pnm/shared'

type ParcTilesProps = {
  readonly parcs: readonly Parc[]
  readonly linkTo: (parc: Parc) => string
}

export function ParcTiles({parcs, linkTo}: ParcTilesProps) {
  return (
    <ul className='fr-grid-row fr-grid-row--gutters fr-raw-list'>
      {parcs.map(parc => (
        <li key={parc.id} className='fr-col-12 fr-col-sm-6 fr-col-lg-3'>
          <ParcTile parc={parc} linkTo={linkTo} />
        </li>
      ))}
    </ul>
  )
}

type ParcTileProps = {
  readonly parc: Parc
  readonly linkTo: (parc: Parc) => string
}

function ParcTile({parc, linkTo}: ParcTileProps) {
  if (!parc.disponible) {
    // A disabled button gets the DSFR disabled tile style. A link would not do:
    // `disabled` only drops `href`, and a React Router link builds it from `to`
    return (
      <Tile
        disabled
        title={parc.nom}
        titleAs='h2'
        desc={parc.localisation}
        start={<Badge small noIcon>Bientôt disponible</Badge>}
        buttonProps={{type: 'button'}}
      />
    )
  }

  return (
    <Tile
      title={parc.nom}
      titleAs='h2'
      desc={parc.localisation}
      linkProps={{to: linkTo(parc)}}
    />
  )
}
