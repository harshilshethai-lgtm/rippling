import { useState } from 'react'
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { classNames, avatarClass, initials } from '../../../../lib/utils'
import CandidatePicker from './CandidatePicker'

/**
 * Review step for Select People mode.
 * Shows resolved / ambiguous / missed rows, allows disambiguation.
 *
 * resolution: resolvedRows[] from resolveAllEmployeeRows()
 *   Each row: { raw, status: 'auto'|'ambiguous'|'missed', matchId?, candidateIds? }
 *
 * overrides: { [rowIndex]: employeeId }
 */
export default function ReviewStepSelect({ resolution: resolvedRows, overrides, onChangeOverrides, context }) {
  const { employees } = context

  function handleResolve(rowIndex, employeeId) {
    onChangeOverrides((prev) => ({ ...prev, [rowIndex]: employeeId }))
  }

  const enriched = resolvedRows.map((r, i) => {
    if (r.status === 'ambiguous' && overrides[i]) {
      return { ...r, status: 'auto', matchId: overrides[i] }
    }
    return r
  })

  const autoCount = enriched.filter((r) => r.status === 'auto').length
  const ambiguousCount = enriched.filter((r) => r.status === 'ambiguous').length
  const missedCount = enriched.filter((r) => r.status === 'missed').length

  return (
    <div className="space-y-4">
      {/* Tally strip */}
      <div className="flex items-center gap-4 flex-wrap">
        <h3 className="text-[14px] font-semibold text-rippling-ink">Review and confirm your data</h3>
        <div className="flex items-center gap-3 text-[12px] flex-wrap">
          <span className="inline-flex items-center gap-1 text-green-700">
            <CheckCircle2 size={12} strokeWidth={2} />
            <strong className="tabular-nums">{autoCount}</strong> to add
          </span>
          {ambiguousCount > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <AlertCircle size={12} strokeWidth={2} />
              <strong className="tabular-nums">{ambiguousCount}</strong> need attention
            </span>
          )}
          {missedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-red-600">
              <XCircle size={12} strokeWidth={2} />
              <strong className="tabular-nums">{missedCount}</strong> not found
            </span>
          )}
        </div>
      </div>

      <p className="text-[12.5px] text-rippling-muted -mt-2 leading-relaxed">
        Confirm the matches found and complete any missing information.
        {ambiguousCount > 0 && (
          <> Rows marked <strong>Select</strong> need you to choose the right person.</>
        )}
      </p>

      <div className="border border-rippling-line rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_1.4fr_100px] gap-3 px-4 py-2.5 bg-rippling-surface-2 border-b border-rippling-line">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-rippling-ink-2">Value from CSV</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-rippling-ink-2">Match in Rippling</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-rippling-ink-2 text-right">Status</span>
        </div>
        <div className="max-h-[340px] overflow-auto">
          {enriched.map((result, i) => (
            <ReviewRow
              key={i}
              result={result}
              employees={employees}
              onResolve={(id) => handleResolve(i, id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ReviewRow({ result, employees, onResolve }) {
  const { raw, status, matchId, candidateIds } = result
  const autoEmployee = status === 'auto' && matchId
    ? employees.find((e) => e.id === matchId)
    : null
  const displayName = raw.name || raw.email || raw.profileNumber || '(unknown)'
  const secondary = [raw.email, raw.profileNumber ? `#${raw.profileNumber}` : '']
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="grid grid-cols-[1fr_1.4fr_100px] items-center gap-3 px-4 py-3 border-b border-rippling-line-2 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[12.5px] text-rippling-ink truncate font-medium">{displayName}</p>
        {secondary && <p className="text-[11px] text-rippling-muted truncate">{secondary}</p>}
      </div>
      <div className="min-w-0">
        {status === 'auto' && autoEmployee && (
          <div className="flex items-center gap-2">
            <div className={classNames(
              'w-6 h-6 rounded-full flex items-center justify-center text-white text-[9.5px] font-semibold shrink-0',
              avatarClass(autoEmployee.fullName),
            )}>
              {initials(autoEmployee.fullName)}
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-rippling-ink truncate">{autoEmployee.fullName}</p>
              <p className="text-[11px] text-rippling-muted truncate">{autoEmployee.title}</p>
            </div>
          </div>
        )}
        {status === 'ambiguous' && (
          <CandidatePicker candidateIds={candidateIds} employees={employees} onSelect={onResolve} />
        )}
        {status === 'missed' && (
          <span className="text-[12px] text-rippling-muted italic">Not found in directory</span>
        )}
      </div>
      <div className="flex justify-end">
        {status === 'auto' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            <CheckCircle2 size={10} strokeWidth={2} /> Matched
          </span>
        )}
        {status === 'ambiguous' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
            <AlertCircle size={10} strokeWidth={2} /> Select
          </span>
        )}
        {status === 'missed' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
            <XCircle size={10} strokeWidth={2} /> Not found
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Compute the final confirmed IDs from resolved rows + user overrides.
 */
export function computeConfirmedSelect(resolvedRows, overrides) {
  const resolvedIds = []
  const missedRows = []
  resolvedRows.forEach((r, i) => {
    const effectiveId = r.status === 'ambiguous' && overrides[i] ? overrides[i] : r.matchId
    const effectiveStatus = r.status === 'ambiguous' && overrides[i] ? 'auto' : r.status
    if (effectiveStatus === 'auto' && effectiveId) {
      resolvedIds.push(effectiveId)
    } else if (effectiveStatus !== 'auto') {
      missedRows.push(r.raw.name || r.raw.email || '(unknown)')
    }
  })
  return { resolvedIds: [...new Set(resolvedIds)], missedRows }
}
