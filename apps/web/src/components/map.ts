// What the maps of the projet share: the aerial photographs, the perimetre of the parc and the
// elements of the projet with the distances around them
import 'maplibre-gl/dist/maplibre-gl.css'
import {fr} from '@codegouvfr/react-dsfr'
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

export const elementColor = fr.colors.getHex({isDark: false}).options.orangeTerreBattue.main645.default
export const outlineColor = '#ffffff'
// The colour of a habitat, on the map as on its cards
export const habitatColor = fr.colors.getHex({isDark: false}).options.greenEmeraude.main632.default

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
  'NavigationControl.ZoomIn': 'Zoomer',
  'NavigationControl.ZoomOut': 'Dézoomer',
  'CooperativeGesturesHandler.WindowsHelpText': 'Utilisez Ctrl et la molette pour zoomer sur la carte',
  'CooperativeGesturesHandler.MacHelpText': 'Utilisez ⌘ et la molette pour zoomer sur la carte',
  'CooperativeGesturesHandler.MobileHelpText': 'Utilisez deux doigts pour déplacer la carte',
}

// Translucent orange turns grey over the dark sea: these stay opaque enough to read as orange
const bufferOpacity = 0.4

export function featureCollection(features: Feature[]): FeatureCollection {
  return {type: 'FeatureCollection', features}
}

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

export type ProjetFeatures = {
  readonly elements: FeatureCollection
  readonly buffers: FeatureCollection
}

export function projetFeatures(elements: readonly Element[]): ProjetFeatures {
  return {
    elements: featureCollection(elements.map(element => ({
      type: 'Feature',
      properties: {},
      geometry: elementGeometry(element),
    }))),
    buffers: featureCollection(elements.flatMap(element => elementBuffer(element) ?? [])),
  }
}

type Bounds = [number, number, number, number]

// Room around the projet, and a limit so that a single lieu does not fill the map
export const projetFitOptions = {padding: 48, maxZoom: 15}

// The elements and the distances around them
export function projetBounds({elements, buffers}: ProjetFeatures): Bounds {
  const [west, south, east, north] = bbox(featureCollection([...elements.features, ...buffers.features]))
  return [west, south, east, north]
}

export function perimetreBounds(perimetre: MultiPolygon): Bounds {
  const positions = perimetre.coordinates.flat().flat()
  const longitudes = positions.map(([longitude]) => longitude)
  const latitudes = positions.map(([, latitude]) => latitude)
  return [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)]
}

type CreateMapOptions = {
  readonly container: HTMLElement
  // What the map shows, for screen readers
  readonly title: string
  readonly bounds: Bounds
  readonly fitBoundsOptions: MapOptions['fitBoundsOptions']
}

export function createMap({
  container,
  title,
  bounds,
  fitBoundsOptions,
}: CreateMapOptions): MapLibreMap {
  // Once bundled, MapLibre would look for its worker next to itself, where it is not
  setWorkerUrl(workerUrl)

  const map = new MapLibreMap({
    container,
    style,
    bounds,
    fitBoundsOptions,
    // A map that does not rotate or tilt is easier to read
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    maxPitch: 0,
    // The page scrolls with one finger or the wheel; the map with two fingers or Ctrl
    cooperativeGestures: true,
    locale: {...locale, 'Map.Title': title},
    attributionControl: {compact: true},
  })
  map.touchZoomRotate.disableRotation()
  map.keyboard.disableRotation()
  map.addControl(new NavigationControl({showCompass: false}))
  map.addControl(new ScaleControl({unit: 'metric'}), 'bottom-left')

  return map
}

export function setSourceData(map: MapLibreMap, id: string, data: FeatureCollection): void {
  void map.getSource<GeoJSONSource>(id)?.setData(data)
}

// The limit of the parc, then the projet above it: its distances, then its elements
export function addProjetLayers(map: MapLibreMap): void {
  for (const id of ['perimetre', 'tampons', 'elements']) {
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
}

export function setProjetData(map: MapLibreMap, perimetre: MultiPolygon, {elements, buffers}: ProjetFeatures): void {
  setSourceData(map, 'perimetre', featureCollection([{type: 'Feature', properties: {}, geometry: perimetre}]))
  setSourceData(map, 'elements', elements)
  setSourceData(map, 'tampons', buffers)
}
