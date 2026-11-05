import {Button} from '@codegouvfr/react-dsfr/Button'
import type {Element, Habitat, MultiPolygon} from '@pnm/shared'
import {addProtocol, type ExpressionSpecification, type Map as MapLibreMap} from 'maplibre-gl'
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
  habitatColors,
  perimetreBounds,
  projetBounds,
  projetFeatures,
  projetFitOptions,
  setProjetData,
} from './map.ts'

type HabitatMapProps = {
  // Each in its colour, in turn
  readonly habitats: readonly Habitat[]
  // Brought forward: the others fade
  readonly highlightedCode?: string
  // The PMTiles of the surfaces of every habitat, as an absolute address
  readonly tilesUrl: string
  readonly perimetre: MultiPolygon
  // The projet, if the map shows the habitat around it; otherwise the map shows the whole parc
  readonly elements?: readonly Element[]
}

// The same empty projet from one render to the next
const noElements: readonly Element[] = []

function mapTitle(habitats: readonly Habitat[], hasProjet: boolean): string {
  const noms = habitats.map(habitat => habitat.nom).join(', ')
  const what = habitats.length === 1 ? `de l'habitat ${noms}` : `des habitats ${noms}`
  return hasProjet ? `Carte de votre projet et ${what}` : `Carte ${what} dans le parc`
}

// The colour of the habitat at this place in the list
export function habitatColorAt(index: number): string {
  return habitatColors[index % habitatColors.length]!
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

// The surfaces of the habitats, from the tiles of every habitat
function habitatsFilter(habitats: readonly Habitat[]): ExpressionSpecification {
  return ['in', ['get', 'habitat'], ['literal', habitats.map(habitat => habitat.code)]]
}

// Each habitat in its colour
function habitatsColor(habitats: readonly Habitat[]): ExpressionSpecification | string {
  const [first, ...others] = habitats

  if (!first) {
    return habitatColor
  }

  return [
    'match',
    ['get', 'habitat'],
    first.code,
    habitatColorAt(0),
    ...others.flatMap((habitat, index) => [habitat.code, habitatColorAt(index + 1)]),
    habitatColor,
  ] as ExpressionSpecification
}

function fillOpacity(highlightedCode: string | undefined): ExpressionSpecification {
  return highlightedCode === undefined
    // Bolder from afar, where a habitat is a thin strip along the coast; lighter up close, where
    // the sea floor shows through
    ? ['interpolate', ['linear'], ['zoom'], 9, 0.7, 13, 0.3]
    : ['case', ['==', ['get', 'habitat'], highlightedCode], 0.8, 0.1]
}

function lineWidth(highlightedCode: string | undefined): ExpressionSpecification | number {
  return highlightedCode === undefined ? 2 : ['case', ['==', ['get', 'habitat'], highlightedCode], 3, 0]
}

// The surfaces of the habitats, beneath the projet
function addHabitatLayers(map: MapLibreMap, tilesUrl: string): void {
  map.addSource('habitats', {type: 'vector', url: `pmtiles://${tilesUrl}`})
  map.addLayer({
    id: 'habitat-fond',
    type: 'fill',
    source: 'habitats',
    'source-layer': 'habitats',
    filter: habitatsFilter([]),
    paint: {'fill-color': habitatColor, 'fill-opacity': fillOpacity(undefined)},
  })
  map.addLayer({
    id: 'habitat-bord',
    type: 'line',
    source: 'habitats',
    'source-layer': 'habitats',
    filter: habitatsFilter([]),
    paint: {'line-color': habitatColor, 'line-width': lineWidth(undefined)},
  })
}

export function HabitatMap({
  habitats,
  highlightedCode,
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
      title: mapTitle(habitats, hasProjet),
      ...(hasProjet
        ? {bounds: projetBounds(features), fitBoundsOptions: projetFitOptions}
        : {bounds: perimetreBounds(perimetre), fitBoundsOptions: {padding: 24}}),
    })

    instance.on('load', () => {
      addHabitatLayers(instance, tilesUrl)
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

  // Other habitats, shown on the same map
  useEffect(() => {
    if (!map) {
      return
    }

    map.setFilter('habitat-fond', habitatsFilter(habitats))
    map.setFilter('habitat-bord', habitatsFilter(habitats))
    map.setPaintProperty('habitat-fond', 'fill-color', habitatsColor(habitats))
    map.setPaintProperty('habitat-bord', 'line-color', habitatsColor(habitats))
    map.getCanvas().setAttribute('aria-label', mapTitle(habitats, hasProjet))
  }, [map, habitats, hasProjet])

  useEffect(() => {
    if (!map) {
      return
    }

    map.setPaintProperty('habitat-fond', 'fill-opacity', fillOpacity(highlightedCode))
    map.setPaintProperty('habitat-bord', 'line-width', lineWidth(highlightedCode))
  }, [map, highlightedCode])

  return (
    <>
      <div ref={containerRef} style={{height: 'min(65vh, 36rem)'}} />
      <div className='fr-grid-row fr-grid-row--middle fr-mt-1w'>
        <ul className='fr-raw-list fr-grid-row fr-col-12 fr-col-md' aria-label='Légende de la carte'>
          {habitats.map((habitat, index) => <LegendItem key={habitat.code} color={habitatColorAt(index)} label={habitat.nom} />)}
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
