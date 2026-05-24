import { useCallback, useMemo, useState } from 'react'
import { EMPLOYEES } from '../../data/employees'
import ChangeFieldsFilterBar from './defineChanges/ChangeFieldsFilterBar'
import ChangesTable from './defineChanges/ChangesTable'
import PropertiesSidebar from './defineChanges/PropertiesSidebar'
import { useDerivedContext } from './defineChanges/useDerivedContext'
import { getDerivationKeysForFields } from './defineChanges/fieldSchema'

const EMPTY_MANUAL_PEOPLE = {
  observers: [],
  approvers: [],
  collaborators: [],
}

/**
 * Step 2 of the Bulk Change wizard — "Define changes".
 *
 * Layout mirrors Step 1 (Select Users):
 *   • Top bar: search across the employees in the worklist + chip row of
 *     fields-to-edit + Add field
 *   • Table: rows = the employees finalized in Step 1, columns = each chosen
 *     field with an inline editor
 *   • Right rail: existing PropertiesSidebar (Lead / Observers / Approvers
 *     / Collaborators + Process) — derived from the active fields' rules.
 *
 * State:
 *   selectedFieldKeys: ordered list of field keys currently being edited
 *   bulkValues:        column-level "apply to all" defaults, keyed by fieldKey
 *   cellOverrides:     per-(empId, fieldKey) overrides that win over bulk
 *   manualPeople:      manually added observers/approvers/collaborators
 *
 * Resolution per cell:
 *   override → bulk default → current employee value
 */
export default function DefineChangesStep({ selectedEmployeeIds = [], lead }) {
  const [selectedFieldKeys, setSelectedFieldKeys] = useState([])
  const [bulkValues, setBulkValues] = useState({})
  const [cellOverrides, setCellOverrides] = useState({})
  const [search, setSearch] = useState('')
  const [manualPeople, setManualPeople] = useState(EMPTY_MANUAL_PEOPLE)

  // ── Employees in worklist ────────────────────────────────────────────────

  const employees = useMemo(() => {
    if (selectedEmployeeIds.length === 0) return []
    const idSet = new Set(selectedEmployeeIds)
    return EMPLOYEES.filter((e) => idSet.has(e.id))
  }, [selectedEmployeeIds])

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((e) =>
      `${e.fullName} ${e.title} ${e.email} ${e.department}`.toLowerCase().includes(q),
    )
  }, [employees, search])

  // ── Derived context for sidebar ──────────────────────────────────────────

  const derivationKeys = useMemo(
    () => getDerivationKeysForFields(selectedFieldKeys),
    [selectedFieldKeys],
  )
  const { observers, approvers, collaborators, steps } = useDerivedContext(
    derivationKeys,
    manualPeople,
  )

  // ── Field management ─────────────────────────────────────────────────────

  const handleAddFields = useCallback((keys) => {
    setSelectedFieldKeys((prev) => {
      const seen = new Set(prev)
      const next = [...prev]
      for (const key of keys) {
        if (!seen.has(key)) {
          next.push(key)
          seen.add(key)
        }
      }
      return next
    })
  }, [])

  const handleRemoveField = useCallback((key) => {
    setSelectedFieldKeys((prev) => prev.filter((k) => k !== key))
    setBulkValues((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    setCellOverrides((prev) => {
      let changed = false
      const next = {}
      for (const [empId, fieldMap] of Object.entries(prev)) {
        if (fieldMap && key in fieldMap) {
          const { [key]: _, ...rest } = fieldMap
          changed = true
          if (Object.keys(rest).length > 0) next[empId] = rest
        } else if (fieldMap && Object.keys(fieldMap).length > 0) {
          next[empId] = fieldMap
        }
      }
      return changed ? next : prev
    })
  }, [])

  const handleChangeBulkValue = useCallback((fieldKey, value) => {
    setBulkValues((prev) => {
      if (value === '' || value === undefined) {
        if (!(fieldKey in prev)) return prev
        const next = { ...prev }
        delete next[fieldKey]
        return next
      }
      return { ...prev, [fieldKey]: value }
    })
  }, [])

  const handleChangeCell = useCallback((empId, fieldKey, value) => {
    setCellOverrides((prev) => {
      const existing = prev[empId] ?? {}
      const next = { ...prev, [empId]: { ...existing, [fieldKey]: value } }
      return next
    })
  }, [])

  const handleResetOverrides = useCallback(() => {
    setCellOverrides({})
  }, [])

  // ── Manual people management ─────────────────────────────────────────────

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

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-6 pt-4 pb-3 border-b border-rippling-line bg-white">
          <ChangeFieldsFilterBar
            search={search}
            onSearchChange={setSearch}
            selectedFieldKeys={selectedFieldKeys}
            bulkValues={bulkValues}
            onAddFields={handleAddFields}
            onRemoveField={handleRemoveField}
            onChangeBulkValue={handleChangeBulkValue}
            employeeCount={employees.length}
          />
        </div>

        <div className="flex-1 overflow-auto p-6 bg-rippling-surface">
          <ChangesTable
            employees={filteredEmployees}
            selectedFieldKeys={selectedFieldKeys}
            bulkValues={bulkValues}
            cellOverrides={cellOverrides}
            onChangeCell={handleChangeCell}
            onRemoveField={handleRemoveField}
            onResetOverrides={handleResetOverrides}
            totalEmployees={employees.length}
            hiddenBySearchCount={employees.length - filteredEmployees.length}
          />
        </div>
      </div>

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
