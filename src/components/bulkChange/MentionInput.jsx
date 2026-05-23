import { useEffect, useMemo, useRef, useState } from 'react'
import { AtSign, Search } from 'lucide-react'
import { avatarClass, classNames, initials } from '../../lib/utils'
import { mentionableMatches } from './bulkChangeUtils'

/**
 * Search input for the Linear-style filter bar. Plain text live-filters the
 * results table, typing "@" opens a mention autocomplete, and a leading "?"
 * (or "? …" with prefill) launches the Ask AI popover.
 */
export default function MentionInput({
  value,
  onValueChange,
  employees,
  excludeIds,
  onMention,
  onAskAi,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const [mentionStart, setMentionStart] = useState(-1)
  const inputRef = useRef(null)
  const popoverRef = useRef(null)

  const matches = useMemo(
    () => (open ? mentionableMatches(employees, query, excludeIds) : []),
    [employees, query, excludeIds, open],
  )

  useEffect(() => {
    setHighlight(0)
  }, [query, open])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleChange(event) {
    const next = event.target.value

    // Question trigger: a single leading "?" (or "? …" with prefill) opens
    // the Ask AI popover and clears the input so we don't double-render the
    // character. A plain "?" anywhere else is just text.
    if (onAskAi) {
      if (next === '?' && (value || '') === '') {
        onValueChange?.('')
        onAskAi('')
        return
      }
      const aiTrigger = next.match(/^\?\s+(.*)$/)
      if (aiTrigger) {
        onValueChange?.('')
        onAskAi(aiTrigger[1] || '')
        return
      }
    }

    onValueChange?.(next)

    const caret = event.target.selectionStart ?? next.length
    const before = next.slice(0, caret)
    const at = before.lastIndexOf('@')
    if (at === -1) {
      setOpen(false)
      setMentionStart(-1)
      return
    }

    const charBefore = at === 0 ? '' : before[at - 1]
    const validBoundary = at === 0 || /\s/.test(charBefore)
    const fragment = before.slice(at + 1)
    if (!validBoundary || /\s/.test(fragment)) {
      setOpen(false)
      setMentionStart(-1)
      return
    }

    setMentionStart(at)
    setQuery(fragment)
    setOpen(true)
  }

  function commitMention(employee) {
    if (!employee) return
    onMention?.(employee)
    if (mentionStart >= 0) {
      const before = (value || '').slice(0, mentionStart)
      const after = (value || '').slice(mentionStart).replace(/^@\S*/, '')
      const next = `${before}${after}`.replace(/\s{2,}/g, ' ').trimStart()
      onValueChange?.(next)
    }
    setOpen(false)
    setMentionStart(-1)
    setQuery('')
    inputRef.current?.focus()
  }

  function handleKeyDown(event) {
    if (open) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setHighlight((idx) => Math.min(matches.length - 1, idx + 1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setHighlight((idx) => Math.max(0, idx - 1))
      } else if (event.key === 'Enter') {
        event.preventDefault()
        const candidate = matches[highlight]
        if (candidate) commitMention(candidate)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        setMentionStart(-1)
      }
    }
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search
          size={13}
          strokeWidth={1.75}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-rippling-muted pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (mentionStart >= 0) setOpen(true)
          }}
          placeholder="Search by name or title — @ to select someone, ? to ask AI for filters"
          className="w-full h-9 bg-white border border-rippling-line rounded-md pl-9 pr-3 text-[13px] placeholder:text-rippling-muted focus:outline-none focus:ring-1 focus:ring-rippling-primary focus:border-rippling-primary transition-colors"
        />
      </div>

      {open && (
        <div
          ref={popoverRef}
          className="absolute left-0 right-0 top-full mt-2 z-30 rounded-xl border border-rippling-line bg-white shadow-rippling-dropdown anim-slide-in-bottom max-w-[420px]"
        >
          <div className="px-3 py-2 border-b border-rippling-line-2 text-[11px] uppercase tracking-wide text-rippling-muted font-semibold flex items-center gap-1.5">
            <AtSign size={11} strokeWidth={2} /> Mention an employee
          </div>
          <div className="py-1 max-h-[280px] overflow-y-auto">
            {matches.length === 0 ? (
              <div className="px-3 py-5 text-center text-[12px] text-rippling-muted">
                No employees match.
              </div>
            ) : (
              matches.map((employee, index) => (
                <button
                  key={employee.id}
                  type="button"
                  onMouseEnter={() => setHighlight(index)}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    commitMention(employee)
                  }}
                  className={classNames(
                    'w-full h-10 px-2.5 flex items-center gap-2.5 text-left rounded-md transition-colors',
                    highlight === index ? 'bg-rippling-surface-2' : 'bg-transparent',
                  )}
                >
                  <div
                    className={classNames(
                      'w-7 h-7 rounded-full flex items-center justify-center text-white text-[10.5px] font-semibold shrink-0',
                      avatarClass(employee.fullName),
                    )}
                  >
                    {initials(employee.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-rippling-ink truncate">{employee.fullName}</p>
                    <p className="text-[11.5px] text-rippling-muted truncate">{employee.title}</p>
                  </div>
                  <span className="text-[10.5px] text-rippling-muted">↵</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
