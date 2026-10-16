import 'maplibre-gl/dist/maplibre-gl.css'
import {fr} from '@codegouvfr/react-dsfr'
import {Button} from '@codegouvfr/react-dsfr/Button'
import type {Element, MultiPolygon, Position} from '@pnm/shared'
import bbox from '@turf/bbox'
import buffer from '@turf/buffer'
import type {
  Feature,
  FeatureCollection,
  Geometry,
  MultiPolygon as GeoJsonMultiPolygon,
  Polygon,
} from 'geojson'
import {
  type GeoJSONSource,
  Map as MapLibreMap,
  type MapOptions,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

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

const elementColor = fr.colors.getHex({isDark: false}).options.orangeTerreBattue.main645.default
const outlineColor = '#ffffff'

// IGN aerial photographs, from the Géoplateforme
const style: NonNullable<MapOptions['style']> = {
  version: 8,
  sources: {
    photo: {
      type: 'raster',
      tiles: ['https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.ign.fr/">IGN</a>',
    },
  },
  layers: [
    {
      id: 'photo',
      type: 'raster',
      source: 'photo',
    },
  ],
}

const locale = {
  'AttributionControl.ToggleAttribution': 'Afficher les sources',
  'Map.Title': 'Carte pour situer votre projet',
  'NavigationControl.ZoomIn': 'Zoomer',
  'NavigationControl.ZoomOut': 'Dézoomer',
  'CooperativeGesturesHandler.WindowsHelpText': 'Utilisez Ctrl et la molette pour zoomer sur la carte',
  'CooperativeGesturesHandler.MacHelpText': 'Utilisez ⌘ et la molette pour zoomer sur la carte',
  'CooperativeGesturesHandler.MobileHelpText': 'Utilisez deux doigts pour déplacer la carte',
}

// Translucent orange turns grey over the dark sea: these stay opaque enough to read as orange
const bufferOpacity = 0.4

// A click this close to the first position, in pixels, closes the outline
const closingDistance = {mouse: 12, touch: 24}

function closed(positions: readonly Position[]): number[][] {
  return [...positions, positions[0]!].map(position => [...position])
}

// What the porteur de projet drew
function elementGeometry(element: Element): Geometry {
  const coordinates = element.positions.map(position => [...position])

  switch (element.type) {
    case 'lieux': {
      return {type: 'MultiPoint', coordinates}
    }

    case 'parcours': {
      return {type: 'LineString', coordinates: element.boucle ? closed(element.positions) : coordinates}
    }

    case 'zone': {
      return {type: 'Polygon', coordinates: [closed(element.positions)]}
    }
  }
}

// The distance around the element, in meters
function bufferDistance(element: Element): number {
  switch (element.type) {
    case 'lieux': {
      return element.rayon
    }

    // The corridor spreads on both sides of the route
    case 'parcours': {
      return element.largeur / 2
    }

    case 'zone': {
      return element.marge
    }
  }
}

// The area covered with the distance around: one shape per element, so that overlaps within an
// element do not show
function elementBuffer(element: Element): Feature<Polygon | GeoJsonMultiPolygon> | undefined {
  const distance = bufferDistance(element)
  const feature: Feature = {type: 'Feature', properties: {}, geometry: elementGeometry(element)}

  return distance === 0 ? undefined : buffer(feature, distance, {units: 'meters'})
}

function featureCollection(features: Feature[]): FeatureCollection {
  return {type: 'FeatureCollection', features}
}

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

type Bounds = [number, number, number, number]

// Room around the projet, and a limit so that a single lieu does not fill the map
const projetFitOptions = {padding: 48, maxZoom: 15}

// The elements and the distances around them
function projetBounds(elements: FeatureCollection, buffers: FeatureCollection): Bounds {
  const [west, south, east, north] = bbox(featureCollection([...elements.features, ...buffers.features]))
  return [west, south, east, north]
}

function perimetreBounds(perimetre: MultiPolygon): Bounds {
  const positions = perimetre.coordinates.flat().flat()
  const longitudes = positions.map(([longitude]) => longitude)
  const latitudes = positions.map(([, latitude]) => latitude)
  return [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)]
}

// A finger is less precise than a mouse
function pointerType(event: MouseEvent): 'mouse' | 'touch' {
  return event instanceof PointerEvent && event.pointerType === 'touch' ? 'touch' : 'mouse'
}

// About 10 cm
function round(position: Position): Position {
  return [Math.round(position[0] * 1e6) / 1e6, Math.round(position[1] * 1e6) / 1e6]
}

function addOverlay(map: MapLibreMap): void {
  for (const id of ['perimetre', 'tampons', 'elements', 'draft', 'guide']) {
    map.addSource(id, {type: 'geojson', data: featureCollection([])})
  }

  map.addLayer({
    id: 'perimetre',
    type: 'line',
    source: 'perimetre',
    paint: {
      'line-color': outlineColor,
      'line-width': 2,
      'line-dasharray': [3, 2],
      'line-opacity': 0.8,
    },
  })

  // Distances around the elements, beneath the elements themselves
  map.addLayer({
    id: 'tampons',
    type: 'fill',
    source: 'tampons',
    paint: {'fill-color': elementColor, 'fill-opacity': bufferOpacity},
  })
  // The edge of the distance, so that its extent reads even over the dark sea
  map.addLayer({
    id: 'tampons-bord',
    type: 'line',
    source: 'tampons',
    paint: {'line-width': 1.5, 'line-color': elementColor, 'line-dasharray': [2, 2]},
  })
  map.addLayer({
    id: 'zone-fond',
    type: 'fill',
    source: 'elements',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {'fill-color': elementColor, 'fill-opacity': 0.5},
  })
  map.addLayer({
    id: 'traits',
    type: 'line',
    source: 'elements',
    filter: ['!=', ['geometry-type'], 'Point'],
    layout: {'line-cap': 'round', 'line-join': 'round'},
    paint: {'line-width': 3, 'line-color': elementColor},
  })
  map.addLayer({
    id: 'lieux',
    type: 'circle',
    source: 'elements',
    filter: ['==', ['geometry-type'], 'Point'],
    paint: {
      'circle-radius': 6,
      'circle-color': elementColor,
      'circle-stroke-width': 2,
      'circle-stroke-color': outlineColor,
    },
  })

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

function setSourceData(map: MapLibreMap, id: string, data: FeatureCollection): void {
  void map.getSource<GeoJSONSource>(id)?.setData(data)
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

  const elementFeatures = useMemo(() => featureCollection(elements.map(element => ({
    type: 'Feature',
    properties: {},
    geometry: elementGeometry(element),
  }))), [elements])
  const bufferFeatures = useMemo(
    () => featureCollection(elements.flatMap(element => elementBuffer(element) ?? [])),
    [elements],
  )

  useEffect(() => {
    // Once bundled, MapLibre would look for its worker next to itself, where it is not
    setWorkerUrl(workerUrl)

    const instance = new MapLibreMap({
      container: containerRef.current!,
      style,
      // A projet already drawn is shown first, otherwise the whole parc
      ...(elements.length > 0
        ? {bounds: projetBounds(elementFeatures, bufferFeatures), fitBoundsOptions: projetFitOptions}
        : {bounds: perimetreBounds(perimetre), fitBoundsOptions: {padding: 24}}),
      // A map that does not rotate or tilt is easier to read
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      maxPitch: 0,
      // The page scrolls with one finger or the wheel; the map with two fingers or Ctrl
      cooperativeGestures: true,
      locale,
      attributionControl: {compact: true},
    })
    instance.touchZoomRotate.disableRotation()
    instance.keyboard.disableRotation()
    instance.addControl(new NavigationControl({showCompass: false}))
    instance.addControl(new ScaleControl({unit: 'metric'}), 'bottom-left')

    instance.on('load', () => {
      addOverlay(instance)
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
    if (!map) {
      return
    }

    setSourceData(map, 'perimetre', featureCollection([{type: 'Feature', properties: {}, geometry: perimetre}]))
  }, [map, perimetre])

  useEffect(() => {
    if (!map) {
      return
    }

    setSourceData(map, 'elements', elementFeatures)
    setSourceData(map, 'tampons', bufferFeatures)
  }, [map, elementFeatures, bufferFeatures])

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
            map?.fitBounds(projetBounds(elementFeatures, bufferFeatures), projetFitOptions)
          }}
        >
          Zoomer sur le projet
        </Button>
      )}
    </>
  )
}
