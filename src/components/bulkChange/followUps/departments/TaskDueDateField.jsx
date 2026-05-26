import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { classNames } from '../../../../lib/utils'

/**
 * Compact absolute date picker for a single task's due date. No relative
 * offsets — per the design decision, every due date is an absolute calendar
 * date the user picks.
 *
 * The trigger renders either a plain "+ Pick date" pill (empty state) or a
 * filled chip with the formatted date and a clear ✕. The popover is a small
 * month-grid identical in spirit to the existing EffectiveDatePicker.
 *
 * Props:
 *   value    - 'YYYY-MM-DD' or null
 *   onChange - (newIso | null) => void
 *   anchor   - 'left' (default) or 'right' for popover edge
 */

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayISO() {
  return toISODate(new Date())
}

function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return [y, m - 1, d]
}

function buildGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length < 42) cells.push(null)
  return cells
}

function formatChip(iso) {
  const today = todayISO()
  if (iso === today) return 'Today'
  const [y, m, d] = parseISO(iso)
  const sameYear = y === new Date().getFullYear()
  return new Date(y, m, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  })
}

export default function TaskDueDateField({ value, onChange, anchor = 'left' }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const initialISO = value ?? todayISO()
  const [initY, initM] = parseISO(initialISO)
  const [viewYear, setViewYear] = useState(initY)
  const [viewMonth, setViewMonth] = useState(initM)

  // When the value changes externally, snap the view back to that month
  useEffect(() => {
    if (!value) return
    const [y, m] = parseISO(value)
    setViewYear(y)
    setViewMonth(m)
  }, [value])

  const grid = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth])
  const today = todayISO()
  const [todY, todM, todD] = parseISO(today)
  const [selY, selM, selD] = value ? parseISO(value) : [null, null, null]

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      {value ? (
        <div
          className={classNames(
            'inline-flex items-center h-6 pl-1.5 pr-1 rounded-md border text-[11.5px] gap-1 transition-colors',
            open
              ? 'bg-white border-rippling-plum/40 text-rippling-ink shadow-sm'
              : 'bg-white border-rippling-line text-rippling-ink-2 hover:border-rippling-plum/40',
          )}
        >
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5"
          >
            <Calendar size={11} strokeWidth={1.75} className="text-rippling-plum/80 shrink-0" />
            <span className="font-medium tabular-nums">{formatChip(value)}</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null) }}
            className="h-4 w-4 rounded flex items-center justify-center text-rippling-muted hover:text-rippling-ink hover:bg-rippling-surface transition-colors ml-0.5"
            aria-label="Clear due date"
            title="Clear due date"
          >
            <X size={9} strokeWidth={2.25} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={classNames(
            'inline-flex items-center h-6 px-2 rounded-md border border-dashed text-[11.5px] gap-1 transition-colors',
            open
              ? 'bg-white border-rippling-plum/50 text-rippling-plum'
              : 'bg-white border-rippling-line text-rippling-muted hover:border-rippling-plum/50 hover:text-rippling-plum',
          )}
        >
          <Calendar size={11} strokeWidth={1.75} />
          <span>Pick due date</span>
        </button>
      )}

      {open && (
        <div
          className={classNames(
            'absolute top-full mt-1.5 w-[252px] bg-white rounded-xl border border-rippling-line shadow-rippling-dropdown z-50 overflow-hidden',
            anchor === 'right' ? 'right-0' : 'left-0',
          )}
        >
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={prevMonth}
                className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-rippling-surface-2 text-rippling-muted hover:text-rippling-ink transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={13} strokeWidth={2} />
              </button>
              <span className="text-[12.5px] font-semibold text-rippling-ink">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-rippling-surface-2 text-rippling-muted hover:text-rippling-ink transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={13} strokeWidth={2} />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="h-6 flex items-center justify-center text-[10px] text-rippling-muted font-medium">
                  {wd}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-0.5">
              {grid.map((day, idx) => {
                if (!day) return <div key={idx} />
                const cellISO = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const isPast = cellISO < today
                const isToday = viewYear === todY && viewMonth === todM && day === todD
                const isSelected = selY != null && viewYear === selY && viewMonth === selM && day === selD

                return (
                  <div key={idx} className="flex items-center justify-center">
                    <button
                      type="button"
                      disabled={isPast}
                      onClick={() => {
                        onChange(cellISO)
                        setOpen(false)
                      }}
                      className={classNames(
                        'relative h-7 w-7 flex items-center justify-center rounded-full text-[12px] transition-colors',
                        isSelected && 'bg-rippling-plum text-white font-medium',
                        !isSelected && !isPast && 'hover:bg-rippling-chip text-rippling-ink',
                        !isSelected && isPast && 'opacity-30 cursor-not-allowed text-rippling-ink-2',
                        !isSelected && isToday && !isPast && 'font-semibold text-rippling-plum',
                      )}
                    >
                      {day}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-rippling-plum" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
