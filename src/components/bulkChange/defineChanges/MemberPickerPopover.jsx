import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search } from 'lucide-react'
import { EMPLOYEES } from '../../../data/employees'
import { avatarClass, classNames, initials } from '../../../lib/utils'

const POPOVER_WIDTH = 288
const POPOVER_MAX_HEIGHT = 320
const POPOVER_GAP = 4

/**
 * A floating popover for picking people from the EMPLOYEES list.
 * Rendered via portal with fixed positioning so it escapes scrollable
 * sidebar containers without causing layout shift.
 *
 * Props:
 *   anchorRef         – ref to the trigger button used for positioning
 *   onSelect(person)  – called with { id, name, role } when a result is clicked
 *   onClose()         – called when the popover should be dismissed
 *   excludeIds        – Set of employee ids already in the list
 */
export default function MemberPickerPopover({ anchorRef, onSelect, onClose, excludeIds = new Set() }) {
  const [query, setQuery] = useState('')
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'down' })
  const inputRef = useRef(null)
  const popoverRef = useRef(null)

  useLayoutEffect(() => {
    function update() {
      const anchor = anchorRef?.current
      if (!anchor) return

      const rect = anchor.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const placement =
        spaceBelow < POPOVER_MAX_HEIGHT && rect.top > spaceBelow ? 'up' : 'down'

      let left = rect.left
      const overflowRight = left + POPOVER_WIDTH - window.innerWidth + 8
      if (overflowRight > 0) left = Math.max(8, left - overflowRight)

      const top =
        placement === 'down'
          ? rect.bottom + POPOVER_GAP
          : rect.top - POPOVER_GAP

      setCoords({ top, left, placement })
    }

    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [anchorRef])

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    function handleClickOutside(e) {
      const anchor = anchorRef?.current
      if (anchor?.contains(e.target)) return
      if (popoverRef.current?.contains(e.target)) return
      onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [anchorRef, onClose])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return EMPLOYEES.filter((emp) => {
      if (excludeIds.has(emp.id)) return false
      if (!q) return true
      return (
        emp.fullName.toLowerCase().includes(q) ||
        emp.title.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q)
      )
    }).slice(0, 8)
  }, [query, excludeIds])

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: coords.placement === 'down' ? coords.top : undefined,
        bottom:
          coords.placement === 'up'
            ? window.innerHeight - coords.top
            : undefined,
        left: coords.left,
        width: POPOVER_WIDTH,
        zIndex: 1000,
      }}
      className="rounded-lg border border-rippling-line bg-white shadow-rippling-dropdown"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-rippling-line">
        <Search size={13} strokeWidth={1.75} className="text-rippling-muted shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people…"
          className="flex-1 text-[12.5px] bg-transparent focus:outline-none text-rippling-ink placeholder:text-rippling-muted"
        />
      </div>

      <ul className="py-1 max-h-56 overflow-y-auto">
        {results.length === 0 ? (
          <li className="px-3 py-3 text-[12px] text-rippling-muted text-center">No results</li>
        ) : (
          results.map((emp) => (
            <li key={emp.id}>
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-rippling-surface text-left transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect({ id: emp.id, name: emp.fullName, role: emp.title })
                  onClose()
                }}
              >
                <span
                  className={classNames(
                    'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0',
                    avatarClass(emp.fullName),
                  )}
                >
                  {initials(emp.fullName)}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[12.5px] text-rippling-ink truncate">{emp.fullName}</span>
                  <span className="block text-[11px] text-rippling-muted truncate">{emp.title}</span>
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>,
    document.body,
  )
}
