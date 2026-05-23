import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronRight, Search } from 'lucide-react'
import { classNames } from '../../lib/utils'
import { FILTER_ATTRIBUTES, FILTER_SCHEMA } from './bulkChangeUtils'

/**
 * Linear-style two-pane filter picker.
 * Pane A: list of available attributes (with scoped match counts).
 * Pane B: searchable, multi-select value list for the chosen attribute.
 */
export default function FilterPicker({
  open,
  anchorMode = 'right',
  initialAttribute = null,
  initialValues = [],
  attributeCounts,
  scopeForAttribute,
  onClose,
  onApply,
}) {
  const [pane, setPane] = useState(initialAttribute ? 'values' : 'attributes')
  const [attribute, setAttribute] = useState(initialAttribute)
  const [selectedValues, setSelectedValues] = useState(initialValues)
  const [valueQuery, setValueQuery] = useState('')
  const [attributeQuery, setAttributeQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)
  const containerRef = useRef(null)
  const valueSearchRef = useRef(null)
  const attributeSearchRef = useRef(null)

  // Reset every time the picker is (re)opened so it doesn't leak state across edits.
  useEffect(() => {
    if (!open) return
    setAttribute(initialAttribute)
    setSelectedValues(initialValues)
    setValueQuery('')
    setAttributeQuery('')
    setHighlightIndex(0)
    setPane(initialAttribute ? 'values' : 'attributes')
  }, [open, initialAttribute, initialValues])

  useEffect(() => {
    if (!open) return
    const target = pane === 'attributes' ? attributeSearchRef.current : valueSearchRef.current
    target?.focus()
  }, [open, pane])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onClose?.()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, onClose])

  const visibleAttributes = useMemo(() => {
    const trimmed = attributeQuery.trim().toLowerCase()
    if (!trimmed) return FILTER_ATTRIBUTES
    return FILTER_ATTRIBUTES.filter((attr) => attr.toLowerCase().includes(trimmed))
  }, [attributeQuery])

  const valueOptions = useMemo(() => {
    if (!attribute) return []
    return scopeForAttribute(attribute)
  }, [attribute, scopeForAttribute])

  const visibleValues = useMemo(() => {
    const trimmed = valueQuery.trim().toLowerCase()
    if (!trimmed) return valueOptions
    return valueOptions.filter((value) => value.toLowerCase().includes(trimmed))
  }, [valueOptions, valueQuery])

  useEffect(() => {
    setHighlightIndex(0)
  }, [pane, attributeQuery, valueQuery, attribute])

  function pickAttribute(nextAttribute) {
    setAttribute(nextAttribute)
    setSelectedValues([])
    setValueQuery('')
    setPane('values')
  }

  function toggleValue(value) {
    setSelectedValues((previous) =>
      previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value],
    )
  }

  function handleApply() {
    if (!attribute || selectedValues.length === 0) return
    onApply?.({ attribute, values: selectedValues })
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose?.()
      return
    }

    if (pane === 'attributes') {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setHighlightIndex((idx) => Math.min(visibleAttributes.length - 1, idx + 1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setHighlightIndex((idx) => Math.max(0, idx - 1))
      } else if (event.key === 'Enter') {
        event.preventDefault()
        const next = visibleAttributes[highlightIndex]
        if (next) pickAttribute(next)
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightIndex((idx) => Math.min(visibleValues.length - 1, idx + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightIndex((idx) => Math.max(0, idx - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (event.metaKey || event.ctrlKey) {
        handleApply()
        return
      }
      const value = visibleValues[highlightIndex]
      if (value) toggleValue(value)
    }
  }

  if (!open) return null

  const positionClass =
    anchorMode === 'right'
      ? 'right-0 top-full mt-2'
      : 'left-0 top-full mt-2'

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={classNames(
        'absolute z-30 w-[300px] rounded-xl border border-rippling-line bg-white shadow-rippling-dropdown anim-slide-in-bottom',
        positionClass,
      )}
    >
      {pane === 'attributes' ? (
        <div className="flex flex-col">
          <div className="px-2 pt-2 pb-1.5 border-b border-rippling-line-2">
            <div className="relative">
              <Search
                size={13}
                strokeWidth={1.75}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rippling-muted"
              />
              <input
                ref={attributeSearchRef}
                value={attributeQuery}
                onChange={(event) => setAttributeQuery(event.target.value)}
                placeholder="Filter..."
                className="w-full h-8 pl-7 pr-2 text-[12.5px] rounded-md bg-rippling-surface border border-transparent placeholder:text-rippling-muted focus:outline-none focus:bg-white focus:border-rippling-line transition-colors"
              />
            </div>
          </div>
          <div className="py-1 max-h-[320px] overflow-y-auto">
            {visibleAttributes.length === 0 && (
              <div className="px-3 py-6 text-center text-[12px] text-rippling-muted">
                No filters match.
              </div>
            )}
            {visibleAttributes.map((attr, index) => {
              const Icon = FILTER_SCHEMA[attr].icon
              const count = attributeCounts?.[attr]
              const highlighted = highlightIndex === index
              return (
                <button
                  key={attr}
                  type="button"
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => pickAttribute(attr)}
                  className={classNames(
                    'w-full h-8 px-2.5 flex items-center justify-between gap-2 text-[13px] text-rippling-ink-2 rounded-md transition-colors',
                    highlighted ? 'bg-rippling-surface-2' : 'bg-transparent',
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Icon size={13} strokeWidth={1.75} className="text-rippling-muted shrink-0" />
                    <span className="truncate">{attr}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    {typeof count === 'number' && (
                      <span className="text-[11px] tabular-nums text-rippling-muted">
                        {count}
                      </span>
                    )}
                    <ChevronRight size={13} strokeWidth={1.75} className="text-rippling-muted" />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="h-9 px-2 border-b border-rippling-line-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setPane('attributes')
                setAttribute(null)
              }}
              className="h-7 w-7 rounded-md ui-interactive flex items-center justify-center text-rippling-muted"
              aria-label="Back"
            >
              <ArrowLeft size={13} strokeWidth={1.75} />
            </button>
            <span className="text-[12.5px] font-medium text-rippling-ink truncate">{attribute}</span>
            <span className="ml-auto text-[11px] text-rippling-muted tabular-nums">
              {selectedValues.length > 0 && `${selectedValues.length} selected`}
            </span>
          </div>

          <div className="px-2 py-2 border-b border-rippling-line-2">
            <div className="relative">
              <Search
                size={13}
                strokeWidth={1.75}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rippling-muted"
              />
              <input
                ref={valueSearchRef}
                value={valueQuery}
                onChange={(event) => setValueQuery(event.target.value)}
                placeholder={`Filter ${attribute?.toLowerCase() || 'values'}...`}
                className="w-full h-8 pl-7 pr-2 text-[12.5px] rounded-md bg-rippling-surface border border-transparent placeholder:text-rippling-muted focus:outline-none focus:bg-white focus:border-rippling-line transition-colors"
              />
            </div>
          </div>

          <div className="py-1 max-h-[280px] overflow-y-auto">
            {visibleValues.length === 0 && (
              <div className="px-3 py-6 text-center text-[12px] text-rippling-muted">
                No values match in current scope.
              </div>
            )}
            {visibleValues.map((value, index) => {
              const selected = selectedValues.includes(value)
              const highlighted = highlightIndex === index
              return (
                <button
                  key={value}
                  type="button"
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => toggleValue(value)}
                  className={classNames(
                    'w-full h-8 px-2.5 flex items-center gap-2.5 text-[13px] text-rippling-ink-2 rounded-md transition-colors',
                    highlighted && !selected && 'bg-rippling-surface-2',
                    selected && 'bg-rippling-chip text-rippling-plum',
                  )}
                >
                  <span
                    className={classNames(
                      'h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                      selected
                        ? 'bg-rippling-plum border-rippling-plum text-white'
                        : 'bg-white border-rippling-line',
                    )}
                  >
                    {selected && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span className="truncate">{value}</span>
                </button>
              )
            })}
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
              disabled={selectedValues.length === 0}
              className={classNames(
                'h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors',
                selectedValues.length === 0
                  ? 'bg-rippling-surface-2 text-rippling-muted cursor-not-allowed'
                  : 'bg-rippling-plum text-white hover:bg-rippling-plum-hover',
              )}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
