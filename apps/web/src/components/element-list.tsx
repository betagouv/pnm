import {Button} from '@codegouvfr/react-dsfr/Button'
import {Range} from '@codegouvfr/react-dsfr/Range'
import type {Element} from '@pnm/shared'
import area from '@turf/area'
import length from '@turf/length'

type ElementListProps = {
  readonly elements: readonly Element[]
  readonly onChange: (element: Element) => void
  readonly onDelete: (element: Element) => void
}

const numberFormat = new Intl.NumberFormat('fr-FR', {maximumFractionDigits: 1})

// The element in words, as the porteur de projet sees it: "Boucle de 4,2 km"
export function elementTitle(element: Element): string {
  switch (element.type) {
    case 'lieux': {
      const count = element.positions.length
      return count === 1 ? '1 lieu' : `${count} lieux`
    }

    case 'parcours': {
      const positions = element.boucle ? [...element.positions, element.positions[0]!] : element.positions
      const kilometers = length({
        type: 'Feature',
        properties: {},
        geometry: {type: 'LineString', coordinates: positions.map(position => [...position])},
      })
      return `${element.boucle ? 'Boucle' : 'Parcours'} de ${numberFormat.format(kilometers)} km`
    }

    case 'zone': {
      const squareMeters = area({
        type: 'Polygon',
        coordinates: [[...element.positions, element.positions[0]!].map(position => [...position])],
      })
      return squareMeters < 1_000_000
        ? `Zone de ${numberFormat.format(squareMeters / 10_000)} ha`
        : `Zone de ${numberFormat.format(squareMeters / 1_000_000)} km²`
    }
  }
}

type Distance = {
  readonly label: string
  readonly value: number
  readonly update: (value: number) => Element
}

// The distance of each element, as the porteur de projet thinks of it
function distance(element: Element): Distance {
  switch (element.type) {
    case 'lieux': {
      return {label: 'Rayon autour de chaque lieu', value: element.rayon, update: rayon => ({...element, rayon})}
    }

    case 'parcours': {
      return {label: 'Largeur du couloir', value: element.largeur, update: largeur => ({...element, largeur})}
    }

    case 'zone': {
      return {label: 'Marge autour de la zone', value: element.marge, update: marge => ({...element, marge})}
    }
  }
}

export function ElementList({elements, onChange, onDelete}: ElementListProps) {
  if (elements.length === 0) {
    return (
      <p className='fr-text--sm'>
        Aucun élément pour l'instant. Ajoutez des lieux, un parcours ou une zone.
      </p>
    )
  }

  return (
    <ul className='fr-raw-list'>
      {elements.map(element => {
        const {label, value, update} = distance(element)
        const title = elementTitle(element)
        return (
          <li key={element.id} className='fr-mb-3w'>
            <h4 className='fr-h6 fr-mb-1w'>{title}</h4>
            <Range
              small
              label={label}
              min={0}
              max={1000}
              step={10}
              suffix=' m'
              nativeInputProps={{
                value,
                onChange(event) {
                  onChange(update(Number(event.currentTarget.value)))
                },
              }}
            />
            <Button
              type='button'
              priority='tertiary no outline'
              size='small'
              iconId='fr-icon-delete-line'
              onClick={() => {
                onDelete(element)
              }}
            >
              Supprimer
              <span className='fr-sr-only'>{` : ${title}`}</span>
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
