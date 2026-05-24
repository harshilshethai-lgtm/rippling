import { useCallback, useState } from 'react'
import ChangeFieldsCanvas from './defineChanges/ChangeFieldsCanvas'
import PropertiesSidebar from './defineChanges/PropertiesSidebar'
import { useDerivedContext } from './defineChanges/useDerivedContext'

const EMPTY_MANUAL_PEOPLE = {
  observers: [],
  approvers: [],
  collaborators: [],
}

/**
 * Step 2 of the Bulk Change wizard — "Define changes".
 *
 * Owns:
 *   - selectedFieldKeys  (Set<string>) which fields are being changed
 *   - manualPeople       observers/approvers/collaborators added manually
 *
 * Derives via useDerivedContext:
 *   - auto observers/approvers from derivation rules
 *   - process steps
 */
export default function DefineChangesStep({ selectedEmployeeIds = [], worklistName, lead }) {
  const [selectedFieldKeys, setSelectedFieldKeys] = useState(new Set())
  const [manualPeople, setManualPeople] = useState(EMPTY_MANUAL_PEOPLE)

  const { observers, approvers, collaborators, steps } = useDerivedContext(
    [...selectedFieldKeys],
    manualPeople,
  )

  // ── Field management ──────────────────────────────────────────────────────

  const handleAddField = useCallback((key) => {
    setSelectedFieldKeys((prev) => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }, [])

  const handleRemoveField = useCallback((key) => {
    setSelectedFieldKeys((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }, [])

  // ── Manual people management ──────────────────────────────────────────────

  function addPerson(role, person) {
    setManualPeople((prev) => ({
      ...prev,
      [role]: [...(prev[role] ?? []), person],
    }))
  }

  function removePerson(role, id) {
    setManualPeople((prev) => ({
      ...prev,
      [role]: (prev[role] ?? []).filter((p) => p.id !== id),
    }))
  }

  const handleAddObserver = useCallback((p) => addPerson('observers', p), [])
  const handleRemoveObserver = useCallback((id) => removePerson('observers', id), [])
  const handleAddApprover = useCallback((p) => addPerson('approvers', p), [])
  const handleRemoveApprover = useCallback((id) => removePerson('approvers', id), [])
  const handleAddCollaborator = useCallback((p) => addPerson('collaborators', p), [])
  const handleRemoveCollaborator = useCallback((id) => removePerson('collaborators', id), [])

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">
      <ChangeFieldsCanvas
        selectedKeys={selectedFieldKeys}
        onAddField={handleAddField}
        onRemoveField={handleRemoveField}
        employeeCount={selectedEmployeeIds.length}
      />

      <PropertiesSidebar
        lead={lead}
        observers={observers}
        approvers={approvers}
        collaborators={collaborators}
        steps={steps}
        onAddObserver={handleAddObserver}
        onRemoveObserver={handleRemoveObserver}
        onAddApprover={handleAddApprover}
        onRemoveApprover={handleRemoveApprover}
        onAddCollaborator={handleAddCollaborator}
        onRemoveCollaborator={handleRemoveCollaborator}
      />
    </div>
  )
}
