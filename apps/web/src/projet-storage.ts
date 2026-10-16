import type {Projet} from '@pnm/shared'
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

// The stored value comes from an earlier visit, maybe from an older version of the site
function parseProjet(stored: string | undefined): Projet | undefined {
  if (stored === undefined) {
    return undefined
  }

  try {
    const value: unknown = JSON.parse(stored)

    if (typeof value !== 'object' || value === null) {
      return undefined
    }

    const {parc, activite} = value as Record<string, unknown>
    const isProjet = typeof parc === 'string'
      && (activite === undefined || typeof activite === 'string')

    return isProjet ? {parc, activite} : undefined
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

// The projet in progress in this parc, if any
export function useProjet(parcId: string): Projet | undefined {
  const projet = useSyncExternalStore(subscribe, getProjet)
  return projet?.parc === parcId ? projet : undefined
}
