import { useMemo } from 'react'
import { RotateCcw, User, Users, X } from 'lucide-react'
import { avatarClass, classNames, initials } from '../../../lib/utils'
import FieldInput from '../../shared/FieldInput'
import { FIELDS_BY_KEY } from './fieldSchema'
import { getCurrentValue } from './currentValues'

const HEADER_CELL =
  'px-3 py-2.5 text-left font-semibold text-rippling-ink-2 text-[11px] uppercase tracking-wide border-r border-rippling-line bg-rippling-surface-2'
const BODY_CELL = 'px-3 py-2.5 align-top'

/**
 * Editable bulk-change table. Layout mirrors ResultsTable (Select Users step):
 *
 *   • Header bar with totals + Reset all
 *   • Sticky Name column on the left
 *   • One column per selected field; cell shows muted "current" above an
 *     editable input bound to the resolved new value
 *
 * Value resolution per (empId, fieldKey):
 *   Uniform columns: override → bulk default → current employee value
 *   Unique columns:  override → current employee value (bulk default ignored)
 */
export default function ChangesTable({
  employees,
  selectedFieldKeys,
  bulkValues,
  cellOverrides,
  uniformByField,
  onChangeCell,
  onRemoveField,
  onToggleUniform,
  onResetOverrides,
  totalEmployees,
  hiddenBySearchCount,
}) {
  const visibleFields = useMemo(
    () =>
      selectedFieldKeys
        .map((key) => FIELDS_BY_KEY.get(key))
        .filter(Boolean),
    [selectedFieldKeys],
  )

  const overrideCount = useMemo(() => {
    let n = 0
    for (const fieldMap of Object.values(cellOverrides ?? {})) {
      n += Object.keys(fieldMap ?? {}).length
    }
    return n
  }, [cellOverrides])

  const fieldsWithBulk = useMemo(
    () =>
      selectedFieldKeys.filter((k) => {
        const mode = uniformByField?.[k] ?? 'uniform'
        if (mode !== 'uniform') return false
        return bulkValues?.[k] !== undefined && bulkValues?.[k] !== ''
      }).length,
    [selectedFieldKeys, bulkValues, uniformByField],
  )

  const uniqueCount = useMemo(
    () =>
      selectedFieldKeys.filter((k) => (uniformByField?.[k] ?? 'uniform') === 'unique')
        .length,
    [selectedFieldKeys, uniformByField],
  )

  return (
    <div className="bg-white border border-rippling-line rounded-lg overflow-hidden">
      <div className="h-10 px-3 border-b border-rippling-line-2 bg-white flex items-center gap-3 text-[12.5px]">
        <span className="text-rippling-ink-2 font-medium tabular-nums">
          {totalEmployees} {totalEmployees === 1 ? 'employee' : 'employees'}
        </span>
        <span className="text-rippling-muted">·</span>
        <span className="text-rippling-muted tabular-nums">
          {selectedFieldKeys.length} {selectedFieldKeys.length === 1 ? 'field' : 'fields'}
        </span>
        {fieldsWithBulk > 0 && (
          <>
            <span className="text-rippling-muted">·</span>
            <span className="text-rippling-plum tabular-nums">
              {fieldsWithBulk} same for all
            </span>
          </>
        )}
        {uniqueCount > 0 && (
          <>
            <span className="text-rippling-muted">·</span>
            <span className="text-rippling-ink-2 tabular-nums">
              {uniqueCount} per person
            </span>
          </>
        )}
        {overrideCount > 0 && (
          <>
            <span className="text-rippling-muted">·</span>
            <span className="text-rippling-ink-2 tabular-nums">
              {overrideCount} row {overrideCount === 1 ? 'override' : 'overrides'}
            </span>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {overrideCount > 0 && (
            <button
              type="button"
              onClick={onResetOverrides}
              className="h-7 px-2 rounded-md text-[12px] text-rippling-muted hover:text-rippling-ink ui-interactive inline-flex items-center gap-1.5"
              title="Clear all per-row overrides"
            >
              <RotateCcw size={12} strokeWidth={1.75} />
              <span>Reset overrides</span>
            </button>
          )}
          {hiddenBySearchCount > 0 && (
            <span className="text-[11.5px] text-rippling-muted tabular-nums">
              {hiddenBySearchCount} hidden by search
            </span>
          )}
        </div>
      </div>

      <div className="max-h-[560px] overflow-auto">
        <table className="people-table w-full text-[13px] border-collapse">
          <thead className="sticky top-0 z-10 shadow-[0_1px_0_0_#E5E5E5,0_2px_6px_rgba(15,15,15,0.04)]">
            <tr className="border-b-2 border-rippling-line">
              <th
                className={classNames(
                  HEADER_CELL,
                  'min-w-[240px] sticky left-0 z-20 bg-rippling-surface-2',
                )}
              >
                Name
              </th>
              {visibleFields.length === 0 ? (
                <th className={classNames(HEADER_CELL, 'border-r-0 text-rippling-muted normal-case font-normal')}>
                  No fields selected — add fields above to start editing
                </th>
              ) : (
                visibleFields.map((field, idx) => {
                  const Icon = field.sectionIcon
                  const mode = uniformByField?.[field.key] ?? 'uniform'
                  const isUniform = mode === 'uniform'
                  return (
                    <th
                      key={field.key}
                      className={classNames(
                        HEADER_CELL,
                        'min-w-[200px]',
                        idx === visibleFields.length - 1 && 'border-r-0',
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {Icon && (
                          <Icon
                            size={11}
                            strokeWidth={1.75}
                            className="text-rippling-muted shrink-0"
                          />
                        )}
                        <span className="truncate">{field.label}</span>
                        <button
                          type="button"
                          onClick={() => onToggleUniform?.(field.key)}
                          className={classNames(
                            'ml-auto h-5 px-1.5 rounded-full text-[10px] font-medium uppercase tracking-wide flex items-center gap-1 ui-interactive',
                            isUniform
                              ? 'bg-rippling-chip text-rippling-plum'
                              : 'bg-rippling-surface-2 text-rippling-ink-2',
                          )}
                          title={
                            isUniform
                              ? 'Same for all — click to switch to per person'
                              : 'Per person — click to switch to same for all'
                          }
                          aria-label={`Toggle ${field.label} mode`}
                        >
                          {isUniform ? (
                            <Users size={10} strokeWidth={1.9} />
                          ) : (
                            <User size={10} strokeWidth={1.9} />
                          )}
                          <span>{isUniform ? 'All' : 'Each'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveField?.(field.key)}
                          className="h-5 w-5 rounded ui-interactive flex items-center justify-center text-rippling-muted hover:text-rippling-ink opacity-60 hover:opacity-100"
                          aria-label={`Remove ${field.label} column`}
                          title={`Remove ${field.label} column`}
                        >
                          <X size={11} strokeWidth={2} />
                        </button>
                      </div>
                      <div className="mt-1 text-[10px] font-normal text-rippling-muted normal-case tracking-normal truncate">
                        {field.sectionLabel}
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
                  className="px-3 py-16 text-center text-rippling-muted"
                >
                  <div className="text-[13px]">No employees in worklist.</div>
                </td>
              </tr>
            )}
            {employees.map((employee) => (
              <EmployeeRow
                key={employee.id}
                employee={employee}
                visibleFields={visibleFields}
                bulkValues={bulkValues}
                overrides={cellOverrides?.[employee.id]}
                uniformByField={uniformByField}
                onChangeCell={onChangeCell}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EmployeeRow({
  employee,
  visibleFields,
  bulkValues,
  overrides,
  uniformByField,
  onChangeCell,
}) {
  return (
    <tr className="border-b border-rippling-line-2 data-row">
      <td className={classNames(BODY_CELL, 'sticky left-0 z-10 bg-white')}>
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
            <div className="font-medium text-rippling-ink truncate">{employee.fullName}</div>
            <div className="text-[11.5px] text-rippling-muted truncate">{employee.title}</div>
          </div>
        </div>
      </td>

      {visibleFields.length === 0 ? (
        <td className={classNames(BODY_CELL, 'text-rippling-muted italic')}>—</td>
      ) : (
        visibleFields.map((field, idx) => {
          const current = getCurrentValue(employee, field.key)
          const mode = uniformByField?.[field.key] ?? 'uniform'
          const isUniform = mode === 'uniform'
          const bulk = isUniform ? bulkValues?.[field.key] : undefined
          const override = overrides?.[field.key]
          const hasOverride = override !== undefined
          const hasBulk = isUniform && bulk !== undefined && bulk !== ''
          const resolvedValue = hasOverride ? override : hasBulk ? bulk : ''
          const willChange = resolvedValue !== '' && resolvedValue !== current

          return (
            <td
              key={`${employee.id}-${field.key}`}
              className={classNames(
                BODY_CELL,
                idx === visibleFields.length - 1 ? '' : 'border-r border-rippling-line-2',
                'min-w-[200px]',
              )}
            >
              <div className="space-y-1">
                <div className="text-[10.5px] uppercase tracking-wide text-rippling-muted flex items-center gap-1">
                  <span>Current</span>
                  {hasOverride && isUniform && (
                    <span className="text-rippling-plum normal-case tracking-normal text-[10px] font-medium">
                      · overridden
                    </span>
                  )}
                  {!isUniform && (
                    <span className="text-rippling-ink-2 normal-case tracking-normal text-[10px] font-medium">
                      · per person
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-rippling-muted truncate" title={current || '—'}>
                  {current || <span className="italic">—</span>}
                </div>
                <FieldInput
                  field={{ ...field, value: resolvedValue }}
                  onChange={(value) => onChangeCell?.(employee.id, field.key, value)}
                  compact
                  placeholder={hasBulk ? '' : 'Set new value…'}
                />
                {willChange && (
                  <div className="text-[10.5px] text-rippling-plum font-medium truncate">
                    → {resolvedValue}
                  </div>
                )}
              </div>
            </td>
          )
        })
      )}
    </tr>
  )
}
