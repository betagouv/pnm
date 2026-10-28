import type {Element, Position, Projet} from '@pnm/shared'
import {useSyncExternalStore} from 'react'

// The projet in progress stays in the browser, one per browser. It will move to a database,
// where the browser will only keep its id and key
const storageKey = 'projet'

const listeners = new Set<() => void>()

// Last saved value, for browsers that refuse localStorage (private browsing, blocked storage)
let memory: string | undefined

function readStored(): string | undefined {
  try {
    return localStorage.getItem(storageKey) ?? undefined
  } catch {
    return memory
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isPositions(value: unknown, minLength: number): value is Position[] {
  return Array.isArray(value)
    && value.length >= minLength
    && value.every(position => Array.isArray(position)
      && position.length === 2
      && position.every(coordinate => typeof coordinate === 'number'))
}

function isDistance(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0
}

// The id of a record of the plan de gestion, as in its Grist document
function isId(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0
}

// Mirrors the element schema of @pnm/shared, which the front does not bundle
function isElement(value: unknown): value is Element {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return false
  }

  switch (value.type) {
    case 'lieux': {
      return isPositions(value.positions, 1) && isDistance(value.rayon)
    }

    case 'parcours': {
      return isPositions(value.positions, 2) && typeof value.boucle === 'boolean' && isDistance(value.largeur)
    }

    case 'zone': {
      return isPositions(value.positions, 3) && isDistance(value.marge)
    }

    default: {
      return false
    }
  }
}

// The stored value comes from an earlier visit, maybe from an older version of the site.
// What no longer makes sense is dropped
function parseProjet(stored: string | undefined): Projet | undefined {
  if (stored === undefined) {
    return undefined
  }

  try {
    const value: unknown = JSON.parse(stored)

    if (!isRecord(value) || typeof value.parc !== 'string') {
      return undefined
    }

    const {parc, activite, localisation} = value

    return {
      parc,
      activite: isId(activite) ? activite : undefined,
      localisation: Array.isArray(localisation) ? localisation.filter(element => isElement(element)) : undefined,
    }
  } catch {
    return undefined
  }
}

type Snapshot = {
  readonly stored: string | undefined
  readonly projet: Projet | undefined
}

// React's useSyncExternalStore needs the same object as long as the stored value does not change
let snapshot: Snapshot | undefined

function getProjet(): Projet | undefined {
  const stored = readStored()

  if (snapshot === undefined || snapshot.stored !== stored) {
    snapshot = {stored, projet: parseProjet(stored)}
  }

  return snapshot.projet
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  // Keeps tabs in step when the projet changes in another one
  globalThis.addEventListener('storage', listener)

  return () => {
    listeners.delete(listener)
    globalThis.removeEventListener('storage', listener)
  }
}

export function saveProjet(projet: Projet): void {
  memory = JSON.stringify(projet)

  try {
    localStorage.setItem(storageKey, memory)
  } catch {
    // Kept in memory for this visit only
  }

  for (const listener of listeners) {
    listener()
  }
}

// The projet in progress in this parc, if any, for a loader
export function readProjet(parcId: string): Projet | undefined {
  const projet = getProjet()
  return projet?.parc === parcId ? projet : undefined
}

// The projet in progress in this parc, if any
export function useProjet(parcId: string): Projet | undefined {
  const projet = useSyncExternalStore(subscribe, getProjet)
  return projet?.parc === parcId ? projet : undefined
}
