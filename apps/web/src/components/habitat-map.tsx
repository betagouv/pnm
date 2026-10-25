import {Button} from '@codegouvfr/react-dsfr/Button'
import type {Element, Habitat, MultiPolygon} from '@pnm/shared'
import {addProtocol, type Map as MapLibreMap} from 'maplibre-gl'
import {Protocol} from 'pmtiles'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  addProjetLayers,
  createMap,
  elementColor,
  habitatColor,
  perimetreBounds,
  projetBounds,
  projetFeatures,
  projetFitOptions,
  setProjetData,
} from './map.ts'

type HabitatMapProps = {
  readonly habitat: Habitat
  // The PMTiles of the surfaces of every habitat, as an absolute address
  readonly tilesUrl: string
  readonly perimetre: MultiPolygon
  // The projet, if the map shows the habitat around it; otherwise the map shows the whole parc
  readonly elements?: readonly Element[]
}

// The same empty projet from one render to the next
const noElements: readonly Element[] = []

function mapTitle(habitat: Habitat, hasProjet: boolean): string {
  return hasProjet
    ? `Carte de votre projet et de l'habitat ${habitat.nom}`
    : `Carte de l'habitat ${habitat.nom} dans le parc`
}

// MapLibre reads pmtiles:// sources through this protocol, added once
let isProtocolAdded = false

function addPmtilesProtocol(): void {
  if (isProtocolAdded) {
    return
  }

  addProtocol('pmtiles', new Protocol().tile)
  isProtocolAdded = true
}

// The surfaces of a habitat, from the tiles of every habitat
function habitatFilter(code: string) {
  return ['==', ['get', 'habitat'], code] as ['==', ['get', string], string]
}

// The surfaces of the habitat, beneath the projet
function addHabitatLayers(map: MapLibreMap, tilesUrl: string, code: string): void {
  map.addSource('habitats', {type: 'vector', url: `pmtiles://${tilesUrl}`})
  map.addLayer({
    id: 'habitat-fond',
    type: 'fill',
    source: 'habitats',
    'source-layer': 'habitats',
    filter: habitatFilter(code),
    // Bolder from afar, where the habitat is a thin strip along the coast; lighter up close, where
    // the sea floor shows through
    paint: {'fill-color': habitatColor, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.7, 13, 0.3]},
  })
  map.addLayer({
    id: 'habitat-bord',
    type: 'line',
    source: 'habitats',
    'source-layer': 'habitats',
    filter: habitatFilter(code),
    paint: {'line-color': habitatColor, 'line-width': 2},
  })
}

export function HabitatMap({
  habitat,
  tilesUrl,
  perimetre,
  elements = noElements,
}: HabitatMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<MapLibreMap>()
  const features = useMemo(() => projetFeatures(elements), [elements])
  const hasProjet = elements.length > 0

  useEffect(() => {
    addPmtilesProtocol()

    const instance = createMap({
      container: containerRef.current!,
      title: mapTitle(habitat, hasProjet),
      ...(hasProjet
        ? {bounds: projetBounds(features), fitBoundsOptions: projetFitOptions}
        : {bounds: perimetreBounds(perimetre), fitBoundsOptions: {padding: 24}}),
    })

    instance.on('load', () => {
      addHabitatLayers(instance, tilesUrl, habitat.code)
      addProjetLayers(instance)
      setMap(instance)
    })

    return () => {
      instance.remove()
    }
  // The map is created once; its data follows the props in the effects below
  }, [])

  useEffect(() => {
    if (map) {
      setProjetData(map, perimetre, features)
    }
  }, [map, perimetre, features])

  // Another habitat, shown on the same map
  useEffect(() => {
    if (!map) {
      return
    }

    map.setFilter('habitat-fond', habitatFilter(habitat.code))
    map.setFilter('habitat-bord', habitatFilter(habitat.code))
    map.getCanvas().setAttribute('aria-label', mapTitle(habitat, hasProjet))
  }, [map, habitat, hasProjet])

  return (
    <>
      <div ref={containerRef} style={{height: 'min(65vh, 36rem)'}} />
      <div className='fr-grid-row fr-grid-row--middle fr-mt-1w'>
        <ul className='fr-raw-list fr-grid-row fr-col-12 fr-col-md' aria-label='Légende de la carte'>
          <LegendItem color={habitatColor} label={habitat.nom} />
          {hasProjet && <LegendItem color={elementColor} label='Votre projet' />}
          <LegendItem isDashed label='Limite du parc' />
        </ul>
        {hasProjet && (
          <Button
            type='button'
            priority='tertiary no outline'
            size='small'
            iconId='fr-icon-focus-3-line'
            onClick={() => {
              map?.fitBounds(projetBounds(features), projetFitOptions)
            }}
          >
            Zoomer sur le projet
          </Button>
        )}
      </div>
    </>
  )
}

type LegendItemProps = {
  readonly label: string
  readonly color?: string
  readonly isDashed?: boolean
}

function LegendItem({label, color, isDashed = false}: LegendItemProps) {
  return (
    <li className='fr-text--sm fr-mb-0 fr-mr-3w'>
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: '1rem',
          height: '0.75rem',
          marginRight: '0.5rem',
          verticalAlign: 'middle',
          // The limit of the parc is a dashed line on the map
          ...(isDashed
            ? {borderTop: '2px dashed currentColor', height: 0}
            : {backgroundColor: color, opacity: 0.8}),
        }}
      />
      {label}
    </li>
  )
}
