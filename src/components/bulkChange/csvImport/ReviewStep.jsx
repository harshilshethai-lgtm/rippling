import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertCircle, XCircle, ChevronDown, Search } from 'lucide-react'
import { classNames, avatarClass, initials } from '../../../lib/utils'

const DROPDOWN_MIN_WIDTH = 300
const DROPDOWN_MAX_HEIGHT = 280
const DROPDOWN_GAP = 4

/**
 * A searchable inline picker for ambiguous rows. The dropdown is rendered
 * via a portal with fixed positioning so it can escape the table's
 * overflow:auto container (otherwise it would be clipped to a thin sliver).
 */
function CandidatePicker({ candidateIds, employees, onSelect }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placement: 'down' })
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  const candidateEmployees = candidateIds
    .map((id) => employees.find((e) => e.id === id))
    .filter(Boolean)

  const filtered = search.trim()
    ? candidateEmployees.filter((e) =>
        `${e.fullName} ${e.title}`.toLowerCase().includes(search.toLowerCase()),
      )
    : candidateEmployees

  const selectedEmployee = selectedId ? employees.find((e) => e.id === selectedId) : null

  // Reposition the portal dropdown relative to the trigger. Recomputes on
  // open, on scroll (capture so we catch ancestor scrolling), and on resize.
  useLayoutEffect(() => {
    if (!open) return undefined

    function update() {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const placement = spaceBelow < DROPDOWN_MAX_HEIGHT && rect.top > spaceBelow ? 'up' : 'down'
      const top = placement === 'down'
        ? rect.bottom + DROPDOWN_GAP
        : rect.top - DROPDOWN_GAP
      const width = Math.max(rect.width, DROPDOWN_MIN_WIDTH)
      // Pin to the trigger's left, but bump back into the viewport if we'd
      // overflow the right edge.
      let left = rect.left
      const overflowRight = left + width - window.innerWidth + 8
      if (overflowRight > 0) left = Math.max(8, left - overflowRight)
      setCoords({ top, left, width, placement })
    }

    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  // Click-outside: ignore clicks inside either the trigger or the portal.
  useEffect(() => {
    if (!open) return undefined
    function onClick(e) {
      const trigger = triggerRef.current
      const dropdown = dropdownRef.current
      if (trigger?.contains(e.target)) return
      if (dropdown?.contains(e.target)) return
      setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function choose(emp) {
    setSelectedId(emp.id)
    setSearch('')
    setOpen(false)
    onSelect(emp.id)
  }

  function toggle() {
    setOpen((o) => {
      const next = !o
      if (next) setTimeout(() => inputRef.current?.focus(), 30)
      return next
    })
  }

  const dropdown = open ? (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: coords.placement === 'down' ? coords.top : undefined,
        bottom:
          coords.placement === 'up'
            ? window.innerHeight - coords.top
            : undefined,
        left: coords.left,
        width: coords.width,
        maxHeight: DROPDOWN_MAX_HEIGHT,
        zIndex: 1000,
      }}
      className="bg-white border border-rippling-line rounded-lg shadow-rippling-dropdown overflow-hidden flex flex-col"
    >
      <div className="px-2 py-1.5 border-b border-rippling-line-2 shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rippling-surface">
          <Search size={12} strokeWidth={2} className="text-rippling-muted shrink-0" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="flex-1 text-[12px] bg-transparent border-0 focus:outline-none text-rippling-ink placeholder:text-rippling-muted/60"
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto py-1">
        {filtered.length === 0 ? (
          <p className="text-[12px] text-rippling-muted text-center py-4">No results</p>
        ) : (
          filtered.map((emp) => (
            <button
              key={emp.id}
              type="button"
              onClick={() => choose(emp)}
              className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-rippling-surface text-left"
            >
              <div
                className={classNames(
                  'w-6 h-6 rounded-full flex items-center justify-center text-white text-[9.5px] font-semibold shrink-0 mt-0.5',
                  avatarClass(emp.fullName),
                )}
              >
                {initials(emp.fullName)}
              </div>
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium text-rippling-ink truncate">{emp.fullName}</p>
                <p className="text-[11px] text-rippling-muted truncate">{emp.title}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className={classNames(
          'w-full flex items-center justify-between gap-2 border rounded-md px-3 py-1.5 text-[12.5px] bg-white focus:outline-none cursor-pointer',
          selectedEmployee
            ? 'border-rippling-plum/40 text-rippling-ink font-medium'
            : 'border-rippling-line text-rippling-muted',
        )}
      >
        <span className="truncate">
          {selectedEmployee ? (
            <span>
              {selectedEmployee.fullName}
              <span className="ml-1.5 text-rippling-muted font-normal">{selectedEmployee.title}</span>
            </span>
          ) : (
            'Select match…'
          )}
        </span>
        <ChevronDown size={13} strokeWidth={1.75} className="shrink-0 text-rippling-muted" />
      </button>
      {dropdown && createPortal(dropdown, document.body)}
    </>
  )
}

/**
 * A single resolved row in the review table.
 */
function ReviewRow({ result, employees, onResolve }) {
  const { raw, status, matchId, candidateIds } = result

  const autoEmployee = status === 'auto' && matchId
    ? employees.find((e) => e.id === matchId)
    : null

  const displayName = raw.name || raw.email || '(unknown)'

  return (
    <div className="grid grid-cols-[1fr_1.4fr_100px] items-center gap-3 px-4 py-3 border-b border-rippling-line-2 last:border-b-0">
      {/* CSV value */}
      <div className="min-w-0">
        <p className="text-[12.5px] text-rippling-ink truncate font-medium">{displayName}</p>
        {raw.email && raw.name && (
          <p className="text-[11px] text-rippling-muted truncate">{raw.email}</p>
        )}
      </div>

      {/* Resolution */}
      <div className="min-w-0">
        {status === 'auto' && autoEmployee && (
          <div className="flex items-center gap-2">
            <div
              className={classNames(
                'w-6 h-6 rounded-full flex items-center justify-center text-white text-[9.5px] font-semibold shrink-0',
                avatarClass(autoEmployee.fullName),
              )}
            >
              {initials(autoEmployee.fullName)}
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-rippling-ink truncate">
                {autoEmployee.fullName}
              </p>
              <p className="text-[11px] text-rippling-muted truncate">{autoEmployee.title}</p>
            </div>
          </div>
        )}
        {status === 'ambiguous' && (
          <CandidatePicker
            candidateIds={candidateIds}
            employees={employees}
            onSelect={(id) => onResolve(id)}
          />
        )}
        {status === 'missed' && (
          <span className="text-[12px] text-rippling-muted italic">Not found in directory</span>
        )}
      </div>

      {/* Status badge */}
      <div className="flex justify-end">
        {status === 'auto' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            <CheckCircle2 size={10} strokeWidth={2} />
            Matched
          </span>
        )}
        {status === 'ambiguous' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
            <AlertCircle size={10} strokeWidth={2} />
            Select
          </span>
        )}
        {status === 'missed' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
            <XCircle size={10} strokeWidth={2} />
            Not found
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Full review step: renders all resolved rows, allows disambiguation, shows tally.
 */
export default function ReviewStep({ resolvedRows, employees, onResolutionChange }) {
  // Local overrides: user picks a specific candidate for ambiguous rows
  const [overrides, setOverrides] = useState({})

  function handleResolve(rowIndex, employeeId) {
    setOverrides((prev) => {
      const next = { ...prev, [rowIndex]: employeeId }
      onResolutionChange(next)
      return next
    })
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
          <> Rows marked <strong>Select</strong> need you to choose the right person before confirming.</>
        )}
      </p>

      <div className="border border-rippling-line rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_1.4fr_100px] gap-3 px-4 py-2.5 bg-rippling-surface-2 border-b border-rippling-line">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-rippling-ink-2">
            Value from CSV
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-rippling-ink-2">
            Match in Rippling
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-rippling-ink-2 text-right">
            Status
          </span>
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

/**
 * Given the resolved rows and user overrides, compute the final set of matched IDs.
 */
export function computeConfirmed(resolvedRows, overrides) {
  const resolvedIds = []
  const missedRows = []
  resolvedRows.forEach((r, i) => {
    const effectiveId = r.status === 'ambiguous' && overrides[i] ? overrides[i] : r.matchId
    const effectiveStatus =
      r.status === 'ambiguous' && overrides[i] ? 'auto' : r.status
    if (effectiveStatus === 'auto' && effectiveId) {
      resolvedIds.push(effectiveId)
    } else if (effectiveStatus !== 'auto') {
      missedRows.push(r.raw.name || r.raw.email || '(unknown)')
    }
  })
  return { resolvedIds: [...new Set(resolvedIds)], missedRows }
}
