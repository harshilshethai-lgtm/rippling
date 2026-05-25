import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { EMPLOYEES } from '../../data/employees'
import ChangesTable from './defineChanges/ChangesTable'
import PropertiesSidebar from './defineChanges/PropertiesSidebar'
import { getCurrentValue } from './defineChanges/currentValues'
import { useDerivedContext } from './defineChanges/useDerivedContext'

/**
 * Step 3 of the Bulk Change wizard — "Make changes".
 *
 * This page is a CSV-style edit grid. The chip strip / Add property / Paste
 * CSV controls intentionally don't live here anymore — those belong upstream
 * on Step 2 (Define change set). If the user wants to add a property they go
 * back; CSV pasting will arrive in a later iteration.
 *
 * Layout:
 *   • Top strip: employee search (left) and totals (right).
 *   • Body: ChangesTable — a spreadsheet of rows × selected fields.
 *   • Footer: keyboard shortcut chips on the left, total cell progress on
 *     the right.
 *   • Right rail: PropertiesSidebar (observers / approvers / process steps).
 *
 * Per-column resolution contract (see ChangesTable):
 *   Unique OFF (default): everyone gets the bulk value (edited from row 0).
 *   Unique ON:            override → bulk → empty.
 */
export default function MakeChangesStep({
  selectedEmployeeIds = [],
  lead,
  selectedFieldKeys,
  bulkValues,
  cellOverrides,
  uniformByField,
  manualPeople,
  effectiveDateTime,
  onEffectiveDateTimeChange,
  onChangeBulkValue,
  onChangeCell,
  onToggleUniform,
  onAddObserver,
  onRemoveObserver,
  onAddApprover,
  onRemoveApprover,
  onAddCollaborator,
  onRemoveCollaborator,
}) {
  const [search, setSearch] = useState('')

  const employees = useMemo(() => {
    if (selectedEmployeeIds.length === 0) return []
    const idSet = new Set(selectedEmployeeIds)
    return EMPLOYEES.filter((emp) => idSet.has(emp.id))
  }, [selectedEmployeeIds])

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((emp) =>
      `${emp.fullName} ${emp.title} ${emp.email} ${emp.department}`
        .toLowerCase()
        .includes(q),
    )
  }, [employees, search])

  const { observers, approvers, collaborators, steps } = useDerivedContext(
    selectedFieldKeys,
    manualPeople,
  )

  // ── Header / footer metrics ────────────────────────────────────────────
  // "Changes" counts cells that resolve to a value different from the
  // employee's current value. "Set" counts the same denominator (rows ×
  // fields) but treats _any_ non-empty resolved cell as set (matches the
  // reference design's "48 of 100 cells set" indicator).
  const { changesCount, setCount, totalCells } = useMemo(
    () =>
      computeCellMetrics({
        employees,
        selectedFieldKeys,
        bulkValues,
        cellOverrides,
        uniformByField,
      }),
    [employees, selectedFieldKeys, bulkValues, cellOverrides, uniformByField],
  )

  const setPct = totalCells > 0 ? Math.round((setCount / totalCells) * 100) : 0
  const hiddenBySearchCount = employees.length - filteredEmployees.length

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* ── Top toolbar ──────────────────────────────────────────────── */}
        <div className="px-6 pt-4 pb-3 border-b border-rippling-line bg-white">
          <div className="flex items-center gap-3">
            <div className="relative w-[300px] max-w-full">
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
                }...`}
                className="w-full h-9 pl-9 pr-3 text-[13px] rounded-md bg-rippling-surface border border-transparent placeholder:text-rippling-muted focus:outline-none focus:bg-white focus:border-rippling-line transition-colors"
              />
            </div>

            <div className="ml-auto flex items-center gap-2 text-[12.5px] text-rippling-ink-2 tabular-nums">
              <span>
                <span className="font-medium">{changesCount}</span>{' '}
                <span className="text-rippling-muted">
                  {changesCount === 1 ? 'change' : 'changes'}
                </span>
              </span>
              <span className="text-rippling-line">·</span>
              <span>
                <span className="font-medium">{employees.length}</span>{' '}
                <span className="text-rippling-muted">
                  {employees.length === 1 ? 'employee' : 'employees'}
                </span>
              </span>
              <span className="text-rippling-line">·</span>
              <span>
                <span className="font-medium">{selectedFieldKeys.length}</span>{' '}
                <span className="text-rippling-muted">
                  {selectedFieldKeys.length === 1 ? 'field' : 'fields'}
                </span>
              </span>
              {hiddenBySearchCount > 0 && (
                <>
                  <span className="text-rippling-line">·</span>
                  <span className="text-rippling-muted">
                    {hiddenBySearchCount} hidden by search
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Spreadsheet — full bleed, table owns scroll ──────────────── */}
        <div className="flex-1 min-h-0 overflow-hidden bg-white border-t border-rippling-line">
          <ChangesTable
            employees={filteredEmployees}
            selectedFieldKeys={selectedFieldKeys}
            bulkValues={bulkValues}
            cellOverrides={cellOverrides}
            uniformByField={uniformByField}
            onChangeCell={onChangeCell}
            onChangeBulkValue={onChangeBulkValue}
            onToggleUniform={onToggleUniform}
          />
        </div>

        {/* ── Footer: keyboard hints + total progress ─────────────────── */}
        <div className="h-10 px-6 border-t border-rippling-line bg-white flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-3 text-[11.5px] text-rippling-muted">
            <ShortcutHint keys={['Tab']} label="next cell" />
            <ShortcutHint keys={['↵']} label="next row" />
            <ShortcutHint keys={['Esc']} label="cancel cell" />
          </div>

          <div className="ml-auto flex items-center gap-2 min-w-[180px]">
            <div className="relative flex-1 h-1.5 rounded-full bg-rippling-line-2 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-rippling-plum rounded-full transition-[width]"
                style={{ width: `${setPct}%` }}
              />
            </div>
            <span className="text-[11.5px] text-rippling-ink-2 tabular-nums font-medium shrink-0">
              {setCount}
              <span className="text-rippling-muted font-normal">
                {' '}
                of {totalCells} cells set
              </span>
            </span>
          </div>
        </div>
      </div>

      <PropertiesSidebar
        lead={lead}
        observers={observers}
        approvers={approvers}
        collaborators={collaborators}
        steps={steps}
        effectiveDateTime={effectiveDateTime}
        onEffectiveDateTimeChange={onEffectiveDateTimeChange}
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

/* ── Keyboard shortcut chip ──────────────────────────────────────────────── */

function ShortcutHint({ keys, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded border border-rippling-line bg-white text-[10.5px] font-medium text-rippling-ink-2"
          >
            {k}
          </kbd>
        ))}
      </span>
      <span>{label}</span>
    </span>
  )
}

/* ── Cell metrics helper ─────────────────────────────────────────────────── */

function computeCellMetrics({
  employees,
  selectedFieldKeys,
  bulkValues,
  cellOverrides,
  uniformByField,
}) {
  const totalCells = employees.length * selectedFieldKeys.length
  let changesCount = 0
  let setCount = 0

  for (const fieldKey of selectedFieldKeys) {
    const mode = uniformByField?.[fieldKey] ?? 'uniform'
    const bulk = bulkValues?.[fieldKey]
    const hasBulk = bulk !== undefined && bulk !== ''

    for (const emp of employees) {
      const override = cellOverrides?.[emp.id]?.[fieldKey]
      const hasOverride = override !== undefined && override !== ''
      const resolved =
        mode === 'unique'
          ? hasOverride
            ? override
            : hasBulk
              ? bulk
              : ''
          : hasBulk
            ? bulk
            : ''
      if (resolved !== '') setCount += 1
      const current = getCurrentValue(emp, fieldKey)
      if (resolved !== '' && resolved !== current) changesCount += 1
    }
  }

  return { totalCells, changesCount, setCount }
}
