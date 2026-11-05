import {fr} from '@codegouvfr/react-dsfr'
import {Button} from '@codegouvfr/react-dsfr/Button'
import {createModal} from '@codegouvfr/react-dsfr/Modal'
import {useIsModalOpen} from '@codegouvfr/react-dsfr/Modal/useIsModalOpen'
import type {Element, MultiPolygon} from '@pnm/shared'
import type {ExpressionSpecification, Map as MapLibreMap} from 'maplibre-gl'
import {
  type Ref,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {addPmtilesProtocol, LegendItem} from './habitat-map.tsx'
import {
  addProjetLayers,
  createMap,
  elementColor,
  habitatColor,
  outlineColor,
  projetBounds,
  projetFeatures,
  projetFitOptions,
  setProjetData,
} from './map.ts'

// A habitat that the map shows, in its colour
export type MapHabitat = {
  readonly code: string
  readonly nom: string
  readonly color: string
}

type SyntheseMapProps = {
  // The PMTiles of the surfaces of every habitat, as an absolute address
  readonly tilesUrl: string
  readonly perimetre: MultiPolygon
  readonly elements: readonly Element[]
  readonly habitats: readonly MapHabitat[]
  // The codes of the habitats to bring forward: the others fade. None brings all of them alike
  readonly highlighted: readonly string[]
  readonly isInteractive: boolean
  readonly height: string
}

const mapTitle = 'Carte de votre projet et des habitats qu\'il rencontre'

function codesFilter(codes: readonly string[]): ExpressionSpecification {
  return ['in', ['get', 'habitat'], ['literal', [...codes]]]
}

// Each habitat in its colour
function colorExpression(habitats: readonly MapHabitat[]): ExpressionSpecification | string {
  const [first, ...others] = habitats

  if (!first) {
    return habitatColor
  }

  return [
    'match',
    ['get', 'habitat'],
    first.code,
    first.color,
    ...others.flatMap(habitat => [habitat.code, habitat.color]),
    habitatColor,
  ] as ExpressionSpecification
}

function fillOpacity(highlighted: readonly string[]): ExpressionSpecification | number {
  return highlighted.length === 0 ? 0.5 : ['case', codesFilter(highlighted), 0.85, 0.15]
}

function lineWidth(highlighted: readonly string[]): ExpressionSpecification | number {
  return highlighted.length === 0 ? 0 : ['case', codesFilter(highlighted), 2, 0]
}

// The surfaces of the habitats, beneath the projet
function addHabitatsLayers(
  map: MapLibreMap,
  tilesUrl: string,
  habitats: readonly MapHabitat[],
  highlighted: readonly string[],
): void {
  const filter = codesFilter(habitats.map(habitat => habitat.code))

  map.addSource('habitats', {type: 'vector', url: `pmtiles://${tilesUrl}`})
  map.addLayer({
    id: 'habitats-fond',
    type: 'fill',
    source: 'habitats',
    'source-layer': 'habitats',
    filter,
    paint: {'fill-color': colorExpression(habitats), 'fill-opacity': fillOpacity(highlighted)},
  })
  // Only around the habitats brought forward
  map.addLayer({
    id: 'habitats-bord',
    type: 'line',
    source: 'habitats',
    'source-layer': 'habitats',
    filter,
    paint: {'line-color': outlineColor, 'line-width': lineWidth(highlighted)},
  })
}

// The projet and the habitats it meets. The habitats are fixed once the map is made; those brought
// forward follow the props
export function SyntheseMap({
  tilesUrl,
  perimetre,
  elements,
  habitats,
  highlighted,
  isInteractive,
  height,
}: SyntheseMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<MapLibreMap>()
  const features = useMemo(() => projetFeatures(elements), [elements])

  useEffect(() => {
    addPmtilesProtocol()

    const instance = createMap({
      container: containerRef.current!,
      title: mapTitle,
      bounds: projetBounds(features),
      // A small map leaves less room around the projet
      fitBoundsOptions: isInteractive ? projetFitOptions : {...projetFitOptions, padding: 16},
      isInteractive,
    })

    instance.on('load', () => {
      addHabitatsLayers(instance, tilesUrl, habitats, highlighted)
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

  useEffect(() => {
    if (!map) {
      return
    }

    map.setPaintProperty('habitats-fond', 'fill-opacity', fillOpacity(highlighted))
    map.setPaintProperty('habitats-bord', 'line-width', lineWidth(highlighted))
  }, [map, highlighted])

  return <div ref={containerRef} style={{height}} />
}

type MapLegendProps = {
  readonly habitats: readonly MapHabitat[]
  readonly hasPerimetre?: boolean
}

function MapLegend({habitats, hasPerimetre = false}: MapLegendProps) {
  return (
    <ul className='fr-raw-list fr-grid-row fr-mt-1w' aria-label='Légende de la carte'>
      <LegendItem color={elementColor} label='Votre projet' />
      {habitats.map(habitat => <LegendItem key={habitat.code} color={habitat.color} label={habitat.nom} />)}
      {hasPerimetre && <LegendItem isDashed label='Limite du parc' />}
    </ul>
  )
}

const carteModal = createModal({id: 'carte-projet', isOpenedByDefault: false})

type SyntheseMapCardProps = Omit<SyntheseMapProps, 'isInteractive' | 'height'> & {
  // What the map brings forward, in words, or why it shows nothing more
  readonly caption: string
  readonly ref?: Ref<HTMLDivElement>
}

// The map beside the synthèse: it illustrates what the porteur de projet reads, and only moves in
// its enlarged version
export function SyntheseMapCard({caption, ref, ...mapProps}: SyntheseMapCardProps) {
  const isModalOpen = useIsModalOpen(carteModal)

  return (
    <div
      ref={ref}
      className='fr-p-2w'
      style={{
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        // Room above the card when a link brings it into view
        scrollMarginTop: fr.spacing('3w'),
      }}
    >
      <p className='fr-text--sm fr-text--bold fr-mb-1w'>Carte indicative</p>
      <SyntheseMap {...mapProps} isInteractive={false} height='18rem' />
      <MapLegend habitats={mapProps.habitats} />
      <p aria-live='polite' className='fr-text--sm fr-mb-1w' style={{minHeight: '3rem'}}>
        {caption}
      </p>
      <p className='fr-text--xs fr-mb-2w' style={{color: fr.colors.decisions.text.mention.grey.default}}>
        Les contours des habitats sont élargis et simplifiés : ils montrent où ils se trouvent, pas
        leur limite exacte.
      </p>
      <Button
        priority='tertiary'
        size='small'
        iconId='fr-icon-fullscreen-line'
        nativeButtonProps={carteModal.buttonProps}
      >
        Agrandir la carte
      </Button>
      <carteModal.Component title='Carte de votre projet' size='large'>
        {/* Made when the modal opens: a map needs its size */}
        {isModalOpen && <SyntheseMap {...mapProps} isInteractive height='min(65vh, 36rem)' />}
        <MapLegend hasPerimetre habitats={mapProps.habitats} />
      </carteModal.Component>
    </div>
  )
}
