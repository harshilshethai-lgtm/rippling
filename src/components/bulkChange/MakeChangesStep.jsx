import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { EMPLOYEES } from '../../data/employees'
import ChangeFieldsFilterBar from './defineChanges/ChangeFieldsFilterBar'
import ChangesTable from './defineChanges/ChangesTable'
import PropertiesSidebar from './defineChanges/PropertiesSidebar'
import { useDerivedContext } from './defineChanges/useDerivedContext'
import { getDerivationKeysForFields } from './defineChanges/fieldSchema'

/**
 * Step 3 of the Bulk Change wizard — "Make changes".
 *
 * Now that the user has decided *which* fields to edit (Define Change Set
 * step), this page puts them in front of the actual editable table so they
 * can set values per row. The chip strip stays available at the top in a
 * compact form so they can still add/remove fields or flip mode without
 * navigating back.
 *
 * Layout:
 *   • Top strip: employee search (filters table rows) + compact composer +
 *     chips with Uniform/Unique toggles and inline value editors.
 *   • Below: the editable ChangesTable.
 *   • Right rail: PropertiesSidebar (observers/approvers/process steps)
 *     derived from the selected fields, same as the Define page.
 *
 * Value resolution per cell mirrors the original step's contract:
 *   Uniform columns: override → bulk default → current employee value
 *   Unique columns:  override → current employee value
 */
export default function MakeChangesStep({
  selectedEmployeeIds = [],
  lead,
  selectedFieldKeys,
  bulkValues,
  cellOverrides,
  uniformByField,
  manualPeople,
  onAddFields,
  onApplyTemplate,
  onRemoveField,
  onRemoveFields,
  onChangeBulkValue,
  onChangeCell,
  onToggleUniform,
  onResetOverrides,
  onAddObserver,
  onRemoveObserver,
  onAddApprover,
  onRemoveApprover,
  onAddCollaborator,
  onRemoveCollaborator,
}) {
  // Local employee search — purely a view concern, no need to lift.
  const [search, setSearch] = useState('')

  const employees = useMemo(() => {
    if (selectedEmployeeIds.length === 0) return []
    const idSet = new Set(selectedEmployeeIds)
    return EMPLOYEES.filter((e) => idSet.has(e.id))
  }, [selectedEmployeeIds])

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((e) =>
      `${e.fullName} ${e.title} ${e.email} ${e.department}`
        .toLowerCase()
        .includes(q),
    )
  }, [employees, search])

  const derivationKeys = useMemo(
    () => getDerivationKeysForFields(selectedFieldKeys),
    [selectedFieldKeys],
  )
  const { observers, approvers, collaborators, steps } = useDerivedContext(
    derivationKeys,
    manualPeople,
  )

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-6 pt-4 pb-3 border-b border-rippling-line bg-white space-y-3">
          {/* Employee search */}
          <div className="relative">
            <Search
              size={14}
              strokeWidth={1.9}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-rippling-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${employees.length} ${
                employees.length === 1 ? 'employee' : 'employees'
              } in worklist...`}
              className="w-full h-9 pl-9 pr-3 text-[13px] rounded-md bg-rippling-surface border border-transparent placeholder:text-rippling-muted focus:outline-none focus:bg-white focus:border-rippling-line transition-colors"
            />
          </div>

          {/* Compact changeset strip — chips stay actionable here so the
              user can still toggle mode / edit bulk default / add fields
              without leaving this page. */}
          <ChangeFieldsFilterBar
            selectedFieldKeys={selectedFieldKeys}
            bulkValues={bulkValues}
            uniformByField={uniformByField}
            onAddFields={onAddFields}
            onApplyTemplate={onApplyTemplate}
            onRemoveField={onRemoveField}
            onRemoveFields={onRemoveFields}
            onChangeBulkValue={onChangeBulkValue}
            onToggleUniform={onToggleUniform}
            variant="compact"
          />
        </div>

        <div className="flex-1 overflow-auto p-6 bg-rippling-surface">
          <ChangesTable
            employees={filteredEmployees}
            selectedFieldKeys={selectedFieldKeys}
            bulkValues={bulkValues}
            cellOverrides={cellOverrides}
            uniformByField={uniformByField}
            onChangeCell={onChangeCell}
            onRemoveField={onRemoveField}
            onToggleUniform={onToggleUniform}
            onResetOverrides={onResetOverrides}
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
        onAddObserver={onAddObserver}
        onRemoveObserver={onRemoveObserver}
        onAddApprover={onAddApprover}
        onRemoveApprover={onRemoveApprover}
        onAddCollaborator={onAddCollaborator}
        onRemoveCollaborator={onRemoveCollaborator}
      />
    </div>
  )
}
