import {fr} from '@codegouvfr/react-dsfr'
import {Button} from '@codegouvfr/react-dsfr/Button'
import type {Element, Habitat, MultiPolygon} from '@pnm/shared'
import {
  addProtocol,
  type ExpressionSpecification,
  type IControl,
  type Map as MapLibreMap,
} from 'maplibre-gl'
import {Protocol} from 'pmtiles'
import {
  type CSSProperties,
  useEffect,
  useId,
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

// Le titre de la carte en pleine page, court
function fullPageTitle(habitats: readonly Habitat[], hasProjet: boolean): string {
  if (hasProjet) {
    return 'Votre projet et les habitats'
  }

  return habitats.length === 1 ? habitats[0]!.nom : 'Les habitats du parc'
}

// Un contrôle de la carte, sous son zoom, qui l'ouvre en pleine page. Il retient son bouton, auquel
// le focus revient quand on la referme
type FullPageControl = IControl & {
  readonly button: HTMLButtonElement
}

function fullPageControl(open: () => void): FullPageControl {
  const container = document.createElement('div')
  container.className = 'maplibregl-ctrl maplibregl-ctrl-group'
  const button = document.createElement('button')
  button.type = 'button'
  // L'icône plein écran de MapLibre, du même dessin que les boutons du zoom
  button.className = 'maplibregl-ctrl-fullscreen'
  button.title = 'Voir la carte en pleine page'
  button.setAttribute('aria-label', 'Voir la carte en pleine page')
  const icon = document.createElement('span')
  icon.className = 'maplibregl-ctrl-icon'
  icon.setAttribute('aria-hidden', 'true')
  button.append(icon)
  button.addEventListener('click', open)
  container.append(button)

  return {
    button,
    onAdd: () => container,
    onRemove() {
      container.remove()
    },
  }
}

// Ce qu'on atteint au clavier dans la carte en pleine page : le focus y reste tant qu'elle est ouverte
const focusable = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

// En pleine page, la carte couvre le site, au-dessus de tout comme une fenêtre modale du DSFR
const fullPageStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1750,
  display: 'flex',
  flexDirection: 'column',
  padding: '0 1rem 1rem',
  backgroundColor: fr.colors.decisions.background.default.grey.default,
}

const fullPageHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
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

// Les habitats qui partagent leur habitat générique partagent une couleur : une carte de tout le parc
// en montre plus que de couleurs qu'on distingue. Un groupe d'un seul habitat garde le nom de son
// habitat, un groupe de plusieurs prend celui de l'habitat générique
type HabitatGroup = {
  readonly key: string
  readonly label: string
  readonly codes: readonly string[]
}

function habitatGroups(habitats: readonly Habitat[]): HabitatGroup[] {
  const groups = new Map<string, Habitat[]>()

  for (const habitat of habitats) {
    const key = habitat.habitatGenerique?.code ?? habitat.code
    groups.set(key, [...groups.get(key) ?? [], habitat])
  }

  return [...groups].map(([key, members]) => ({
    key,
    label: members.length === 1 || members[0]!.habitatGenerique === undefined ? members.map(habitat => habitat.nom).join(', ') : members[0]!.habitatGenerique.nom,
    codes: members.map(habitat => habitat.code),
  }))
}

// Chaque groupe dans sa couleur
function habitatsColor(groups: readonly HabitatGroup[]): ExpressionSpecification | string {
  const [first, firstColor, ...pairs] = groups.flatMap((group, index) => group.codes.flatMap(code => [code, habitatColorAt(index)]))
  return first === undefined || firstColor === undefined ? habitatColor : ['match', ['get', 'habitat'], first, firstColor, ...pairs, habitatColor] as ExpressionSpecification
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
  const wrapperRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const controlRef = useRef<FullPageControl>(undefined)
  const titleId = useId()
  const [map, setMap] = useState<MapLibreMap>()
  const [isFullPage, setIsFullPage] = useState(false)
  const features = useMemo(() => projetFeatures(elements), [elements])
  const groups = useMemo(() => habitatGroups(habitats), [habitats])
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

    const control = fullPageControl(() => {
      setIsFullPage(true)
    })
    controlRef.current = control
    instance.addControl(control, 'top-right')

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
    map.setPaintProperty('habitat-fond', 'fill-color', habitatsColor(groups))
    map.setPaintProperty('habitat-bord', 'line-color', habitatsColor(groups))
    map.getCanvas().setAttribute('aria-label', mapTitle(habitats, hasProjet))
  }, [map, habitats, groups, hasProjet])

  useEffect(() => {
    if (!map) {
      return
    }

    map.setPaintProperty('habitat-fond', 'fill-opacity', fillOpacity(highlightedCode))
    map.setPaintProperty('habitat-bord', 'line-width', lineWidth(highlightedCode))
  }, [map, highlightedCode])

  // En pleine page, la molette et un doigt zooment sans touche : rien d'autre à faire défiler. Échap
  // la referme, et le focus revient au contrôle qui l'a ouverte
  useEffect(() => {
    if (!map) {
      return
    }

    const control = controlRef.current
    control?.button.parentElement?.toggleAttribute('hidden', isFullPage)
    map.resize()

    if (!isFullPage) {
      map.cooperativeGestures.enable()
      return
    }

    map.cooperativeGestures.disable()
    const {overflow} = document.body.style
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsFullPage(false)
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const reachable = [...wrapperRef.current?.querySelectorAll<HTMLElement>(focusable) ?? []].filter(element => !element.closest('[hidden]'))
      const [first] = reachable
      const last = reachable.at(-1)

      if (!first || !last) {
        return
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKeyDown)
      // Le contrôle réapparaît avant de reprendre le focus : masqué, il ne le prendrait pas
      control?.button.parentElement?.removeAttribute('hidden')
      control?.button.focus()
    }
  }, [map, isFullPage])

  return (
    <div
      ref={wrapperRef}
      style={isFullPage ? fullPageStyle : undefined}
      {...(isFullPage ? {role: 'dialog', 'aria-modal': true, 'aria-labelledby': titleId} : {})}
    >
      {isFullPage && (
        <div className='fr-py-2w' style={fullPageHeaderStyle}>
          <h2 id={titleId} className='fr-h5 fr-mb-0'>{fullPageTitle(habitats, hasProjet)}</h2>
          <button
            ref={closeRef}
            type='button'
            className='fr-btn--close fr-btn'
            title='Fermer la pleine page'
            onClick={() => {
              setIsFullPage(false)
            }}
          >
            Fermer
          </button>
        </div>
      )}
      <div ref={containerRef} style={isFullPage ? {flex: 1, minHeight: 0} : {height: 'min(65vh, 36rem)'}} />
      <div className='fr-grid-row fr-grid-row--middle fr-mt-1w'>
        <ul className='fr-raw-list fr-grid-row fr-col-12 fr-col-md' aria-label='Légende de la carte'>
          {groups.map((group, index) => <LegendItem key={group.key} color={habitatColorAt(index)} label={group.label} />)}
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
    </div>
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
