import { useCallback, useMemo, useRef, useState } from 'react'
import { ArrowRight, ChevronDown, Search, User } from 'lucide-react'
import { avatarClass, classNames, initials } from '../../../lib/utils'
import { FIELDS_BY_KEY } from './fieldSchema'
import { getCurrentValue } from './currentValues'
import { PERSON_FIELD_KEYS, getOptionsFor } from './fieldEditors'
import MemberPickerPopover from './MemberPickerPopover'
import OptionPickerPopover from './OptionPickerPopover'

/**
 * Bulk-change spreadsheet — CSV-style edit grid.
 *
 * Column behaviour per mode:
 *   Uniform (default): row 0 hosts the editable input; all other rows show
 *     the bulk value as a discoloured "inherited" display. Editing row 0
 *     writes to bulkValues[fieldKey].
 *   Unique: every row has its own input bound to cellOverrides[empId][fieldKey].
 *     On toggle uniform→unique, BulkChangePage seeds every employee's override
 *     with the bulk value so no row starts empty.
 *
 * Cell inputs:
 *   person-field (search-select, person keys) → MemberPickerPopover
 *   other search-select                       → OptionPickerPopover
 *   select                                    → native <select>
 *   everything else                           → <input>
 *
 * Keyboard:
 *   Tab / Shift+Tab — DOM order through editable inputs.
 *   Enter           — jump to next editable cell in column (wrap to next col).
 *   Esc             — blur current cell.
 */
export default function ChangesTable({
  employees,
  selectedFieldKeys,
  bulkValues,
  cellOverrides,
  uniformByField,
  onChangeCell,
  onChangeBulkValue,
  onToggleUniform,
}) {
  const tableRef = useRef(null)

  const visibleFields = useMemo(
    () => selectedFieldKeys.map((key) => FIELDS_BY_KEY.get(key)).filter(Boolean),
    [selectedFieldKeys],
  )

  const focusCell = useCallback((rowIdx, colIdx) => {
    if (!tableRef.current) return false
    const el = tableRef.current.querySelector(
      `[data-cell-row="${rowIdx}"][data-cell-col="${colIdx}"] [data-editable="true"]`,
    )
    if (!el) return false
    el.focus()
    try { el.select?.() } catch { /* non-text inputs */ }
    return true
  }, [])

  const handleEnter = useCallback(
    (rowIdx, colIdx) => {
      for (let r = rowIdx + 1; r < employees.length; r++) {
        if (focusCell(r, colIdx)) return
      }
      const nextCol = colIdx + 1
      if (nextCol < visibleFields.length) {
        for (let r = 0; r < employees.length; r++) {
          if (focusCell(r, nextCol)) return
        }
      }
    },
    [employees.length, visibleFields.length, focusCell],
  )

  return (
    <div ref={tableRef} className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead className="sticky top-0 z-20">
            <tr>
              {/* Employee column header */}
              <th
                className={classNames(
                  'sticky left-0 z-30 bg-rippling-surface-2 border-b-2 border-r border-rippling-line',
                  'px-3 py-2.5 text-left text-[11px] uppercase tracking-wide font-semibold text-rippling-ink-2',
                  'min-w-[220px] w-[220px]',
                )}
              >
                Employee
              </th>

              {visibleFields.length === 0 ? (
                <th className="px-3 py-2.5 border-b-2 border-rippling-line bg-rippling-surface-2 text-[12px] text-rippling-muted normal-case font-normal">
                  No fields selected — go back to add fields.
                </th>
              ) : (
                visibleFields.map((field, colIdx) => {
                  const mode = uniformByField?.[field.key] ?? 'uniform'
                  const isUnique = mode === 'unique'
                  const filledCount = countFilledForField(
                    employees,
                    field.key,
                    cellOverrides,
                    isUnique ? undefined : bulkValues?.[field.key],
                  )
                  const Icon = field.sectionIcon
                  const isLast = colIdx === visibleFields.length - 1

                  return (
                    <th
                      key={field.key}
                      className={classNames(
                        'bg-rippling-surface-2 border-b-2 border-rippling-line',
                        !isLast && 'border-r border-rippling-line-2',
                        'px-3 py-2 text-left min-w-[240px]',
                      )}
                    >
                      {/* Single-row: icon · label · progress/hint · toggle */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        {Icon && (
                          <Icon
                            size={11}
                            strokeWidth={1.75}
                            className="text-rippling-muted shrink-0"
                          />
                        )}
                        <span className="text-[11px] uppercase tracking-wide font-semibold text-rippling-ink-2 truncate shrink min-w-0">
                          {field.label}
                        </span>

                        {/* Progress / hint — inlined, fixed width so toggle doesn't shift */}
                        <div className="ml-auto flex items-center gap-2 shrink-0 min-w-[100px] justify-end">
                          {isUnique ? (
                            <ColumnProgress
                              filled={filledCount}
                              total={employees.length}
                            />
                          ) : (
                            <span className="text-[10px] text-rippling-muted italic normal-case tracking-normal font-normal truncate max-w-[90px]">
                              {filledCount === employees.length && employees.length > 0
                                ? 'all set'
                                : 'edit first row'}
                            </span>
                          )}
                        </div>

                        <UniqueToggle
                          isUnique={isUnique}
                          onChange={() => onToggleUniform?.(field.key)}
                        />
                      </div>
                    </th>
                  )
                })
              )}
            </tr>
          </thead>

          <tbody className="bg-white">
            {employees.length === 0 && (
              <tr>
                <td
                  colSpan={Math.max(2, visibleFields.length + 1)}
                  className="px-3 py-16 text-center text-rippling-muted text-[13px]"
                >
                  No employees in worklist.
                </td>
              </tr>
            )}

            {employees.map((employee, rowIdx) => (
              <tr
                key={employee.id}
                className="border-b border-rippling-line-2 hover:bg-rippling-surface/50 transition-colors group"
              >
                {/* Sticky name column */}
                <td
                  className={classNames(
                    'sticky left-0 z-10 bg-white group-hover:bg-rippling-surface/50 px-3 py-2 border-r border-rippling-line-2',
                    'min-w-[220px] w-[220px] transition-colors',
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={classNames(
                        'w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0',
                        avatarClass(employee.fullName),
                      )}
                    >
                      {initials(employee.fullName)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-rippling-ink truncate">
                        {employee.fullName}
                      </div>
                      <div className="text-[11.5px] text-rippling-muted truncate">
                        {employee.title}
                      </div>
                    </div>
                  </div>
                </td>

                {visibleFields.map((field, colIdx) => {
                  const mode = uniformByField?.[field.key] ?? 'uniform'
                  const isUnique = mode === 'unique'
                  const isFirstRow = rowIdx === 0
                  const current = getCurrentValue(employee, field.key)
                  const override = cellOverrides?.[employee.id]?.[field.key]
                  const bulk = bulkValues?.[field.key]
                  const editable = isUnique || isFirstRow

                  // Value displayed / edited in this cell
                  const cellValue = isUnique
                    ? override ?? bulk ?? ''
                    : bulk ?? ''

                  const willChange = cellValue !== '' && cellValue !== current
                  const isLast = colIdx === visibleFields.length - 1

                  return (
                    <td
                      key={`${employee.id}-${field.key}`}
                      data-cell-row={rowIdx}
                      data-cell-col={colIdx}
                      className={classNames(
                        'px-2 py-1.5 align-middle',
                        !isLast && 'border-r border-rippling-line-2',
                        !editable && 'bg-rippling-surface-2/30',
                      )}
                    >
                      <CellEditor
                        field={field}
                        currentValue={current}
                        cellValue={cellValue}
                        editable={editable}
                        willChange={willChange}
                        onChange={(value) => {
                          if (isUnique) {
                            onChangeCell?.(employee.id, field.key, value)
                          } else {
                            onChangeBulkValue?.(field.key, value)
                          }
                        }}
                        onEnter={() => handleEnter(rowIdx, colIdx)}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Unique toggle pill ───────────────────────────────────────────────────── */

function UniqueToggle({ isUnique, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={classNames(
        'inline-flex items-center gap-1.5 h-5 pl-1.5 pr-2 rounded-full shrink-0',
        'text-[10px] uppercase tracking-wide font-medium border transition-colors',
        isUnique
          ? 'bg-rippling-chip text-rippling-plum border-rippling-plum/20'
          : 'bg-white text-rippling-muted border-rippling-line hover:border-rippling-plum/30',
      )}
      title={
        isUnique
          ? 'Per-row values — click to set the same value for all'
          : 'Same value for all — click to edit each row individually'
      }
    >
      <span
        className={classNames(
          'inline-block h-2 w-2 rounded-full transition-colors',
          isUnique ? 'bg-rippling-plum' : 'bg-rippling-muted/40',
        )}
        aria-hidden
      />
      <span>Unique</span>
    </button>
  )
}

/* ── Inline progress bar for Unique columns ──────────────────────────────── */

function ColumnProgress({ filled, total }) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0
  return (
    <div className="flex items-center gap-1.5 normal-case tracking-normal font-normal w-[100px]">
      <div className="relative flex-1 h-1 rounded-full bg-rippling-line-2 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-rippling-plum rounded-full transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10.5px] text-rippling-ink-2 tabular-nums font-medium shrink-0">
        {filled}
        <span className="text-rippling-muted font-normal">/{total}</span>
      </span>
    </div>
  )
}

/* ── Cell editor ─────────────────────────────────────────────────────────── */

function CellEditor({ field, currentValue, cellValue, editable, willChange, onChange, onEnter }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {/* Current value — strikethrough when a new value is set */}
      <div
        className={classNames(
          'text-[12px] truncate w-[80px] shrink-0 transition-colors',
          willChange
            ? 'text-rippling-ink-2/50 line-through decoration-rippling-ink-2/40'
            : 'text-rippling-muted',
        )}
        title={currentValue || '—'}
      >
        {currentValue || <span className="italic opacity-60">—</span>}
      </div>

      <ArrowRight
        size={10}
        strokeWidth={1.75}
        className={classNames(
          'shrink-0 transition-colors',
          willChange ? 'text-rippling-plum/40' : 'text-rippling-line',
        )}
        aria-hidden
      />

      {editable ? (
        <SmartInput
          field={field}
          value={cellValue}
          willChange={willChange}
          onChange={onChange}
          onEnter={onEnter}
        />
      ) : (
        /* Non-editable row (uniform mode, not row 0): show inherited value */
        <div
          className={classNames(
            'flex-1 min-w-0 truncate text-[12.5px] px-2 py-1 rounded-md',
            cellValue
              ? 'text-rippling-plum/60 italic'
              : 'text-rippling-muted italic',
          )}
          title={cellValue || 'Inherits from first row'}
        >
          {cellValue || 'Inherits…'}
        </div>
      )}
    </div>
  )
}

/* ── Smart input — branches on field type ────────────────────────────────── */

function SmartInput({ field, value, willChange, onChange, onEnter }) {
  const isPerson = PERSON_FIELD_KEYS.has(field.key)
  const options = !isPerson && field.type === 'search-select' ? getOptionsFor(field.key) : null

  if (isPerson) {
    return (
      <PersonPickerCell
        value={value}
        willChange={willChange}
        onChange={onChange}
        onEnter={onEnter}
      />
    )
  }

  if (options) {
    return (
      <OptionPickerCell
        value={value}
        options={options}
        willChange={willChange}
        onChange={onChange}
        onEnter={onEnter}
      />
    )
  }

  if (field.type === 'select') {
    return (
      <SelectCell
        field={field}
        value={value}
        willChange={willChange}
        onChange={onChange}
        onEnter={onEnter}
      />
    )
  }

  return (
    <TextCell
      field={field}
      value={value}
      willChange={willChange}
      onChange={onChange}
      onEnter={onEnter}
    />
  )
}

/* ── Person-picker cell ──────────────────────────────────────────────────── */

function PersonPickerCell({ value, willChange, onChange, onEnter }) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); setOpen(true) }
    if (e.key === 'Escape') { e.preventDefault(); buttonRef.current?.blur() }
  }

  return (
    <div className="flex-1 min-w-0 relative">
      <button
        ref={buttonRef}
        data-editable="true"
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKey}
        className={classNames(
          'w-full flex items-center gap-1.5 h-7 px-2 rounded-md border text-left text-[12.5px] transition-colors',
          willChange
            ? 'border-rippling-plum/40 text-rippling-plum font-medium bg-white'
            : 'border-rippling-line text-rippling-ink-2 bg-white hover:border-rippling-plum/30',
        )}
        title={value || 'Pick a person…'}
      >
        {value ? (
          <>
            <span
              className={classNames(
                'h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-semibold text-white shrink-0',
                avatarClass(value),
              )}
            >
              {initials(value)}
            </span>
            <span className="truncate flex-1">{value}</span>
          </>
        ) : (
          <>
            <User size={11} strokeWidth={1.75} className="text-rippling-muted shrink-0" />
            <span className="text-rippling-muted italic truncate flex-1">Pick person…</span>
          </>
        )}
      </button>

      {open && (
        <MemberPickerPopover
          anchorRef={buttonRef}
          onSelect={(person) => {
            onChange(person.name)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

/* ── Option-picker cell ──────────────────────────────────────────────────── */

function OptionPickerCell({ value, options, willChange, onChange }) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); setOpen(true) }
    if (e.key === 'Escape') { e.preventDefault(); buttonRef.current?.blur() }
  }

  return (
    <div className="flex-1 min-w-0 relative">
      <button
        ref={buttonRef}
        data-editable="true"
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKey}
        className={classNames(
          'w-full flex items-center gap-1.5 h-7 px-2 rounded-md border text-left text-[12.5px] transition-colors',
          willChange
            ? 'border-rippling-plum/40 text-rippling-plum font-medium bg-white'
            : 'border-rippling-line text-rippling-ink-2 bg-white hover:border-rippling-plum/30',
        )}
        title={value || 'Pick option…'}
      >
        <span className={classNames('truncate flex-1', !value && 'text-rippling-muted italic')}>
          {value || 'Pick option…'}
        </span>
        <ChevronDown size={11} strokeWidth={2} className="text-rippling-muted shrink-0" />
      </button>

      {open && (
        <OptionPickerPopover
          anchorRef={buttonRef}
          options={options}
          currentValue={value}
          onSelect={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

/* ── Native select cell ──────────────────────────────────────────────────── */

function SelectCell({ field, value, willChange, onChange, onEnter }) {
  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); onEnter?.() }
    if (e.key === 'Escape') { e.preventDefault(); e.currentTarget.blur() }
  }
  return (
    <div className="relative flex-1 min-w-0">
      <select
        data-editable="true"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        className={classNames(
          'w-full h-7 px-2 pr-7 rounded-md border text-[12.5px] appearance-none transition-colors',
          'focus:outline-none focus:ring-1 focus:ring-rippling-primary focus:border-rippling-primary',
          willChange
            ? 'border-rippling-plum/40 text-rippling-plum font-medium bg-white'
            : 'border-rippling-line text-rippling-ink-2 bg-white',
        )}
      >
        <option value="" disabled>Select…</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown
        size={11}
        strokeWidth={2}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-rippling-muted"
      />
    </div>
  )
}

/* ── Plain text cell ─────────────────────────────────────────────────────── */

function TextCell({ field, value, willChange, onChange, onEnter }) {
  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onEnter?.() }
    if (e.key === 'Escape') { e.preventDefault(); e.currentTarget.blur() }
  }
  return (
    <input
      data-editable="true"
      type={field.type === 'sensitive' ? 'text' : field.type || 'text'}
      value={value ?? ''}
      placeholder={`e.g. ${field.label}`}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKey}
      className={classNames(
        'flex-1 min-w-0 h-7 px-2 rounded-md border text-[12.5px] transition-colors',
        'focus:outline-none focus:ring-1 focus:ring-rippling-primary focus:border-rippling-primary',
        willChange
          ? 'border-rippling-plum/40 text-rippling-plum font-medium bg-white'
          : 'border-rippling-line text-rippling-ink-2 bg-white',
      )}
    />
  )
}

/* ── Search cell (fallback for search-select with no options list) ──────── */
// Also used when getOptionsFor returns null (no static list defined).

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function countFilledForField(employees, fieldKey, cellOverrides, bulkValue) {
  if (bulkValue !== undefined && bulkValue !== '') return employees.length
  let count = 0
  for (const emp of employees) {
    const v = cellOverrides?.[emp.id]?.[fieldKey]
    if (v !== undefined && v !== '') count++
  }
  return count
}
