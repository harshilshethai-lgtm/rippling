import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Search } from 'lucide-react'

const POPOVER_WIDTH = 260
const POPOVER_MAX_HEIGHT = 300
const POPOVER_GAP = 4

/**
 * A floating options-list popover for non-person search-select fields.
 * Mirrors MemberPickerPopover's portal + positioning approach.
 *
 * Props:
 *   anchorRef     – ref to the trigger button
 *   options       – string[]
 *   currentValue  – currently selected string (to show a checkmark)
 *   onSelect(val) – called when an option is picked
 *   onClose()     – called to dismiss
 */
export default function OptionPickerPopover({ anchorRef, options, currentValue, onSelect, onClose }) {
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

      const top = placement === 'down' ? rect.bottom + POPOVER_GAP : rect.top - POPOVER_GAP
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
      if (anchorRef?.current?.contains(e.target)) return
      if (popoverRef.current?.contains(e.target)) return
      onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [anchorRef, onClose])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.toLowerCase().includes(q))
  }, [query, options])

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: coords.placement === 'down' ? coords.top : undefined,
        bottom:
          coords.placement === 'up' ? window.innerHeight - coords.top : undefined,
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
          placeholder="Search…"
          className="flex-1 text-[12.5px] bg-transparent focus:outline-none text-rippling-ink placeholder:text-rippling-muted"
        />
      </div>
      <ul className="py-1 max-h-52 overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="px-3 py-3 text-[12px] text-rippling-muted text-center">No results</li>
        ) : (
          filtered.map((option) => {
            const isSelected = option === currentValue
            return (
              <li key={option}>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rippling-surface text-left transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onSelect(option)
                    onClose()
                  }}
                >
                  <span className="flex-1 text-[12.5px] text-rippling-ink truncate">{option}</span>
                  {isSelected && (
                    <Check size={12} strokeWidth={2.5} className="text-rippling-plum shrink-0" />
                  )}
                </button>
              </li>
            )
          })
        )}
      </ul>
    </div>,
    document.body,
  )
}
