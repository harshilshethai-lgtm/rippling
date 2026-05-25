import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock, Globe } from 'lucide-react'
import { classNames } from '../../../lib/utils'

// ── Helpers ──────────────────────────────────────────────────────────────────

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

/** Returns [year, month(0-based), day] from an ISO date string */
function parseISO(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return [y, m - 1, d]
}

/** Build the 6×7 calendar grid for a given display month */
function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length < 42) cells.push(null)
  return cells
}

/** All IANA timezone names available in the browser */
function getAllTimezones() {
  try {
    return Intl.supportedValuesOf('timeZone')
  } catch {
    // Safari fallback — return a minimal common set
    return [
      'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
      'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
      'Asia/Dubai', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo',
      'Australia/Sydney', 'Pacific/Auckland',
    ]
  }
}

/** Converts an IANA timezone to its abbreviated form, e.g. "America/Los_Angeles" → "PDT" */
export function getTzAbbrev(ianaTimezone) {
  try {
    const parts = Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimezone,
      timeZoneName: 'short',
    }).formatToParts(new Date())
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? ianaTimezone.split('/').pop().replace(/_/g, ' ')
  } catch {
    return ianaTimezone.split('/').pop().replace(/_/g, ' ')
  }
}

function formatTriggerLabel(value) {
  const today = todayISO()
  const { date, hour, minute, ampm, timezone } = value
  const min = String(minute).padStart(2, '0')
  const timeStr = `${hour}:${min} ${ampm}`
  const tzAbbrev = getTzAbbrev(timezone)

  if (date === today) {
    return { dateLabel: 'Today', timeStr, tzAbbrev }
  }
  const [y, m, d] = parseISO(date)
  const dateLabel = new Date(y, m, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: y !== new Date().getFullYear() ? 'numeric' : undefined,
  })
  return { dateLabel, timeStr, tzAbbrev }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CalendarSection({ selectedDate, onSelectDate }) {
  const today = todayISO()
  const [selY, selM, selD] = parseISO(selectedDate)

  const [viewYear, setViewYear] = useState(selY)
  const [viewMonth, setViewMonth] = useState(selM)

  const grid = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth])

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const [todY, todM, todD] = parseISO(today)

  return (
    <div className="px-3 pt-3 pb-2">
      {/* Month navigation */}
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

      {/* Weekday labels */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="h-6 flex items-center justify-center text-[10px] text-rippling-muted font-medium">
            {wd}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {grid.map((day, idx) => {
          if (!day) return <div key={idx} />

          const cellISO = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isPast = cellISO < today
          const isToday = viewYear === todY && viewMonth === todM && day === todD
          const isSelected = viewYear === selY && viewMonth === selM && day === selD

          return (
            <div key={idx} className="flex items-center justify-center">
              <button
                type="button"
                disabled={isPast}
                onClick={() => !isPast && onSelectDate(cellISO)}
                className={classNames(
                  'relative h-7 w-7 flex items-center justify-center rounded-full text-[12px] transition-colors',
                  isSelected && 'bg-rippling-plum text-white font-medium',
                  !isSelected && !isPast && 'hover:bg-rippling-chip text-rippling-ink',
                  !isSelected && isPast && 'opacity-30 cursor-not-allowed text-rippling-ink-2',
                  !isSelected && isToday && !isPast && 'font-semibold text-rippling-plum',
                )}
              >
                {day}
                {/* Today dot */}
                {isToday && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-rippling-plum" />
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TimeSection({ hour, minute, ampm, onChange }) {
  const [hourStr, setHourStr] = useState(String(hour))
  const [minStr, setMinStr] = useState(String(minute).padStart(2, '0'))

  // Sync external value changes
  useEffect(() => { setHourStr(String(hour)) }, [hour])
  useEffect(() => { setMinStr(String(minute).padStart(2, '0')) }, [minute])

  function commitHour(raw) {
    const n = parseInt(raw, 10)
    if (!isNaN(n) && n >= 1 && n <= 12) {
      onChange({ hour: n })
    } else {
      setHourStr(String(hour))
    }
  }

  function commitMinute(raw) {
    const n = parseInt(raw, 10)
    if (!isNaN(n) && n >= 0 && n <= 59) {
      onChange({ minute: n })
      setMinStr(String(n).padStart(2, '0'))
    } else {
      setMinStr(String(minute).padStart(2, '0'))
    }
  }

  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Clock size={11} strokeWidth={1.75} className="text-rippling-muted shrink-0" />
        <span className="text-[11px] text-rippling-muted font-medium w-14 shrink-0">Time</span>
        <div className="flex items-center gap-1 ml-auto">
          {/* Hour */}
          <input
            type="text"
            inputMode="numeric"
            value={hourStr}
            onChange={(e) => setHourStr(e.target.value)}
            onBlur={(e) => commitHour(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitHour(e.target.value) }}
            className="w-9 h-7 text-center text-[12.5px] bg-rippling-surface border border-rippling-line rounded-md focus:outline-none focus:border-rippling-plum/50 focus:bg-white transition-colors text-rippling-ink"
            aria-label="Hour"
          />
          <span className="text-[12.5px] text-rippling-muted font-medium">:</span>
          {/* Minute */}
          <input
            type="text"
            inputMode="numeric"
            value={minStr}
            onChange={(e) => setMinStr(e.target.value)}
            onBlur={(e) => commitMinute(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitMinute(e.target.value) }}
            className="w-9 h-7 text-center text-[12.5px] bg-rippling-surface border border-rippling-line rounded-md focus:outline-none focus:border-rippling-plum/50 focus:bg-white transition-colors text-rippling-ink"
            aria-label="Minute"
          />
          {/* AM/PM toggle */}
          <div className="flex rounded-md border border-rippling-line overflow-hidden ml-1">
            {['AM', 'PM'].map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => onChange({ ampm: period })}
                className={classNames(
                  'h-7 px-2 text-[11.5px] font-medium transition-colors',
                  ampm === period
                    ? 'bg-rippling-plum text-white'
                    : 'bg-white text-rippling-ink-2 hover:bg-rippling-surface-2',
                )}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TimezoneSection({ timezone, onChange }) {
  const allTimezones = useMemo(() => getAllTimezones(), [])
  const [query, setQuery] = useState('')
  const [tzOpen, setTzOpen] = useState(false)
  const tzRef = useRef(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return allTimezones
    const q = query.toLowerCase().replace(/_/g, ' ')
    return allTimezones.filter((tz) =>
      tz.toLowerCase().replace(/_/g, ' ').includes(q)
    )
  }, [allTimezones, query])

  // Close timezone dropdown on outside click
  useEffect(() => {
    if (!tzOpen) return
    function onDown(e) {
      if (tzRef.current && !tzRef.current.contains(e.target)) {
        setTzOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [tzOpen])

  const displayTz = timezone.replace(/_/g, ' ')

  return (
    <div className="px-3 py-2.5" ref={tzRef}>
      <div className="flex items-start gap-2">
        <Globe size={11} strokeWidth={1.75} className="text-rippling-muted shrink-0 mt-1" />
        <span className="text-[11px] text-rippling-muted font-medium w-14 shrink-0 mt-0.5">Timezone</span>
        <div className="flex-1 relative">
          <button
            type="button"
            onClick={() => setTzOpen((v) => !v)}
            className={classNames(
              'w-full h-7 px-2 text-left text-[11.5px] rounded-md border transition-colors truncate',
              tzOpen
                ? 'bg-white border-rippling-plum/50 text-rippling-ink'
                : 'bg-rippling-surface border-rippling-line text-rippling-ink-2 hover:border-rippling-line hover:bg-white',
            )}
          >
            {displayTz}
          </button>

          {tzOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-rippling-line rounded-lg shadow-rippling-dropdown z-10 overflow-hidden">
              <div className="p-1.5 border-b border-rippling-line-2">
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search timezones…"
                  className="w-full h-7 px-2 text-[12px] bg-rippling-surface border border-rippling-line rounded-md focus:outline-none focus:border-rippling-plum/50 focus:bg-white transition-colors placeholder:text-rippling-muted"
                />
              </div>
              <ul className="max-h-[160px] overflow-y-auto py-1">
                {filtered.length === 0 && (
                  <li className="px-3 py-2 text-[11.5px] text-rippling-muted">No results</li>
                )}
                {filtered.map((tz) => (
                  <li key={tz}>
                    <button
                      type="button"
                      onClick={() => { onChange({ timezone: tz }); setTzOpen(false); setQuery('') }}
                      className={classNames(
                        'w-full text-left px-3 py-1.5 text-[11.5px] transition-colors',
                        tz === timezone
                          ? 'bg-rippling-chip text-rippling-plum font-medium'
                          : 'text-rippling-ink-2 hover:bg-rippling-surface-2',
                      )}
                    >
                      {tz.replace(/_/g, ' ')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * Linear-style effective date + time + timezone picker.
 *
 * value: { date: 'yyyy-MM-dd', hour: 1-12, minute: 0-59, ampm: 'AM'|'PM', timezone: IANA string }
 * onChange: (patch) => void  — patch is merged into the parent's state object
 */
export default function EffectiveDatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const { dateLabel, timeStr, tzAbbrev } = formatTriggerLabel(value)

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={classNames(
          'flex items-center gap-1.5 h-7 px-2 rounded-md border text-[12px] transition-colors w-full',
          open
            ? 'bg-white border-rippling-plum/40 text-rippling-ink shadow-sm'
            : 'bg-rippling-surface border-rippling-line text-rippling-ink-2 hover:bg-white hover:border-rippling-line',
        )}
      >
        <Calendar size={11} strokeWidth={1.75} className="text-rippling-muted shrink-0" />
        <span className="font-medium text-rippling-ink truncate">
          {dateLabel}
        </span>
        <span className="text-rippling-muted">at</span>
        <span className="text-rippling-ink truncate">{timeStr}</span>
        <span className="text-rippling-muted mx-0.5">·</span>
        <span className="text-rippling-muted truncate text-[11px]">{tzAbbrev}</span>
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-[288px] bg-white rounded-xl border border-rippling-line shadow-rippling-dropdown z-50 overflow-hidden">
          <CalendarSection
            selectedDate={value.date}
            onSelectDate={(date) => onChange({ date })}
          />
          <div className="h-px bg-rippling-line-2 mx-3" />
          <TimeSection
            hour={value.hour}
            minute={value.minute}
            ampm={value.ampm}
            onChange={onChange}
          />
          <div className="h-px bg-rippling-line-2 mx-3" />
          <TimezoneSection
            timezone={value.timezone}
            onChange={onChange}
          />
          <div className="pb-2" />
        </div>
      )}
    </div>
  )
}
