import {Alert} from '@codegouvfr/react-dsfr/Alert'
import type {Element, MultiPolygon, Position} from '@pnm/shared'
import {useState, type SubmitEvent} from 'react'
import {flushSync} from 'react-dom'
import {Navigate, useLoaderData, useNavigate} from 'react-router'
import {ActiviteSummary} from '../components/activite-summary.tsx'
import {ElementList} from '../components/element-list.tsx'
import {LocalisationTools} from '../components/localisation-tools.tsx'
import {type Draft, ProjetMap} from '../components/projet-map.tsx'
import {StepNavigation} from '../components/step-navigation.tsx'
import {useParc} from '../parcs.ts'
import {saveProjet, useProjet} from '../projet-storage.ts'
import {createElement, projetStepPath, useActivite} from '../projet.ts'

const missingId = 'localisation-manquante'

export function LocalisationStepPage() {
  const parc = useParc()!
  const perimetre = useLoaderData<MultiPolygon>()
  const activite = useActivite(parc.id)
  const projet = useProjet(parc.id)
  const navigate = useNavigate()
  const [draft, setDraft] = useState<Draft>()
  const [isMissing, setIsMissing] = useState(false)

  if (!activite || !projet) {
    return <Navigate replace to={projetStepPath(parc.id, 'activite')} />
  }

  const elements = projet.localisation ?? []

  function saveElements(localisation: Element[]) {
    saveProjet({...projet!, localisation})
  }

  // Adds the element being drawn, if it has enough positions
  function withDraft(current: Draft | undefined, isBoucle = false): Element[] {
    const element = current && createElement(current.type, current.positions, isBoucle)
    return element ? [...elements, element] : elements
  }

  function finishDraft(current: Draft, isBoucle = false) {
    saveElements(withDraft(current, isBoucle))
    setDraft(undefined)
    setIsMissing(false)
  }

  function handleDraftClick(position: Position, isOnFirstPosition: boolean) {
    if (!draft) {
      return
    }

    // Finishing on the first position closes a parcours into a loop, and a zone
    if (isOnFirstPosition) {
      finishDraft(draft, draft.type === 'parcours')
      return
    }

    setDraft({...draft, positions: [...draft.positions, position]})
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    // An element left being drawn counts, if it can
    const localisation = withDraft(draft)

    if (localisation.length === 0) {
      // The alert must exist before it takes the focus
      flushSync(() => {
        setIsMissing(true)
      })
      document.querySelector<HTMLElement>(`#${missingId}`)?.focus()
      return
    }

    saveElements(localisation)
    // Keeps the scroll position, like the other links between steps
    void navigate(projetStepPath(parc.id, 'mesures'), {preventScrollReset: true})
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <h2>Où se situe votre projet ?</h2>
      <ActiviteSummary activite={activite} changeLink={projetStepPath(parc.id, 'activite')} />
      <LocalisationTools
        draft={draft}
        onStart={type => {
          setDraft({type, positions: []})
        }}
        onUndo={() => {
          setDraft(draft && {...draft, positions: draft.positions.slice(0, -1)})
        }}
        onFinish={() => {
          if (draft) {
            finishDraft(draft)
          }
        }}
        onCancel={() => {
          setDraft(undefined)
        }}
      />
      <div className='fr-grid-row fr-grid-row--gutters'>
        <div className='fr-col-12 fr-col-lg-8'>
          <ProjetMap
            perimetre={perimetre}
            elements={elements}
            draft={draft}
            onDraftClick={handleDraftClick}
          />
          <p className='fr-text--xs fr-mt-1w'>
            Le pointillé blanc marque la limite du {parc.nomComplet.replace(/^Parc/v, 'parc')}.
          </p>
        </div>
        <div className='fr-col-12 fr-col-lg-4'>
          <h3 className='fr-h5'>Votre projet</h3>
          <ElementList
            elements={elements}
            onChange={changed => {
              saveElements(elements.map(element => element.id === changed.id ? changed : element))
            }}
            onDelete={deleted => {
              saveElements(elements.filter(element => element.id !== deleted.id))
            }}
          />
        </div>
      </div>
      {isMissing && (
        <Alert
          small
          id={missingId}
          className='fr-mt-3w'
          severity='error'
          description='Ajoutez au moins un élément sur la carte pour continuer.'
          // Takes the focus when Continuer finds nothing to send
          {...{tabIndex: -1}}
        />
      )}
      <StepNavigation previous={projetStepPath(parc.id, 'activite')} next='submit' />
    </form>
  )
}
