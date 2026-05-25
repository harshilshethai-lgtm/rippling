import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search } from 'lucide-react'
import { avatarClass, classNames, initials } from '../../../../lib/utils'

const DROPDOWN_MIN_WIDTH = 300
const DROPDOWN_MAX_HEIGHT = 280
const DROPDOWN_GAP = 4

/**
 * Searchable inline picker for ambiguous employee rows.
 * Rendered via a portal so it escapes overflow:auto containers.
 */
export default function CandidatePicker({ candidateIds, employees, onSelect }) {
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

  useLayoutEffect(() => {
    if (!open) return undefined
    function update() {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const placement = spaceBelow < DROPDOWN_MAX_HEIGHT && rect.top > spaceBelow ? 'up' : 'down'
      const top = placement === 'down' ? rect.bottom + DROPDOWN_GAP : rect.top - DROPDOWN_GAP
      const width = Math.max(rect.width, DROPDOWN_MIN_WIDTH)
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

  useEffect(() => {
    if (!open) return undefined
    function onClick(e) {
      if (triggerRef.current?.contains(e.target)) return
      if (dropdownRef.current?.contains(e.target)) return
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
        bottom: coords.placement === 'up' ? window.innerHeight - coords.top : undefined,
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
