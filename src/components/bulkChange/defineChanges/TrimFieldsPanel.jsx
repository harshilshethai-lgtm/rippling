import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import { classNames } from '../../../lib/utils'
import { FIELDS_BY_KEY } from './fieldSchema'

/**
 * Multi-select trim panel for the chip row.
 *
 * Shown as a dropdown anchored under the "Modify" button. Lets the user
 * bulk-deselect fields when a template dropped ~22 of them and they only
 * want to keep a handful (or vice versa).
 *
 * Selection state is local to the popover; "Apply" commits by calling
 * onApply(keysToRemove). The parent removes those fields in one shot so
 * derived sidebars and the table only re-render once.
 */
export default function TrimFieldsPanel({
  open,
  selectedFieldKeys,
  bulkValues,
  onClose,
  onApply,
}) {
  // Local "kept" set — starts as all currently selected, user un-toggles to drop.
  const [kept, setKept] = useState(() => new Set(selectedFieldKeys))
  const [query, setQuery] = useState('')
  const containerRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setKept(new Set(selectedFieldKeys))
    setQuery('')
    const id = window.requestAnimationFrame(() => searchRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [open, selectedFieldKeys])

  useEffect(() => {
    if (!open) return
    function onMouseDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onClose?.()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open, onClose])

  const enriched = useMemo(
    () =>
      selectedFieldKeys
        .map((key) => {
          const meta = FIELDS_BY_KEY.get(key)
          if (!meta) return null
          return {
            key,
            label: meta.label,
            sectionLabel: meta.sectionLabel,
            sectionIcon: meta.sectionIcon,
            value: bulkValues?.[key],
          }
        })
        .filter(Boolean),
    [selectedFieldKeys, bulkValues],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return enriched
    return enriched.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.sectionLabel.toLowerCase().includes(q),
    )
  }, [enriched, query])

  if (!open) return null

  const keptCount = kept.size
  const removedCount = selectedFieldKeys.length - keptCount

  function toggle(key) {
    setKept((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function selectAllVisible() {
    setKept((prev) => {
      const next = new Set(prev)
      for (const item of visible) next.add(item.key)
      return next
    })
  }

  function clearAllVisible() {
    setKept((prev) => {
      const next = new Set(prev)
      for (const item of visible) next.delete(item.key)
      return next
    })
  }

  function handleApply() {
    const keysToRemove = selectedFieldKeys.filter((k) => !kept.has(k))
    onApply?.(keysToRemove)
  }

  const allVisibleKept = visible.length > 0 && visible.every((f) => kept.has(f.key))

  return (
    <div
      ref={containerRef}
      className="absolute z-30 left-0 top-full mt-2 w-[420px] rounded-xl border border-rippling-line bg-white shadow-rippling-dropdown anim-slide-in-bottom overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-rippling-line-2 flex items-center gap-2">
        <span className="text-[12.5px] font-semibold text-rippling-ink">
          Trim fields
        </span>
        <span className="text-[11px] text-rippling-muted tabular-nums">
          {keptCount} of {selectedFieldKeys.length} kept
          {removedCount > 0 && (
            <span className="text-rippling-plum"> · {removedCount} to remove</span>
          )}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto h-6 w-6 rounded-md ui-interactive flex items-center justify-center text-rippling-muted hover:text-rippling-ink"
          aria-label="Close"
        >
          <X size={13} strokeWidth={1.75} />
        </button>
      </div>

      <div className="px-2 py-2 border-b border-rippling-line-2">
        <div className="relative">
          <Search
            size={13}
            strokeWidth={1.75}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rippling-muted"
          />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search fields..."
            className="w-full h-8 pl-7 pr-2 text-[12.5px] rounded-md bg-rippling-surface border border-transparent placeholder:text-rippling-muted focus:outline-none focus:bg-white focus:border-rippling-line transition-colors"
          />
        </div>
      </div>

      <div className="px-2.5 py-1.5 border-b border-rippling-line-2 flex items-center gap-2 text-[11.5px]">
        <button
          type="button"
          onClick={allVisibleKept ? clearAllVisible : selectAllVisible}
          className="px-1.5 h-6 rounded text-rippling-ink-2 ui-interactive font-medium"
        >
          {allVisibleKept ? 'Clear all' : 'Select all'}
        </button>
        {query && (
          <span className="text-rippling-muted">
            in {visible.length} matching
          </span>
        )}
      </div>

      <div className="py-1 max-h-[340px] overflow-y-auto">
        {visible.length === 0 ? (
          <div className="px-3 py-6 text-center text-[12px] text-rippling-muted">
            No fields match.
          </div>
        ) : (
          visible.map((field) => {
            const checked = kept.has(field.key)
            const Icon = field.sectionIcon
            return (
              <button
                key={field.key}
                type="button"
                onClick={() => toggle(field.key)}
                className={classNames(
                  'w-full px-2.5 py-1.5 flex items-center gap-2.5 text-left rounded-md transition-colors',
                  checked ? 'bg-transparent' : 'opacity-60 bg-transparent',
                  'hover:bg-rippling-surface-2',
                )}
              >
                <span
                  className={classNames(
                    'h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                    checked
                      ? 'bg-rippling-plum border-rippling-plum text-white'
                      : 'bg-white border-rippling-line',
                  )}
                >
                  {checked && <Check size={11} strokeWidth={3} />}
                </span>
                {Icon && (
                  <Icon
                    size={12}
                    strokeWidth={1.75}
                    className="text-rippling-muted shrink-0"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] text-rippling-ink truncate">
                    {field.label}
                  </span>
                  <span className="block text-[10.5px] text-rippling-muted truncate">
                    {field.sectionLabel}
                  </span>
                </span>
                {field.value !== undefined && field.value !== '' && (
                  <span className="text-[11px] text-rippling-plum truncate max-w-[140px]">
                    → {String(field.value)}
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>

      <div className="px-2 py-2 border-t border-rippling-line-2 flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={onClose}
          className="h-7 px-2.5 rounded-md text-[12px] text-rippling-muted ui-interactive"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={removedCount === 0}
          className={classNames(
            'h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors',
            removedCount === 0
              ? 'bg-rippling-surface-2 text-rippling-muted cursor-not-allowed'
              : 'bg-rippling-plum text-white hover:bg-rippling-plum-hover',
          )}
        >
          {removedCount === 0
            ? 'No changes'
            : `Remove ${removedCount} ${removedCount === 1 ? 'field' : 'fields'}`}
        </button>
      </div>
    </div>
  )
}
