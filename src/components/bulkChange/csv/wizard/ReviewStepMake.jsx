import { useMemo } from 'react'
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { classNames, avatarClass, initials } from '../../../../lib/utils'
import { FIELDS_BY_KEY } from '../../defineChanges/fieldSchema'
import { resolveAmbiguities } from '../csvDraft'
import CandidatePicker from './CandidatePicker'

/**
 * Review step for Make Changes mode.
 *
 * Shows a live-updating summary of what will be applied:
 *   - Tally: matched / ambiguous / missed / errors
 *   - Ambiguous row picker (CandidatePicker per ambiguous row)
 *   - Per-row validation errors
 *
 * resolution: result of computeImportPrelim()
 * overrides: { [rowIndex]: employeeId } — user picks for ambiguous rows
 */
export default function ReviewStepMake({ resolution, overrides, onChangeOverrides, context }) {
  const { employees, selectedFieldKeys, currentState } = context

  function handleResolve(rowIndex, employeeId) {
    onChangeOverrides((prev) => ({ ...prev, [rowIndex]: employeeId }))
  }

  // Live-compute the final summary as user resolves ambiguous rows
  const liveResult = useMemo(
    () => resolveAmbiguities(resolution, overrides, selectedFieldKeys, employees, currentState),
    [resolution, overrides, selectedFieldKeys, employees, currentState],
  )

  const { matchedRows, ambiguousRows, missedRows, errors } = resolution
  const totalAmbiguous = ambiguousRows.length
  const resolvedAmbiguous = Object.keys(overrides).length
  const pendingAmbiguous = totalAmbiguous - resolvedAmbiguous

  return (
    <div className="space-y-4">
      {/* Tally strip */}
      <div>
        <h3 className="text-[14px] font-semibold text-rippling-ink mb-2">Review import results</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard
            icon={<CheckCircle2 size={14} strokeWidth={2} className="text-green-600" />}
            value={liveResult.summary.matchedRows}
            label="matched"
            tone="green"
          />
          {totalAmbiguous > 0 && (
            <StatCard
              icon={<AlertCircle size={14} strokeWidth={2} className="text-amber-600" />}
              value={pendingAmbiguous}
              label="need selection"
              tone={pendingAmbiguous > 0 ? 'amber' : 'green'}
            />
          )}
          {missedRows.length > 0 && (
            <StatCard
              icon={<XCircle size={14} strokeWidth={2} className="text-red-500" />}
              value={missedRows.length}
              label="not found"
              tone="red"
            />
          )}
          <StatCard
            icon={<CheckCircle2 size={14} strokeWidth={2} className="text-rippling-plum" />}
            value={liveResult.summary.changedCells}
            label="cells to change"
            tone={liveResult.summary.changedCells > 0 ? 'plum' : 'neutral'}
          />
        </div>
      </div>

      {/* Ambiguous rows */}
      {ambiguousRows.length > 0 && (
        <AmbiguousSection
          ambiguousRows={ambiguousRows}
          overrides={overrides}
          employees={employees}
          onResolve={handleResolve}
        />
      )}

      {/* Validation errors */}
      {errors.length > 0 && (
        <ErrorSection errors={errors} selectedFieldKeys={selectedFieldKeys} />
      )}

      {/* Missed rows */}
      {missedRows.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-[12.5px] font-semibold text-red-700 mb-1">
            {missedRows.length} {missedRows.length === 1 ? 'row' : 'rows'} could not be matched
          </p>
          <div className="space-y-0.5 max-h-[100px] overflow-auto">
            {missedRows.slice(0, 8).map((r, i) => (
              <p key={i} className="text-[11.5px] text-red-600">
                Row {r.rowIndex + 2} — {r.raw.name || r.raw.email || r.raw.profileNumber || '(unknown)'}
              </p>
            ))}
            {missedRows.length > 8 && (
              <p className="text-[11.5px] text-red-600">+{missedRows.length - 8} more</p>
            )}
          </div>
        </div>
      )}

      {/* No changes notice */}
      {liveResult.summary.changedCells === 0 && liveResult.summary.matchedRows > 0 && errors.length === 0 && (
        <p className="text-[12.5px] text-rippling-muted bg-rippling-surface border border-rippling-line rounded px-3 py-2">
          All values in the CSV match the current draft — no changes will be applied.
        </p>
      )}
    </div>
  )
}

function StatCard({ icon, value, label, tone }) {
  const toneClass =
    tone === 'green' ? 'border-green-200 bg-green-50 text-green-700'
    : tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-700'
    : tone === 'red' ? 'border-red-200 bg-red-50 text-red-700'
    : tone === 'plum' ? 'border-rippling-plum/20 bg-rippling-chip text-rippling-plum'
    : 'border-rippling-line bg-rippling-surface text-rippling-ink-2'

  return (
    <div className={classNames('rounded-lg border px-3 py-2.5 flex items-center gap-2', toneClass)}>
      {icon}
      <span className="text-[20px] font-bold tabular-nums">{value}</span>
      <span className="text-[11.5px]">{label}</span>
    </div>
  )
}

function AmbiguousSection({ ambiguousRows, overrides, employees, onResolve }) {
  return (
    <div>
      <p className="text-[12.5px] font-semibold text-rippling-ink mb-2">
        Select matches for ambiguous rows
      </p>
      <div className="border border-rippling-line rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_1.4fr] gap-3 px-4 py-2 bg-rippling-surface-2 border-b border-rippling-line">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-rippling-ink-2">From CSV</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-rippling-ink-2">Match in Rippling</span>
        </div>
        <div className="divide-y divide-rippling-line-2 max-h-[220px] overflow-auto">
          {ambiguousRows.map((r) => {
            const resolvedId = overrides[r.rowIndex]
            const resolvedEmp = resolvedId ? employees.find((e) => e.id === resolvedId) : null
            const displayName = r.raw.name || r.raw.email || r.raw.profileNumber || '(unknown)'
            return (
              <div key={r.rowIndex} className="grid grid-cols-[1fr_1.4fr] items-center gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-rippling-ink truncate">{displayName}</p>
                  <p className="text-[11px] text-rippling-muted">
                    Row {r.rowIndex + 2} · {r.candidateIds.length} possible matches
                  </p>
                </div>
                <div>
                  {resolvedId && resolvedEmp ? (
                    <div className="flex items-center gap-2">
                      <div className={classNames(
                        'w-6 h-6 rounded-full flex items-center justify-center text-white text-[9.5px] font-semibold shrink-0',
                        avatarClass(resolvedEmp.fullName),
                      )}>
                        {initials(resolvedEmp.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-rippling-ink truncate">{resolvedEmp.fullName}</p>
                        <button
                          type="button"
                          onClick={() => onResolve(r.rowIndex, null)}
                          className="text-[10.5px] text-rippling-muted hover:text-rippling-plum"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <CandidatePicker
                      candidateIds={r.candidateIds}
                      employees={employees}
                      onSelect={(id) => onResolve(r.rowIndex, id)}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ErrorSection({ errors, selectedFieldKeys }) {
  const grouped = {}
  for (const err of errors) {
    const rowKey = `Row ${err.row}`
    if (!grouped[rowKey]) grouped[rowKey] = []
    const fieldMeta = FIELDS_BY_KEY.get(err.column)
    grouped[rowKey].push({ column: fieldMeta?.label ?? err.column, message: err.message })
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
      <p className="text-[12.5px] font-semibold text-red-700 mb-2">
        {errors.length} validation {errors.length === 1 ? 'error' : 'errors'} — fix these in your CSV before applying
      </p>
      <div className="space-y-2 max-h-[160px] overflow-auto">
        {Object.entries(grouped).slice(0, 10).map(([rowLabel, rowErrors]) => (
          <div key={rowLabel}>
            <p className="text-[11.5px] font-semibold text-red-700">{rowLabel}</p>
            {rowErrors.map((e, i) => (
              <p key={i} className="text-[11.5px] text-red-600 ml-2">
                {e.column}: {e.message}
              </p>
            ))}
          </div>
        ))}
        {Object.keys(grouped).length > 10 && (
          <p className="text-[11.5px] text-red-600">+{errors.length - 10} more errors</p>
        )}
      </div>
    </div>
  )
}
