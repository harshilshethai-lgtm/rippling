import { ArrowUpDown, Check } from 'lucide-react'
import type { Employee, FilterAttribute } from '../../mock/employees'
import { cn, rowCellText } from './filterStepUtils'
import { avatarClass, initials } from '../../lib/utils'

type Props = {
  filteredEmployees: Employee[]
  visibleEmployees: Employee[]
  dynamicColumns: FilterAttribute[]
  selectedIds: Set<string>
  allVisibleSelected: boolean
  allFilteredSelected: boolean
  tableFocusIndex: number
  visibleRows: number
  sortKey: 'name' | 'title' | FilterAttribute
  sortDir: 'asc' | 'desc'
  selectedInViewCount: number
  selectedOutsideViewCount: number
  onSetTableFocusIndex: (index: number) => void
  onToggleSelected: (employeeId: string) => void
  onToggleSelectAllVisible: () => void
  onSelectAllMatches: () => void
  onClearCurrentMatchSelection: () => void
  onClearSelection: () => void
  onLoadMore: () => void
  onSort: (key: 'name' | 'title' | FilterAttribute) => void
  onReviewSelection: () => void
}

const HEADER_CELL =
  'px-3 py-2.5 text-left font-semibold text-rippling-ink-2 text-[11px] uppercase tracking-wide border-r border-rippling-line bg-rippling-surface-2'

const BODY_CELL = 'px-3 py-2.5'

export default function WorklistStepResultsTable({
  filteredEmployees,
  visibleEmployees,
  dynamicColumns,
  selectedIds,
  allVisibleSelected,
  allFilteredSelected,
  tableFocusIndex,
  visibleRows,
  sortKey,
  sortDir,
  selectedInViewCount,
  selectedOutsideViewCount,
  onSetTableFocusIndex,
  onToggleSelected,
  onToggleSelectAllVisible,
  onSelectAllMatches,
  onClearCurrentMatchSelection,
  onClearSelection,
  onLoadMore,
  onSort,
  onReviewSelection,
}: Props) {
  return (
    <>
      <div className="mt-5 border-t border-rippling-line" />

      <div className="mt-4 flex items-center gap-3 text-[13px] text-rippling-ink-2">
        <span className="font-medium">{filteredEmployees.length} employees match</span>
        <button type="button" onClick={onToggleSelectAllVisible} className="text-rippling-plum hover:underline">
          {allVisibleSelected ? `Unselect visible (${visibleEmployees.length})` : `Select visible (${visibleEmployees.length})`}
        </button>
        {filteredEmployees.length > visibleEmployees.length && (
          <button type="button" onClick={onSelectAllMatches} className="text-rippling-plum hover:underline">
            Select all matches ({filteredEmployees.length})
          </button>
        )}
        <button type="button" onClick={onClearSelection} className="text-rippling-muted hover:underline">
          Clear selection
        </button>
        {selectedIds.size > 0 && (
          <span className="text-rippling-muted">
            {selectedIds.size} selected · {selectedInViewCount} in current view
            {selectedOutsideViewCount > 0 && ` · ${selectedOutsideViewCount} outside current view`}
          </span>
        )}
        {selectedOutsideViewCount > 0 && (
          <button type="button" onClick={onReviewSelection} className="text-rippling-plum hover:underline">
            Review selected
          </button>
        )}
      </div>

      {allFilteredSelected && filteredEmployees.length > visibleEmployees.length && (
        <div className="mt-2 rounded-md border border-rippling-line bg-rippling-chip px-3 py-2 text-[12.5px] text-rippling-ink-2 flex items-center justify-between">
          <span>All {filteredEmployees.length} matching employees selected.</span>
          <button type="button" onClick={onClearCurrentMatchSelection} className="text-rippling-plum hover:underline">
            Clear match selection
          </button>
        </div>
      )}

      <div className="mt-3 rounded-xl border border-rippling-line bg-white overflow-hidden">
        <div className="max-h-[560px] overflow-auto">
          <table className="people-table w-full text-[13px] border-collapse">
            <thead className="sticky top-0 z-10 shadow-[0_1px_0_0_#E5E5E5,0_2px_6px_rgba(15,15,15,0.04)]">
              <tr className="border-b-2 border-rippling-line">
                <th className={cn(HEADER_CELL, 'w-10')}>
                  <button
                    type="button"
                    onClick={onToggleSelectAllVisible}
                    className={cn(
                      'h-4 w-4 rounded border flex items-center justify-center',
                      allVisibleSelected ? 'bg-rippling-primary border-rippling-primary text-white' : 'border-rippling-line bg-white',
                    )}
                    aria-label="Toggle all visible rows"
                  >
                    {allVisibleSelected && <Check size={12} />}
                  </button>
                </th>
                <th className={cn(HEADER_CELL, 'min-w-[260px]')}>
                  <button
                    type="button"
                    onClick={() => onSort('name')}
                    className="flex items-center gap-1 w-full hover:text-rippling-ink transition-colors group"
                  >
                    <span>Name</span>
                    <ArrowUpDown
                      size={11}
                      strokeWidth={2}
                      className={cn(
                        'shrink-0 transition-opacity',
                        sortKey === 'name'
                          ? 'opacity-100 text-rippling-plum'
                          : 'opacity-40 group-hover:opacity-70',
                      )}
                    />
                    {sortKey === 'name' && (
                      <span className="text-[10px] text-rippling-plum">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className={cn(HEADER_CELL, 'min-w-[210px]')}>
                  <button
                    type="button"
                    onClick={() => onSort('title')}
                    className="flex items-center gap-1 w-full hover:text-rippling-ink transition-colors group"
                  >
                    <span>Title</span>
                    <ArrowUpDown
                      size={11}
                      strokeWidth={2}
                      className={cn(
                        'shrink-0 transition-opacity',
                        sortKey === 'title'
                          ? 'opacity-100 text-rippling-plum'
                          : 'opacity-40 group-hover:opacity-70',
                      )}
                    />
                    {sortKey === 'title' && (
                      <span className="text-[10px] text-rippling-plum">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                {dynamicColumns.map((column, index) => (
                  <th
                    key={column}
                    className={cn(
                      HEADER_CELL,
                      'min-w-[130px]',
                      index === dynamicColumns.length - 1 && 'border-r-0',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSort(column)}
                      className="flex items-center gap-1 w-full hover:text-rippling-ink transition-colors group"
                    >
                      <span>{column}</span>
                      <ArrowUpDown
                        size={11}
                        strokeWidth={2}
                        className={cn(
                          'shrink-0 transition-opacity',
                          sortKey === column
                            ? 'opacity-100 text-rippling-plum'
                            : 'opacity-40 group-hover:opacity-70',
                        )}
                      />
                      {sortKey === column && (
                        <span className="text-[10px] text-rippling-plum">{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {visibleEmployees.map((employee, index) => {
                const selected = selectedIds.has(employee.id)
                const focused = index === tableFocusIndex
                return (
                  <tr
                    key={employee.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onSetTableFocusIndex(index)
                      onToggleSelected(employee.id)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') onToggleSelected(employee.id)
                    }}
                    className={cn(
                      'border-b border-rippling-line-2 data-row cursor-pointer',
                      selected && 'is-selected',
                      focused && 'ring-1 ring-inset ring-rippling-primary/25',
                    )}
                  >
                    <td className={BODY_CELL}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onToggleSelected(employee.id)
                        }}
                        className={cn(
                          'h-4 w-4 rounded border flex items-center justify-center',
                          selected ? 'bg-rippling-primary border-rippling-primary text-white' : 'border-rippling-line bg-white',
                        )}
                      >
                        {selected && <Check size={12} />}
                      </button>
                    </td>
                    <td className={BODY_CELL}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0',
                            avatarClass(employee.name),
                          )}
                        >
                          {initials(employee.name)}
                        </div>
                        <span className="font-medium text-rippling-ink truncate">{employee.name}</span>
                      </div>
                    </td>
                    <td className={cn(BODY_CELL, 'text-rippling-ink-2 truncate')}>{employee.title}</td>
                    {dynamicColumns.map((column) => (
                      <td key={`${employee.id}-${column}`} className={cn(BODY_CELL, 'text-rippling-ink-2')}>
                        {rowCellText(employee, column)}
                      </td>
                    ))}
                  </tr>
                )
              })}
              {visibleEmployees.length === 0 && (
                <tr>
                  <td colSpan={dynamicColumns.length + 3} className="px-3 py-16 text-center text-rippling-muted">
                    <div className="text-[13px]">No employees match these filters.</div>
                    <div className="text-[12px] mt-1">Try adjusting or clearing filters.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredEmployees.length > visibleRows && (
        <div className="mt-2 text-[12.5px] text-rippling-muted flex items-center gap-3">
          <span>
            Showing {visibleRows} of {filteredEmployees.length}
          </span>
          <button type="button" onClick={onLoadMore} className="text-rippling-plum hover:underline">
            Load more
          </button>
        </div>
      )}
    </>
  )
}
