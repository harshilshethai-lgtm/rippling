import { useEffect, useMemo, useRef, useState } from 'react'
import { AtSign } from 'lucide-react'
import { classNames } from '../../../lib/utils'
import { FIELDS_BY_KEY } from './fieldSchema'

// variant values: 'default' | 'inline' | 'hero'

function propertyMatches(query, excludeKeys, limit = 8) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const excluded = new Set(excludeKeys)
  const results = []
  for (const meta of FIELDS_BY_KEY.values()) {
    if (excluded.has(meta.key)) continue
    if (
      meta.label.toLowerCase().includes(q) ||
      meta.key.toLowerCase().includes(q)
    ) {
      results.push(meta)
    }
  }
  return results
    .sort((a, b) => {
      const aLabel = a.label.toLowerCase()
      const bLabel = b.label.toLowerCase()
      const aStarts = aLabel.startsWith(q)
      const bStarts = bLabel.startsWith(q)
      if (aStarts !== bStarts) return aStarts ? -1 : 1
      return aLabel.localeCompare(bLabel)
    })
    .slice(0, limit)
}

/**
 * Text input for adding properties via @-mentions, e.g. "@ manager".
 * Opens a field autocomplete on "@" and commits on Enter or pick.
 */
export default function PropertyInput({
  alreadySelectedKeys = [],
  onAddFields,
  variant = 'default',
  placeholder,
}) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [mentionStart, setMentionStart] = useState(-1)
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef(null)
  const popoverRef = useRef(null)

  const isInline = variant === 'inline'
  const isHero = variant === 'hero'

  const matches = useMemo(
    () => (open ? propertyMatches(query, alreadySelectedKeys) : []),
    [open, query, alreadySelectedKeys],
  )

  useEffect(() => {
    setHighlight(0)
  }, [query, open])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event) {
      if (
        popoverRef.current?.contains(event.target) ||
        inputRef.current?.contains(event.target)
      ) {
        return
      }
      setOpen(false)
      setMentionStart(-1)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function syncMentionState(next, caret) {
    const before = next.slice(0, caret)
    const at = before.lastIndexOf('@')
    if (at === -1) {
      setOpen(false)
      setMentionStart(-1)
      setQuery('')
      return
    }

    const charBefore = at === 0 ? '' : before[at - 1]
    const validBoundary = at === 0 || /\s/.test(charBefore)
    const fragment = before.slice(at + 1)
    if (!validBoundary || /\s/.test(fragment)) {
      setOpen(false)
      setMentionStart(-1)
      setQuery('')
      return
    }

    setMentionStart(at)
    setQuery(fragment)
    setOpen(true)
  }

  function handleChange(event) {
    const next = event.target.value
    setValue(next)
    syncMentionState(next, event.target.selectionStart ?? next.length)
  }

  function clearMentionFragment() {
    if (mentionStart < 0) {
      setValue('')
      return
    }
    const before = value.slice(0, mentionStart)
    const after = value.slice(mentionStart).replace(/^@\S*/, '')
    const next = `${before}${after}`.replace(/\s{2,}/g, ' ').trimStart()
    setValue(next)
    setOpen(false)
    setMentionStart(-1)
    setQuery('')
  }

  function commitField(meta) {
    if (!meta || alreadySelectedKeys.includes(meta.key)) return
    onAddFields?.([meta.key])
    clearMentionFragment()
    inputRef.current?.focus()
  }

  function resolveFieldFromQuery(rawQuery) {
    const q = rawQuery.trim().toLowerCase()
    if (!q) return null

    const available = [...FIELDS_BY_KEY.values()].filter(
      (meta) => !alreadySelectedKeys.includes(meta.key),
    )

    const exact = available.find(
      (meta) =>
        meta.label.toLowerCase() === q || meta.key.toLowerCase() === q,
    )
    if (exact) return exact

    const partial = propertyMatches(q, alreadySelectedKeys, 1)
    return partial[0] ?? null
  }

  function handleKeyDown(event) {
    if (open && matches.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setHighlight((idx) => Math.min(matches.length - 1, idx + 1))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setHighlight((idx) => Math.max(0, idx - 1))
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        commitField(matches[highlight])
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        setMentionStart(-1)
        return
      }
    }

    if (event.key === 'Enter' && mentionStart >= 0) {
      event.preventDefault()
      const resolved = resolveFieldFromQuery(query)
      if (resolved) commitField(resolved)
    }
  }

  const defaultPlaceholder = 'Type @ to add a property — e.g. @ Manager'
  const inlinePlaceholder = '@ Add property…'
  const heroPlaceholder = 'Type @ to add a property — e.g. @ manager, @ department…'

  return (
    <div
      className={classNames(
        'relative',
        isInline ? 'min-w-[120px] flex-1 max-w-[220px]' : 'w-full',
      )}
    >
      {isHero && (
        <AtSign
          size={15}
          strokeWidth={1.9}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rippling-plum/60 pointer-events-none"
        />
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (mentionStart >= 0) setOpen(true)
        }}
        placeholder={
          placeholder ?? (isInline ? inlinePlaceholder : isHero ? heroPlaceholder : defaultPlaceholder)
        }
        aria-label="Add a property with @"
        className={classNames(
          'w-full bg-transparent text-rippling-ink placeholder:text-rippling-muted focus:outline-none transition-colors',
          isInline
            ? 'h-7 px-2.5 text-[12px] rounded-full border border-dashed border-rippling-line focus:border-rippling-plum/40 focus:bg-white'
            : isHero
              ? 'h-11 pl-9 pr-4 text-[14px] rounded-xl border border-rippling-line bg-white focus:ring-2 focus:ring-rippling-primary/20 focus:border-rippling-primary shadow-sm'
              : 'h-9 px-3 text-[13px] rounded-md border border-rippling-line bg-white focus:ring-1 focus:ring-rippling-primary focus:border-rippling-primary',
        )}
      />

      {open && (
        <div
          ref={popoverRef}
          className={classNames(
            'absolute z-30 top-full mt-1.5 rounded-xl border border-rippling-line bg-white shadow-rippling-dropdown anim-slide-in-bottom overflow-hidden',
            isInline ? 'left-0 w-[280px]' : isHero ? 'left-0 right-0' : 'left-0 right-0',
          )}
        >
          <div className="px-3 py-2 border-b border-rippling-line-2 text-[11px] uppercase tracking-wide text-rippling-muted font-semibold flex items-center gap-1.5">
            <AtSign size={11} strokeWidth={2} />
            Add property
          </div>
          <div className="py-1 max-h-[240px] overflow-y-auto">
            {matches.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-rippling-muted">
                No properties match.
              </div>
            ) : (
              matches.map((meta, index) => {
                const Icon = meta.sectionIcon
                return (
                  <button
                    key={meta.key}
                    type="button"
                    onMouseEnter={() => setHighlight(index)}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      commitField(meta)
                    }}
                    className={classNames(
                      'w-full h-8 px-2.5 flex items-center gap-2.5 text-left rounded-md transition-colors',
                      highlight === index ? 'bg-rippling-surface-2' : 'bg-transparent',
                    )}
                  >
                    {Icon && (
                      <Icon
                        size={13}
                        strokeWidth={1.75}
                        className="text-rippling-muted shrink-0"
                      />
                    )}
                    <span className="text-[13px] text-rippling-ink truncate flex-1">
                      {meta.label}
                    </span>
                    <span className="text-[10.5px] text-rippling-muted shrink-0">
                      ↵
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
