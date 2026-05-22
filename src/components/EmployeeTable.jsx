import { useState, useEffect } from 'react'
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { avatarClass, initials, classNames } from '../lib/utils'

const PAGE_SIZE_OPTIONS = [10, 25, 100]

const HEADER_CELL =
  'px-3 py-2.5 text-left font-semibold text-rippling-ink-2 text-[11px] uppercase tracking-wide border-r border-rippling-line bg-rippling-surface-2'

const BODY_CELL = 'px-3 py-2.5'

const COLUMNS = [
  { key: 'name', label: 'Name', width: 'w-[260px]', sortable: true },
  { key: 'title', label: 'Title', width: 'w-[200px]', sortable: true },
  { key: 'department', label: 'Department', width: 'w-[140px]', sortable: true },
  { key: 'manager', label: 'Manager', width: 'w-[180px]', sortable: true },
  { key: 'location', label: 'Work location', width: 'w-[140px]', sortable: true },
  { key: 'employmentType', label: 'Employment type', width: 'w-[140px]', sortable: true },
  { key: 'status', label: 'Status', width: 'w-[110px]', sortable: true },
]

export default function EmployeeTable({ employees, selected, setSelected, onRowClick }) {
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const sorted = [...employees].sort((a, b) => {
    const av = (a[sortKey === 'name' ? 'fullName' : sortKey] || '').toString()
    const bv = (b[sortKey === 'name' ? 'fullName' : sortKey] || '').toString()
    const cmp = av.localeCompare(bv)
    return sortDir === 'asc' ? cmp : -cmp
  })

  const totalCount = sorted.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalCount)
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setPage(1)
  }, [employees, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function toggleAll() {
    const ids = paginated.map((e) => e.id)
    const allPageSelected = ids.length > 0 && ids.every((id) => selected.has(id))
    const next = new Set(selected)
    if (allPageSelected) {
      ids.forEach((id) => next.delete(id))
    } else {
      ids.forEach((id) => next.add(id))
    }
    setSelected(next)
  }

  function toggleOne(id) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const pageIds = paginated.map((e) => e.id)
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const someSelected = pageIds.some((id) => selected.has(id)) && !allSelected

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white border-t border-rippling-line">
      <div className="flex-1 overflow-auto">
      <table className="people-table w-full text-[13px] border-collapse">
        {/* Sticky header */}
        <thead className="sticky top-0 z-10 shadow-[0_1px_0_0_#E5E5E5,0_2px_6px_rgba(15,15,15,0.04)]">
          <tr className="border-b-2 border-rippling-line">
            <th className={classNames(HEADER_CELL, 'w-10')}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected
                }}
                onChange={toggleAll}
                className="rippling-checkbox"
              />
            </th>
            {COLUMNS.map((col, i) => (
              <th
                key={col.key}
                className={classNames(
                  col.width,
                  HEADER_CELL,
                  i === COLUMNS.length - 1 && 'border-r-0'
                )}
              >
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => handleSort(col.key)}
                    className="flex items-center gap-1 w-full hover:text-rippling-ink transition-colors group -mx-0.5"
                  >
                    <span>{col.label}</span>
                    <ArrowUpDown
                      size={11}
                      strokeWidth={2}
                      className={classNames(
                        'shrink-0 transition-opacity',
                        sortKey === col.key
                          ? 'opacity-100 text-rippling-plum'
                          : 'opacity-40 group-hover:opacity-70'
                      )}
                    />
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {paginated.map((emp) => {
            const isSelected = selected.has(emp.id)
            return (
              <tr
                key={emp.id}
                onClick={() => onRowClick?.(emp)}
                className={classNames(
                  'border-b border-rippling-line-2 data-row',
                  onRowClick && 'cursor-pointer hover:bg-rippling-surface',
                  isSelected && 'is-selected'
                )}
              >
                <td className={BODY_CELL}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOne(emp.id)}
                    onClick={(event) => event.stopPropagation()}
                    className="rippling-checkbox"
                  />
                </td>
                {/* Name with avatar */}
                <td className={BODY_CELL}>
                  <div className="flex items-center gap-2.5">
                    <div
                      className={classNames(
                        'w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0',
                        avatarClass(emp.fullName)
                      )}
                    >
                      {initials(emp.fullName)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-rippling-ink truncate">{emp.fullName}</div>
                      <div className="text-[11.5px] text-rippling-muted truncate">{emp.email}</div>
                    </div>
                  </div>
                </td>
                <td className={classNames(BODY_CELL, 'text-rippling-ink-2 truncate')}>
                  {emp.title}
                </td>
                <td className={classNames(BODY_CELL, 'text-rippling-ink-2')}>
                  {emp.department}
                </td>
                <td className={classNames(BODY_CELL, 'text-rippling-ink-2 truncate')}>
                  {emp.manager || <span className="text-rippling-muted italic">—</span>}
                </td>
                <td className={classNames(BODY_CELL, 'text-rippling-ink-2')}>
                  {emp.location}
                </td>
                <td className={classNames(BODY_CELL, 'text-rippling-ink-2')}>
                  {emp.employmentType}
                </td>
                <td className={BODY_CELL}>
                  <StatusPill status={emp.status} />
                </td>
              </tr>
            )
          })}
          {employees.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length + 1} className="px-3 py-16 text-center text-rippling-muted">
                <div className="text-[13px]">No people match your filters.</div>
                <div className="text-[12px] mt-1">Try adjusting or clearing filters.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      {totalCount > 0 && (
        <div className="flex items-center justify-end gap-5 px-5 py-2 border-t border-rippling-line-2 bg-white shrink-0">
          <label className="flex items-center gap-1.5 text-[12px] text-rippling-muted">
            <span className="sr-only">Rows per page</span>
            <span aria-hidden>Show</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                aria-label="Rows per page"
                className="h-7 appearance-none pl-2.5 pr-7 rounded-md border border-rippling-line bg-rippling-surface text-[12px] text-rippling-ink-2 font-medium cursor-pointer hover:border-rippling-ink-2/30 ui-interactive focus:outline-none focus:ring-1 focus:ring-rippling-primary/30 focus:border-rippling-primary transition-colors"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                strokeWidth={2}
                aria-hidden
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-rippling-muted"
              />
            </div>
          </label>

          <span className="text-[12px] text-rippling-muted tabular-nums">
            {startIndex}–{endIndex} of {totalCount}
          </span>

          <div className="flex items-center gap-0.5 text-[12px] text-rippling-muted">
            <PaginationButton
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1}
              label="Previous page"
            >
              <ChevronLeft size={15} strokeWidth={1.75} />
            </PaginationButton>
            <span className="min-w-[3.25rem] text-center tabular-nums px-1">
              {currentPage} / {totalPages}
            </span>
            <PaginationButton
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              label="Next page"
            >
              <ChevronRight size={15} strokeWidth={1.75} />
            </PaginationButton>
          </div>
        </div>
      )}
    </div>
  )
}

function PaginationButton({ children, onClick, disabled, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={classNames(
        'p-1 rounded text-rippling-muted',
        disabled ? 'opacity-30 cursor-not-allowed' : 'ui-interactive hover:text-rippling-ink-2'
      )}
    >
      {children}
    </button>
  )
}

function StatusPill({ status }) {
  const styles = {
    Active: 'bg-green-50 text-green-700 border-green-200',
    'On Leave': 'bg-amber-50 text-amber-700 border-amber-200',
    Onboarding: 'bg-blue-50 text-blue-700 border-blue-200',
  }
  return (
    <span
      className={classNames(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
        styles[status] || 'bg-gray-50 text-gray-700 border-gray-200'
      )}
    >
      <span
        className={classNames(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          status === 'Active' && 'bg-green-500',
          status === 'On Leave' && 'bg-amber-500',
          status === 'Onboarding' && 'bg-blue-500'
        )}
      />
      {status}
    </span>
  )
}
