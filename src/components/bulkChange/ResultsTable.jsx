import { useMemo } from 'react'
import { AtSign, Filter as FilterIcon, FileUp, X } from 'lucide-react'
import { avatarClass, classNames, initials } from '../../lib/utils'
import { FILTER_SCHEMA, formatStartDate } from './bulkChangeUtils'

const HEADER_CELL =
  'px-3 py-2.5 text-left font-semibold text-rippling-ink-2 text-[11px] uppercase tracking-wide border-r border-rippling-line bg-rippling-surface-2'
const BODY_CELL = 'px-3 py-2.5'

function SourceChip({ sources }) {
  const isMention = sources.includes('mention')
  const isFilter = sources.includes('filter')
  const isCsv = sources.includes('csv')

  // Tag order in label is intentionally fixed (Mention → CSV Import → Filter)
  // so combinations always render the same way.
  if (isCsv) {
    const tail = []
    if (isMention) tail.push('Mention')
    if (isFilter) tail.push('Filter')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-violet-50 text-violet-700 border border-violet-200">
        <FileUp size={10} strokeWidth={2} />
        <span>CSV Import{tail.length > 0 ? ` · ${tail.join(' · ')}` : ''}</span>
      </span>
    )
  }
  if (isMention && isFilter) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-rippling-chip text-rippling-plum">
        <AtSign size={10} strokeWidth={2} />
        <span>Mention · Filter</span>
      </span>
    )
  }
  if (isMention) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-white border border-rippling-line text-rippling-ink-2">
        <AtSign size={10} strokeWidth={2} />
        <span>Mention</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-rippling-chip text-rippling-plum">
      <FilterIcon size={10} strokeWidth={2} />
      <span>Filter</span>
    </span>
  )
}

export default function ResultsTable({
  entries,
  dynamicColumns,
  selectedIds,
  poolSize,
  filterMatchCount,
  mentionedCount,
  csvImportCount = 0,
  hiddenBySearchCount,
  onToggleRow,
  onSelectAll,
  onUnselectAll,
  onRemoveMention,
  onRemoveManualSignals,
}) {
  const selectedInView = useMemo(
    () => entries.reduce((count, { employee }) => (selectedIds.has(employee.id) ? count + 1 : count), 0),
    [entries, selectedIds],
  )
  const allVisibleSelected = entries.length > 0 && selectedInView === entries.length
  const someVisibleSelected = selectedInView > 0 && !allVisibleSelected

  function handleHeaderToggle() {
    if (allVisibleSelected) {
      onUnselectAll?.()
    } else {
      onSelectAll?.()
    }
  }

  return (
    <div className="bg-white border border-rippling-line rounded-lg overflow-hidden">
      <div className="h-10 px-3 border-b border-rippling-line-2 bg-white flex items-center gap-3 text-[12.5px]">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            ref={(el) => {
              if (el) el.indeterminate = someVisibleSelected
            }}
            onChange={handleHeaderToggle}
            className="rippling-checkbox"
            aria-label={allVisibleSelected ? 'Unselect all' : 'Select all'}
          />
          <span className="text-rippling-ink-2 font-medium tabular-nums">
            {selectedIds.size} of {poolSize} selected
          </span>
        </div>

        <div className="flex items-center gap-2 text-[12px]">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={selectedIds.size === poolSize}
            className={classNames(
              'h-6 px-1.5 rounded transition-colors',
              selectedIds.size === poolSize
                ? 'text-rippling-muted/60 cursor-not-allowed'
                : 'text-rippling-plum hover:underline',
            )}
          >
            Select all
          </button>
          <span className="text-rippling-muted">·</span>
          <button
            type="button"
            onClick={onUnselectAll}
            disabled={selectedIds.size === 0}
            className={classNames(
              'h-6 px-1.5 rounded transition-colors',
              selectedIds.size === 0
                ? 'text-rippling-muted/60 cursor-not-allowed'
                : 'text-rippling-plum hover:underline',
            )}
          >
            Unselect all
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2 text-[11.5px] text-rippling-muted tabular-nums">
          <span>
            {poolSize} {poolSize === 1 ? 'candidate' : 'candidates'}
          </span>
          {filterMatchCount > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>{filterMatchCount} from filters</span>
            </>
          )}
          {csvImportCount > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-0.5">
                {csvImportCount} from CSV
                <FileUp size={10} strokeWidth={2} />
              </span>
            </>
          )}
          {mentionedCount > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-0.5">
                {mentionedCount}
                <AtSign size={10} strokeWidth={2} />
              </span>
            </>
          )}
          {hiddenBySearchCount > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>{hiddenBySearchCount} hidden by search</span>
            </>
          )}
        </div>
      </div>

      <div className="max-h-[560px] overflow-auto">
        <table className="people-table w-full text-[13px] border-collapse">
          <thead className="sticky top-0 z-10 shadow-[0_1px_0_0_#E5E5E5,0_2px_6px_rgba(15,15,15,0.04)]">
            <tr className="border-b-2 border-rippling-line">
              <th className={classNames(HEADER_CELL, 'w-10')}>
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someVisibleSelected
                  }}
                  onChange={handleHeaderToggle}
                  className="rippling-checkbox"
                  aria-label={allVisibleSelected ? 'Unselect all visible' : 'Select all visible'}
                />
              </th>
              <th className={classNames(HEADER_CELL, 'min-w-[260px]')}>Name</th>
              <th className={classNames(HEADER_CELL, 'min-w-[200px]')}>Title</th>
              {dynamicColumns.map((column) => (
                <th key={column} className={classNames(HEADER_CELL, 'min-w-[150px]')}>
                  {column}
                </th>
              ))}
              <th className={classNames(HEADER_CELL, 'min-w-[140px]')}>Source</th>
              <th className={classNames(HEADER_CELL, 'w-10 border-r-0')} aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="bg-white">
            {entries.map(({ employee, sources }) => {
              const isMention = sources.includes('mention')
              const isCsv = sources.includes('csv')
              const hasManualSignal = isMention || isCsv
              const isSelected = selectedIds.has(employee.id)
              const removeLabel = isMention && isCsv
                ? 'mention and CSV import'
                : isMention
                  ? 'mention'
                  : 'CSV import'
              return (
                <tr
                  key={employee.id}
                  onClick={() => onToggleRow?.(employee.id)}
                  className={classNames(
                    'border-b border-rippling-line-2 data-row cursor-pointer',
                    isSelected && 'is-selected',
                  )}
                >
                  <td className={BODY_CELL} onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleRow?.(employee.id)}
                      className="rippling-checkbox"
                      aria-label={`${isSelected ? 'Unselect' : 'Select'} ${employee.fullName}`}
                    />
                  </td>
                  <td className={BODY_CELL}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={classNames(
                          'w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0',
                          avatarClass(employee.fullName),
                        )}
                      >
                        {initials(employee.fullName)}
                      </div>
                      <span className="font-medium text-rippling-ink truncate">
                        {employee.fullName}
                      </span>
                    </div>
                  </td>
                  <td className={classNames(BODY_CELL, 'text-rippling-ink-2 truncate')}>
                    {employee.title}
                  </td>
                  {dynamicColumns.map((column) => {
                    const schema = FILTER_SCHEMA[column]
                    const rawValue = schema?.field ? employee[schema.field] : ''
                    const display =
                      schema?.kind === 'date_range' ? formatStartDate(rawValue) : rawValue
                    return (
                      <td
                        key={`${employee.id}-${column}`}
                        className={classNames(BODY_CELL, 'text-rippling-ink-2')}
                      >
                        {display || <span className="text-rippling-muted italic">—</span>}
                      </td>
                    )
                  })}
                  <td className={BODY_CELL}>
                    <SourceChip sources={sources} />
                  </td>
                  <td
                    className={classNames(BODY_CELL, 'text-right')}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {hasManualSignal ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onRemoveManualSignals) {
                            onRemoveManualSignals(employee.id)
                          } else if (isMention) {
                            onRemoveMention?.(employee.id)
                          }
                        }}
                        className="h-7 w-7 rounded-md ui-interactive flex items-center justify-center text-rippling-muted hover:text-rippling-ink"
                        aria-label={`Remove ${employee.fullName}'s ${removeLabel} from worklist`}
                        title={`Remove ${removeLabel} from worklist`}
                      >
                        <X size={13} strokeWidth={2} />
                      </button>
                    ) : null}
                  </td>
                </tr>
              )
            })}
            {entries.length === 0 && (
              <tr>
                <td
                  colSpan={dynamicColumns.length + 5}
                  className="px-3 py-16 text-center text-rippling-muted"
                >
                  <div className="text-[13px]">No employees match in current scope.</div>
                  <div className="text-[12px] mt-1">Adjust your filters or mention someone.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
