import { useMemo, useState } from 'react'
import { ArrowLeft, Filter, Layers, Search, UserPlus, X } from 'lucide-react'
import FilterPanel from './FilterPanel'
import { EMPLOYEES } from '../data/employees'
import { avatarClass, classNames, initials } from '../lib/utils'

const EMPTY_FILTERS = {
  department: [],
  location: [],
  manager: [],
  employmentType: [],
  status: [],
}

function applyEmployeeFilters(employees, search, filters) {
  return employees.filter((emp) => {
    if (search.trim()) {
      const q = search.toLowerCase()
      const haystack = [emp.fullName, emp.email, emp.title, emp.manager, emp.department]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }

    if (filters.department.length && !filters.department.includes(emp.department)) return false
    if (filters.location.length && !filters.location.includes(emp.location)) return false
    if (filters.manager.length && !filters.manager.includes(emp.manager)) return false
    if (filters.employmentType.length && !filters.employmentType.includes(emp.employmentType)) return false
    if (filters.status.length && !filters.status.includes(emp.status)) return false
    return true
  })
}

function matchReasons(employee, search, filters) {
  const reasons = []
  const trimmedSearch = search.trim()

  if (trimmedSearch) reasons.push(`Search: "${trimmedSearch}"`)
  if (filters.department.includes(employee.department)) reasons.push(`Department: ${employee.department}`)
  if (filters.location.includes(employee.location)) reasons.push(`Location: ${employee.location}`)
  if (filters.manager.includes(employee.manager)) reasons.push(`Manager: ${employee.manager}`)
  if (filters.employmentType.includes(employee.employmentType)) {
    reasons.push(`Employment: ${employee.employmentType}`)
  }
  if (filters.status.includes(employee.status)) reasons.push(`Status: ${employee.status}`)

  return reasons.length ? reasons : ['Manual selection']
}

function sourceLabel(source) {
  if (source === 'filter') return 'Filter'
  return 'Search'
}

export default function BulkChangePage({
  onNavigate,
  initialEmployeeIds = [],
  initialFilters = EMPTY_FILTERS,
  initialSearch = '',
}) {
  const [search, setSearch] = useState(initialSearch)
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, ...initialFilters })
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [worklist, setWorklist] = useState(() =>
    initialEmployeeIds
      .map((id) => EMPLOYEES.find((employee) => employee.id === id))
      .filter(Boolean)
      .map((employee) => ({
        id: employee.id,
        source: 'search',
        reasons: ['From selected rows on People page'],
      }))
  )

  const filteredEmployees = useMemo(
    () => applyEmployeeFilters(EMPLOYEES, search, filters),
    [search, filters]
  )
  const activeFilterCount = Object.values(filters).reduce((sum, list) => sum + list.length, 0)
  const worklistIds = useMemo(() => new Set(worklist.map((item) => item.id)), [worklist])
  const searchMatches = useMemo(() => filteredEmployees.slice(0, 6), [filteredEmployees])

  const worklistEntries = useMemo(
    () =>
      worklist
        .map((entry) => ({
          ...entry,
          employee: EMPLOYEES.find((employee) => employee.id === entry.id),
        }))
        .filter((entry) => entry.employee),
    [worklist]
  )

  function addEmployeeToWorklist(employee, source) {
    if (!employee || worklistIds.has(employee.id)) return
    setWorklist((prev) => [
      ...prev,
      {
        id: employee.id,
        source,
        reasons: matchReasons(employee, search, filters),
      },
    ])
  }

  function addFilteredEmployees() {
    const nextEntries = filteredEmployees
      .filter((employee) => !worklistIds.has(employee.id))
      .map((employee) => ({
        id: employee.id,
        source: 'filter',
        reasons: matchReasons(employee, search, filters),
      }))

    if (nextEntries.length === 0) return
    setWorklist((prev) => [...prev, ...nextEntries])
  }

  function removeFromWorklist(employeeId) {
    setWorklist((prev) => prev.filter((entry) => entry.id !== employeeId))
  }

  function clearWorklist() {
    setWorklist([])
  }

  const addableFilteredCount = filteredEmployees.filter((employee) => !worklistIds.has(employee.id)).length

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col bg-white">
        <header className="border-b border-rippling-line px-5 pt-5 pb-4">
          <button
            type="button"
            onClick={() => onNavigate({ name: 'list' })}
            className="mb-3 h-7 px-2 rounded-md text-[12.5px] text-rippling-muted ui-interactive-chip hover:text-rippling-ink flex items-center gap-1.5"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            <span>Back to People</span>
          </button>

          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-[22px] font-semibold text-rippling-ink tracking-tight">Bulk Changes</h1>
              <p className="text-[13px] text-rippling-muted mt-0.5">
                Build a worklist by searching employees or applying filters.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rippling-surface-2 text-[12.5px] font-medium text-rippling-ink tabular-nums">
              {worklistEntries.length} selected
            </span>
          </div>

          <div className="mt-4 flex items-start gap-2">
            <div className="relative flex-1 max-w-md">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-rippling-muted"
                strokeWidth={1.75}
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employees to add..."
                className="w-full h-8 bg-white border border-rippling-line rounded-md pl-9 pr-3 text-[13px] placeholder:text-rippling-muted focus:outline-none focus:ring-1 focus:ring-rippling-primary focus:border-rippling-primary transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={() => setFilterPanelOpen(true)}
              className={classNames(
                'h-8 px-3 rounded-md border text-[13px] flex items-center gap-1.5 font-medium transition-colors',
                activeFilterCount > 0
                  ? 'border-rippling-plum/40 bg-rippling-chip text-rippling-plum ui-interactive-chip'
                  : 'border-rippling-line text-rippling-ink-2 ui-interactive hover:border-rippling-ink-2/20'
              )}
            >
              <Filter size={13} strokeWidth={2} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="ml-0.5 bg-rippling-plum text-white text-[10.5px] font-semibold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={addFilteredEmployees}
              disabled={addableFilteredCount === 0}
              className={classNames(
                'h-8 px-3 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors',
                addableFilteredCount > 0
                  ? 'bg-rippling-plum text-white hover:bg-rippling-plum-hover'
                  : 'bg-rippling-surface-2 text-rippling-muted cursor-not-allowed'
              )}
            >
              <UserPlus size={13} strokeWidth={2} />
              <span>Add filtered ({addableFilteredCount})</span>
            </button>
          </div>

          {search.trim() && (
            <div className="mt-2 max-w-md rounded-md border border-rippling-line bg-white">
              {searchMatches.length > 0 ? (
                searchMatches.map((employee) => {
                  const isAdded = worklistIds.has(employee.id)
                  return (
                    <div
                      key={employee.id}
                      className="h-10 px-3 border-b border-rippling-line-2 last:border-b-0 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] text-rippling-ink truncate">{employee.fullName}</p>
                        <p className="text-[11.5px] text-rippling-muted truncate">{employee.title}</p>
                      </div>
                      <button
                        type="button"
                        disabled={isAdded}
                        onClick={() => addEmployeeToWorklist(employee, 'search')}
                        className={classNames(
                          'h-6 px-2 rounded text-[12px] font-medium transition-colors',
                          isAdded
                            ? 'bg-rippling-surface-2 text-rippling-muted cursor-not-allowed'
                            : 'bg-rippling-chip text-rippling-plum hover:bg-rippling-chip-elevated'
                        )}
                      >
                        {isAdded ? 'Added' : 'Add'}
                      </button>
                    </div>
                  )
                })
              ) : (
                <p className="px-3 py-2 text-[12.5px] text-rippling-muted">No employees match this search.</p>
              )}
            </div>
          )}
        </header>

        <section className="flex-1 overflow-auto p-5 bg-rippling-surface">
          {worklistEntries.length === 0 ? (
            <div className="h-full min-h-[320px] border border-dashed border-rippling-line rounded-lg bg-white flex flex-col items-center justify-center text-center px-6">
              <div className="h-10 w-10 rounded-full bg-rippling-chip text-rippling-plum flex items-center justify-center mb-3">
                <Layers size={18} strokeWidth={2} />
              </div>
              <h2 className="text-[16px] font-semibold text-rippling-ink">Select employees to begin</h2>
              <p className="mt-1 text-[13px] text-rippling-muted max-w-[460px]">
                Use search or filters above to add employees to your bulk-change worklist. The list will populate as
                you make selections.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-rippling-line rounded-md overflow-hidden">
              <div className="h-10 px-4 border-b border-rippling-line bg-rippling-surface-2 grid grid-cols-[1.5fr_1fr_1fr_120px_140px_44px] items-center gap-3">
                <span className="text-[11px] uppercase tracking-wide font-semibold text-rippling-ink-2">Employee</span>
                <span className="text-[11px] uppercase tracking-wide font-semibold text-rippling-ink-2">Department</span>
                <span className="text-[11px] uppercase tracking-wide font-semibold text-rippling-ink-2">Title</span>
                <span className="text-[11px] uppercase tracking-wide font-semibold text-rippling-ink-2">Filter type</span>
                <span className="text-[11px] uppercase tracking-wide font-semibold text-rippling-ink-2">Matched by</span>
                <span />
              </div>

              {worklistEntries.map(({ employee, source, reasons }) => (
                <div
                  key={employee.id}
                  className="px-4 py-3 border-b border-rippling-line-2 last:border-b-0 grid grid-cols-[1.5fr_1fr_1fr_120px_140px_44px] items-start gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={classNames(
                        'w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0',
                        avatarClass(employee.fullName)
                      )}
                    >
                      {initials(employee.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-rippling-ink truncate">{employee.fullName}</p>
                      <p className="text-[11.5px] text-rippling-muted truncate">{employee.email}</p>
                    </div>
                  </div>

                  <p className="text-[13px] text-rippling-ink-2">{employee.department}</p>
                  <p className="text-[13px] text-rippling-ink-2">{employee.title}</p>
                  <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rippling-chip text-rippling-plum">
                    {sourceLabel(source)}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {reasons.slice(0, 2).map((reason) => (
                      <span
                        key={reason}
                        className="inline-flex items-center px-1.5 py-0.5 rounded bg-rippling-surface-2 text-[10.5px] text-rippling-muted"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromWorklist(employee.id)}
                    className="h-7 w-7 rounded-md ui-interactive flex items-center justify-center text-rippling-muted hover:text-rippling-ink"
                    aria-label={`Remove ${employee.fullName} from worklist`}
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                </div>
              ))}

              <div className="h-11 px-4 border-t border-rippling-line bg-white flex items-center justify-between">
                <p className="text-[12.5px] text-rippling-muted tabular-nums">
                  {worklistEntries.length} {worklistEntries.length === 1 ? 'employee' : 'employees'} in worklist
                </p>
                <button
                  type="button"
                  onClick={clearWorklist}
                  className="text-[12.5px] text-rippling-muted hover:text-rippling-ink font-medium"
                >
                  Clear worklist
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <FilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={filters}
        setFilters={setFilters}
      />
    </>
  )
}
