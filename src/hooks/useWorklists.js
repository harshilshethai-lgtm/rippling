import { useSyncExternalStore } from 'react'
import { getWorklists, subscribe } from '../data/worklists'

/**
 * Subscribes to the in-memory worklist store and re-renders the calling
 * component whenever entries change.
 */
export function useWorklists() {
  return useSyncExternalStore(subscribe, getWorklists, getWorklists)
}
