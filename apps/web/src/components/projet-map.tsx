import {Button} from '@codegouvfr/react-dsfr/Button'
import type {Element, MultiPolygon, Position} from '@pnm/shared'
import type {Feature, FeatureCollection} from 'geojson'
import type {Map as MapLibreMap} from 'maplibre-gl'
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
  featureCollection,
  outlineColor,
  perimetreBounds,
  projetBounds,
  projetFeatures,
  projetFitOptions,
  setProjetData,
  setSourceData,
} from './map.ts'

export type Draft = {
  readonly type: Element['type']
  readonly positions: readonly Position[]
}

type ProjetMapProps = {
  readonly perimetre: MultiPolygon
  readonly elements: readonly Element[]
  // The element being drawn, if any
  readonly draft?: Draft
  // A click while drawing. isOnFirstPosition: the click closes the outline on its first position
  readonly onDraftClick?: (position: Position, isOnFirstPosition: boolean) => void
}

// A click this close to the first position, in pixels, closes the outline
const closingDistance = {mouse: 12, touch: 24}

function draftFeatures(draft: Draft | undefined): FeatureCollection {
  if (!draft) {
    return featureCollection([])
  }

  const positions = draft.positions.map(position => [...position])
  const points: Feature[] = positions.map((coordinates, index) => ({
    type: 'Feature',
    properties: {isFirst: index === 0 && draft.type !== 'lieux'},
    geometry: {type: 'Point', coordinates},
  }))
  const line: Feature[] = draft.type !== 'lieux' && positions.length > 1
    ? [{type: 'Feature', properties: {}, geometry: {type: 'LineString', coordinates: positions}}]
    : []

  return featureCollection([...line, ...points])
}

// A finger is less precise than a mouse
function pointerType(event: MouseEvent): 'mouse' | 'touch' {
  return event instanceof PointerEvent && event.pointerType === 'touch' ? 'touch' : 'mouse'
}

// About 10 cm
function round(position: Position): Position {
  return [Math.round(position[0] * 1e6) / 1e6, Math.round(position[1] * 1e6) / 1e6]
}

// The element being drawn, above the projet
function addDraftLayers(map: MapLibreMap): void {
  for (const id of ['draft', 'guide']) {
    map.addSource(id, {type: 'geojson', data: featureCollection([])})
  }

  map.addLayer({
    id: 'guide',
    type: 'line',
    source: 'guide',
    paint: {'line-width': 2, 'line-color': outlineColor, 'line-dasharray': [2, 2]},
  })
  map.addLayer({
    id: 'draft-trait',
    type: 'line',
    source: 'draft',
    filter: ['==', ['geometry-type'], 'LineString'],
    paint: {'line-width': 3, 'line-color': elementColor, 'line-dasharray': [2, 1]},
  })
  map.addLayer({
    id: 'draft-points',
    type: 'circle',
    source: 'draft',
    filter: ['==', ['geometry-type'], 'Point'],
    paint: {
      // The first position is larger: clicking it closes the outline
      'circle-radius': ['case', ['get', 'isFirst'], 8, 5],
      'circle-color': outlineColor,
      'circle-stroke-width': 3,
      'circle-stroke-color': elementColor,
    },
  })
}

export function ProjetMap({
  perimetre,
  elements,
  draft,
  onDraftClick,
}: ProjetMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<MapLibreMap>()
  // The map listeners are bound once: they read the latest props from here
  const draftRef = useRef(draft)
  const onDraftClickRef = useRef(onDraftClick)
  draftRef.current = draft
  onDraftClickRef.current = onDraftClick

  const features = useMemo(() => projetFeatures(elements), [elements])

  useEffect(() => {
    const instance = createMap({
      container: containerRef.current!,
      title: 'Carte pour situer votre projet',
      // A projet already drawn is shown first, otherwise the whole parc
      ...(elements.length > 0
        ? {bounds: projetBounds(features), fitBoundsOptions: projetFitOptions}
        : {bounds: perimetreBounds(perimetre), fitBoundsOptions: {padding: 24}}),
    })

    instance.on('load', () => {
      addProjetLayers(instance)
      addDraftLayers(instance)
      setMap(instance)
    })

    instance.on('click', event => {
      const {current} = draftRef

      if (!current) {
        return
      }

      const first = current.positions[0]
      const isOnFirstPosition = current.type !== 'lieux'
        && current.positions.length >= 3
        && first !== undefined
        && instance.project(first).dist(event.point) <= closingDistance[pointerType(event.originalEvent)]

      onDraftClickRef.current?.(round([event.lngLat.lng, event.lngLat.lat]), isOnFirstPosition)
    })

    // The segment that the next click would add
    instance.on('mousemove', event => {
      const {current} = draftRef
      const last = current?.positions.at(-1)

      if (!last || !current || current.type === 'lieux') {
        setSourceData(instance, 'guide', featureCollection([]))
        return
      }

      const cursor = [event.lngLat.lng, event.lngLat.lat]
      const first = current.positions[0]!
      const coordinates = current.type === 'zone' && current.positions.length > 1
        ? [[...last], cursor, [...first]]
        : [[...last], cursor]
      setSourceData(instance, 'guide', featureCollection([
        {type: 'Feature', properties: {}, geometry: {type: 'LineString', coordinates}},
      ]))
    })

    instance.on('mouseout', () => {
      setSourceData(instance, 'guide', featureCollection([]))
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

  useEffect(() => {
    if (!map) {
      return
    }

    setSourceData(map, 'draft', draftFeatures(draft))

    if (!draft) {
      setSourceData(map, 'guide', featureCollection([]))
    }

    // While drawing, clicks place points: no zoom on double click
    map.getCanvas().style.cursor = draft ? 'crosshair' : ''

    if (draft) {
      map.doubleClickZoom.disable()
    } else {
      map.doubleClickZoom.enable()
    }
  }, [map, draft])

  return (
    <>
      <div ref={containerRef} style={{height: 'min(65vh, 36rem)'}} />
      {elements.length > 0 && (
        <Button
          type='button'
          priority='tertiary no outline'
          size='small'
          iconId='fr-icon-focus-3-line'
          className='fr-mt-1w'
          onClick={() => {
            map?.fitBounds(projetBounds(features), projetFitOptions)
          }}
        >
          Zoomer sur le projet
        </Button>
      )}
    </>
  )
}
