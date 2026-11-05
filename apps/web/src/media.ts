import {useSyncExternalStore} from 'react'

// From the lg breakpoint of the DSFR, where its columns sit side by side
const wideQuery = '(min-width: 62em)'

function subscribe(onChange: () => void): () => void {
  const query = globalThis.matchMedia(wideQuery)
  query.addEventListener('change', onChange)
  return () => {
    query.removeEventListener('change', onChange)
  }
}

export function useIsWide(): boolean {
  return useSyncExternalStore(subscribe, () => globalThis.matchMedia(wideQuery).matches)
}
