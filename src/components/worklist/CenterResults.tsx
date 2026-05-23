import { Search, UsersRound } from 'lucide-react'
import { useMemo, type RefObject } from 'react'
import { avatarClass, classNames, initials } from '../../lib/utils'
import type { WorklistEmployee } from '../../mock/employees'

type Props = {
  query: string
  onQueryChange: (value: string) => void
  searchRef: RefObject<HTMLInputElement>
  view: 'list' | 'org'
  onViewChange: (view: 'list' | 'org') => void
  results: WorklistEmployee[]
  selectedIds: Set<string>
  hoveredId: string | null
  onHover: (id: string) => void
  onToggleSelection: (id: string) => void
  violationsCount: number
  onOpenViolations: () => void
  flashIds: Set<string>
}

export default function CenterResults({
  query,
  onQueryChange,
  searchRef,
  view,
  onViewChange,
  results,
  selectedIds,
  hoveredId,
  onHover,
  onToggleSelection,
  violationsCount,
  onOpenViolations,
  flashIds,
}: Props) {
  const groupedByManager = useMemo(() => {
    const grouped = new Map<string, WorklistEmployee[]>()
    for (const employee of results) {
      const key = employee.managerName
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)?.push(employee)
    }
    return [...grouped.entries()]
  }, [results])

  return (
    <section className="flex-1 min-w-0 flex flex-col bg-rippling-surface">
      <div className="h-12 border-b border-rippling-line bg-white px-4 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-[540px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rippling-muted" />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search employees..."
            className="w-full h-8 rounded-md border border-rippling-line bg-white pl-9 pr-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-rippling-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewChange('list')}
            className={classNames(
              'h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors',
              view === 'list' ? 'bg-rippling-chip text-rippling-plum' : 'text-rippling-muted ui-interactive-chip'
            )}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => onViewChange('org')}
            className={classNames(
              'h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors',
              view === 'org' ? 'bg-rippling-chip text-rippling-plum' : 'text-rippling-muted ui-interactive-chip'
            )}
          >
            Org Chart
          </button>
        </div>
      </div>

      {violationsCount > 0 && (
        <div className="mx-4 mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900 flex items-center justify-between">
          <span>{violationsCount} selection violations need review. This does not block Step 1.</span>
          <button type="button" onClick={onOpenViolations} className="text-amber-900 underline underline-offset-2 font-medium">
            Review
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {results.length === 0 ? (
          <div className="h-full rounded-lg border border-dashed border-rippling-line bg-white flex items-center justify-center text-rippling-muted text-[13px]">
            No employees match this query
          </div>
        ) : view === 'list' ? (
          <div className="bg-white rounded-lg border border-rippling-line overflow-hidden">
            <div className="grid grid-cols-[38px_1.4fr_1fr_1fr_1fr_1fr] h-9 px-3 items-center border-b border-rippling-line bg-rippling-surface text-[11px] uppercase tracking-wide text-rippling-muted font-semibold">
              <span />
              <span>Employee</span>
              <span>Title</span>
              <span>Department</span>
              <span>Manager</span>
              <span>Location</span>
            </div>
            {results.map((employee) => {
              const selected = selectedIds.has(employee.id)
              const hovered = hoveredId === employee.id
              return (
                <div
                  key={employee.id}
                  className={classNames(
                    'grid grid-cols-[38px_1.4fr_1fr_1fr_1fr_1fr] px-3 py-2 items-center border-b border-rippling-line-2 last:border-b-0 transition-colors duration-150',
                    selected ? 'bg-rippling-chip border-l-2 border-l-rippling-plum' : 'bg-white border-l-2 border-l-transparent',
                    hovered ? 'ring-1 ring-inset ring-rippling-primary/30' : '',
                    flashIds.has(employee.id) ? 'animate-pulse' : ''
                  )}
                  onMouseEnter={() => onHover(employee.id)}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleSelection(employee.id)}
                    className="rippling-checkbox"
                    aria-label={`Select ${employee.fullName}`}
                  />
                  <div className="min-w-0 flex items-center gap-2.5">
                    <div className={classNames('h-8 w-8 rounded-full text-white text-[11px] font-semibold flex items-center justify-center', avatarClass(employee.fullName))}>
                      {initials(employee.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] text-rippling-ink truncate">{employee.fullName}</p>
                      <p className="text-[11.5px] text-rippling-muted truncate">{employee.email}</p>
                    </div>
                  </div>
                  <span className="text-[12.5px] text-rippling-ink-2">{employee.title}</span>
                  <span className="text-[12.5px] text-rippling-ink-2">{employee.department}</span>
                  <span className="text-[12.5px] text-rippling-ink-2">{employee.managerName}</span>
                  <span className="text-[12.5px] text-rippling-ink-2">{employee.location}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {groupedByManager.map(([manager, reports]) => (
              <div key={manager} className="rounded-md border border-rippling-line bg-white p-3">
                <div className="flex items-center gap-2 mb-2">
                  <UsersRound size={14} className="text-rippling-muted" />
                  <p className="text-[13px] font-semibold text-rippling-ink">{manager}</p>
                  <span className="text-[11.5px] text-rippling-muted">{reports.length} reports</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {reports.map((employee) => {
                    const selected = selectedIds.has(employee.id)
                    return (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => onToggleSelection(employee.id)}
                        className={classNames(
                          'rounded-md border px-2.5 py-2 text-left transition-colors',
                          selected
                            ? 'border-rippling-plum bg-rippling-chip'
                            : 'border-rippling-line bg-white hover:border-rippling-plum/50'
                        )}
                      >
                        <p className="text-[12.5px] font-medium text-rippling-ink">{employee.fullName}</p>
                        <p className="text-[11.5px] text-rippling-muted">{employee.title}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
