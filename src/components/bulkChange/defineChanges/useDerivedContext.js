import { useMemo } from 'react'
import { getDerivedPeople, getDerivedSteps } from './derivationRules'

/**
 * Merges auto-derived and manually-added people into a single context object
 * consumed by the sidebar panels.
 *
 * @param {string[]} selectedFieldKeys  – keys of fields currently added to the canvas
 * @param {object}   manualPeople       – { observers: Person[], approvers: Person[], collaborators: Person[] }
 *                                        Each person: { id, name, role }
 *
 * @returns {{
 *   observers:     PersonRow[],
 *   approvers:     PersonRow[],
 *   collaborators: PersonRow[],
 *   steps:         Step[],
 * }}
 * PersonRow adds `source: 'auto' | 'manual'` so the UI can block removal on auto rows.
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
    const manualRows = (manualPeople.observers ?? []).map((p) => ({ ...p, source: 'manual' }))
    return mergePeople(autoRows, manualRows)
  }, [derived.observers, manualPeople.observers])

  const approvers = useMemo(() => {
    const autoRows = derived.approvers.map((p) => ({ ...p, source: 'auto' }))
    const manualRows = (manualPeople.approvers ?? []).map((p) => ({ ...p, source: 'manual' }))
    return mergePeople(autoRows, manualRows)
  }, [derived.approvers, manualPeople.approvers])

  const collaborators = useMemo(
    () => (manualPeople.collaborators ?? []).map((p) => ({ ...p, source: 'manual' })),
    [manualPeople.collaborators],
  )

  return { observers, approvers, collaborators, steps }
}

/**
 * Puts auto rows first, then manual rows, deduped by id so that a person
 * added manually who is also auto-derived shows only once (as auto, since
 * auto rows are non-removable by policy).
 */
function mergePeople(autoRows, manualRows) {
  const seen = new Set(autoRows.map((p) => p.id))
  const extras = manualRows.filter((p) => !seen.has(p.id))
  return [...autoRows, ...extras]
}
