import { useMemo } from 'react'
import { getDerivedPeople, getDerivedSteps } from './derivationRules'

/**
 * Merges auto-derived and manually-added people into a single context object
 * consumed by the sidebar panels.
 *
 * Now accepts raw `selectedFieldKeys` directly — derivation rule resolution
 * happens inside getDerivedPeople/getDerivedSteps so callers don't need to
 * pre-compute rule keys.
 *
 * @param {string[]} selectedFieldKeys  – keys of fields currently on the canvas
 * @param {object}   manualPeople       – { observers: Person[], approvers: Person[], collaborators: Person[] }
 *
 * @returns {{
 *   observers:     PersonRow[],
 *   approvers:     PersonRow[],
 *   collaborators: PersonRow[],
 *   steps:         Step[],
 * }}
 * PersonRow adds `source: 'auto' | 'manual'` and `sources: string[]` (field
 * keys that caused auto-inclusion) so the UI can render "via {Field}" chips.
 */
export function useDerivedContext(selectedFieldKeys, manualPeople) {
  const derived = useMemo(
    () => getDerivedPeople(selectedFieldKeys),
    [selectedFieldKeys],
  )

  const steps = useMemo(
    () => getDerivedSteps(selectedFieldKeys),
    [selectedFieldKeys],
  )

  const observers = useMemo(() => {
    const autoRows = derived.observers.map((p) => ({ ...p, source: 'auto' }))
    const manualRows = (manualPeople.observers ?? []).map((p) => ({
      ...p,
      source: 'manual',
      sources: [],
    }))
    return mergePeople(autoRows, manualRows)
  }, [derived.observers, manualPeople.observers])

  const approvers = useMemo(() => {
    const autoRows = derived.approvers.map((p) => ({ ...p, source: 'auto' }))
    const manualRows = (manualPeople.approvers ?? []).map((p) => ({
      ...p,
      source: 'manual',
      sources: [],
    }))
    return mergePeople(autoRows, manualRows)
  }, [derived.approvers, manualPeople.approvers])

  const collaborators = useMemo(
    () =>
      (manualPeople.collaborators ?? []).map((p) => ({
        ...p,
        source: 'manual',
        sources: [],
      })),
    [manualPeople.collaborators],
  )

  return { observers, approvers, collaborators, steps }
}

/**
 * Puts auto rows first, then manual rows, deduped by id. A person added
 * manually who is also auto-derived shows only once (as auto — non-removable).
 */
function mergePeople(autoRows, manualRows) {
  const seen = new Set(autoRows.map((p) => p.id))
  const extras = manualRows.filter((p) => !seen.has(p.id))
  return [...autoRows, ...extras]
}
