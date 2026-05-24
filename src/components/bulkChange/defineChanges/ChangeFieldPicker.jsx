import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronRight, Search } from 'lucide-react'
import { classNames } from '../../../lib/utils'
import { FIELD_SECTIONS } from './fieldSchema'

/**
 * Two-pane picker for adding fields to bulk-edit. Mirrors the look + behavior
 * of FilterPicker so the Define Changes bar feels identical to the Select
 * Users bar.
 *
 *   Pane A: section list (Role information, Personal information, …)
 *   Pane B: searchable, multi-select list of fields within the chosen section
 *
 * Apply emits one chip per selected field key.
 */
export default function ChangeFieldPicker({
  open,
  anchorMode = 'right',
  initialSectionId = null,
  alreadySelectedKeys = [],
  onClose,
  onApply,
}) {
  const [pane, setPane] = useState(initialSectionId ? 'fields' : 'sections')
  const [sectionId, setSectionId] = useState(initialSectionId)
  const [selectedKeys, setSelectedKeys] = useState([])
  const [sectionQuery, setSectionQuery] = useState('')
  const [fieldQuery, setFieldQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)
  const containerRef = useRef(null)
  const sectionSearchRef = useRef(null)
  const fieldSearchRef = useRef(null)

  // Reset on every (re-)open so picker state never leaks across openings.
  useEffect(() => {
    if (!open) return
    setSectionId(initialSectionId)
    setSelectedKeys([])
    setSectionQuery('')
    setFieldQuery('')
    setHighlightIndex(0)
    setPane(initialSectionId ? 'fields' : 'sections')
  }, [open, initialSectionId])

  useEffect(() => {
    if (!open) return
    const target = pane === 'sections' ? sectionSearchRef.current : fieldSearchRef.current
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

  const alreadyAddedSet = useMemo(() => new Set(alreadySelectedKeys), [alreadySelectedKeys])

  const visibleSections = useMemo(() => {
    const trimmed = sectionQuery.trim().toLowerCase()
    const list = trimmed
      ? FIELD_SECTIONS.filter((section) => section.label.toLowerCase().includes(trimmed))
      : FIELD_SECTIONS
    return list.map((section) => {
      const remaining = section.fields.filter((field) => !alreadyAddedSet.has(field.key)).length
      return { section, remaining }
    })
  }, [sectionQuery, alreadyAddedSet])

  const activeSection = useMemo(
    () => (sectionId ? FIELD_SECTIONS.find((s) => s.id === sectionId) ?? null : null),
    [sectionId],
  )

  const visibleFields = useMemo(() => {
    if (!activeSection) return []
    const trimmed = fieldQuery.trim().toLowerCase()
    const list = trimmed
      ? activeSection.fields.filter((field) => field.label.toLowerCase().includes(trimmed))
      : activeSection.fields
    return list
  }, [activeSection, fieldQuery])

  const selectableVisibleFields = useMemo(
    () => visibleFields.filter((field) => !alreadyAddedSet.has(field.key)),
    [visibleFields, alreadyAddedSet],
  )

  const selectableVisibleKeys = useMemo(
    () => selectableVisibleFields.map((field) => field.key),
    [selectableVisibleFields],
  )

  const selectedVisibleCount = useMemo(
    () => selectableVisibleKeys.filter((key) => selectedKeys.includes(key)).length,
    [selectableVisibleKeys, selectedKeys],
  )

  const allVisibleSelected =
    selectableVisibleKeys.length > 0 &&
    selectedVisibleCount === selectableVisibleKeys.length
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected

  useEffect(() => {
    setHighlightIndex(0)
  }, [pane, sectionQuery, fieldQuery, sectionId])

  function pickSection(nextSectionId) {
    setSectionId(nextSectionId)
    setSelectedKeys([])
    setFieldQuery('')
    setPane('fields')
  }

  function toggleField(fieldKey) {
    if (alreadyAddedSet.has(fieldKey)) return
    setSelectedKeys((previous) =>
      previous.includes(fieldKey)
        ? previous.filter((k) => k !== fieldKey)
        : [...previous, fieldKey],
    )
  }

  function selectAllVisible() {
    if (selectableVisibleKeys.length === 0) return
    setSelectedKeys((previous) => {
      const next = new Set(previous)
      for (const key of selectableVisibleKeys) next.add(key)
      return [...next]
    })
  }

  function unselectAllVisible() {
    if (selectableVisibleKeys.length === 0) return
    setSelectedKeys((previous) =>
      previous.filter((key) => !selectableVisibleKeys.includes(key)),
    )
  }

  function toggleSelectAllVisible() {
    if (allVisibleSelected) unselectAllVisible()
    else selectAllVisible()
  }

  function handleApply() {
    if (selectedKeys.length === 0) return
    onApply?.(selectedKeys)
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose?.()
      return
    }

    if (pane === 'sections') {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setHighlightIndex((idx) => Math.min(visibleSections.length - 1, idx + 1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setHighlightIndex((idx) => Math.max(0, idx - 1))
      } else if (event.key === 'Enter') {
        event.preventDefault()
        const next = visibleSections[highlightIndex]?.section
        if (next) pickSection(next.id)
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightIndex((idx) => Math.min(visibleFields.length - 1, idx + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightIndex((idx) => Math.max(0, idx - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (event.metaKey || event.ctrlKey) {
        handleApply()
        return
      }
      const field = visibleFields[highlightIndex]
      if (field) toggleField(field.key)
    }
  }

  if (!open) return null

  const positionClass =
    anchorMode === 'right' ? 'right-0 top-full mt-2' : 'left-0 top-full mt-2'

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={classNames(
        'absolute z-30 w-[320px] rounded-xl border border-rippling-line bg-white shadow-rippling-dropdown anim-slide-in-bottom',
        positionClass,
      )}
    >
      {pane === 'sections' ? (
        <div className="flex flex-col">
          <div className="px-2 pt-2 pb-1.5 border-b border-rippling-line-2">
            <div className="relative">
              <Search
                size={13}
                strokeWidth={1.75}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rippling-muted"
              />
              <input
                ref={sectionSearchRef}
                value={sectionQuery}
                onChange={(event) => setSectionQuery(event.target.value)}
                placeholder="Filter sections..."
                className="w-full h-8 pl-7 pr-2 text-[12.5px] rounded-md bg-rippling-surface border border-transparent placeholder:text-rippling-muted focus:outline-none focus:bg-white focus:border-rippling-line transition-colors"
              />
            </div>
          </div>
          <div className="py-1 max-h-[360px] overflow-y-auto">
            {visibleSections.length === 0 && (
              <div className="px-3 py-6 text-center text-[12px] text-rippling-muted">
                No sections match.
              </div>
            )}
            {visibleSections.map(({ section, remaining }, index) => {
              const Icon = section.icon
              const highlighted = highlightIndex === index
              const totalCount = section.fields.length
              return (
                <button
                  key={section.id}
                  type="button"
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => pickSection(section.id)}
                  className={classNames(
                    'w-full h-8 px-2.5 flex items-center justify-between gap-2 text-[13px] text-rippling-ink-2 rounded-md transition-colors',
                    highlighted ? 'bg-rippling-surface-2' : 'bg-transparent',
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Icon size={13} strokeWidth={1.75} className="text-rippling-muted shrink-0" />
                    <span className="truncate">{section.label}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[11px] tabular-nums text-rippling-muted">
                      {remaining < totalCount ? `${remaining}/${totalCount}` : totalCount}
                    </span>
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
                setPane('sections')
                setSectionId(null)
              }}
              className="h-7 w-7 rounded-md ui-interactive flex items-center justify-center text-rippling-muted"
              aria-label="Back"
            >
              <ArrowLeft size={13} strokeWidth={1.75} />
            </button>
            <span className="text-[12.5px] font-medium text-rippling-ink truncate">
              {activeSection?.label}
            </span>
            <span className="ml-auto text-[11px] text-rippling-muted tabular-nums">
              {selectedKeys.length > 0 && `${selectedKeys.length} selected`}
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
                ref={fieldSearchRef}
                value={fieldQuery}
                onChange={(event) => setFieldQuery(event.target.value)}
                placeholder={`Filter ${activeSection?.label.toLowerCase() || 'fields'}...`}
                className="w-full h-8 pl-7 pr-2 text-[12.5px] rounded-md bg-rippling-surface border border-transparent placeholder:text-rippling-muted focus:outline-none focus:bg-white focus:border-rippling-line transition-colors"
              />
            </div>
          </div>

          {selectableVisibleFields.length > 0 && (
            <div className="px-2.5 py-1.5 border-b border-rippling-line-2">
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                className="w-full flex items-center gap-2.5 h-8 px-1 -mx-1 text-[12.5px] text-rippling-ink-2 ui-interactive rounded-md"
                aria-label={allVisibleSelected ? 'Unselect all visible fields' : 'Select all visible fields'}
              >
                <input
                  type="checkbox"
                  readOnly
                  tabIndex={-1}
                  checked={allVisibleSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someVisibleSelected
                  }}
                  className="rippling-checkbox pointer-events-none"
                  aria-hidden
                />
                <span className="font-medium">Select all</span>
                <span className="ml-auto text-[11px] tabular-nums text-rippling-muted">
                  {selectedVisibleCount}/{selectableVisibleFields.length}
                </span>
              </button>
            </div>
          )}

          <div className="py-1 max-h-[280px] overflow-y-auto">
            {visibleFields.length === 0 && (
              <div className="px-3 py-6 text-center text-[12px] text-rippling-muted">
                No fields match in this section.
              </div>
            )}
            {visibleFields.map((field, index) => {
              const selected = selectedKeys.includes(field.key)
              const alreadyAdded = alreadyAddedSet.has(field.key)
              const highlighted = highlightIndex === index
              return (
                <button
                  key={field.key}
                  type="button"
                  disabled={alreadyAdded}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => toggleField(field.key)}
                  className={classNames(
                    'w-full h-8 px-2.5 flex items-center gap-2.5 text-[13px] text-rippling-ink-2 rounded-md transition-colors',
                    highlighted && !selected && !alreadyAdded && 'bg-rippling-surface-2',
                    selected && 'bg-rippling-chip text-rippling-plum',
                    alreadyAdded && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <span
                    className={classNames(
                      'h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                      selected || alreadyAdded
                        ? 'bg-rippling-plum border-rippling-plum text-white'
                        : 'bg-white border-rippling-line',
                    )}
                  >
                    {(selected || alreadyAdded) && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span className="truncate flex-1 text-left">{field.label}</span>
                  {alreadyAdded && (
                    <span className="text-[10.5px] text-rippling-muted shrink-0">Added</span>
                  )}
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
              disabled={selectedKeys.length === 0}
              className={classNames(
                'h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors',
                selectedKeys.length === 0
                  ? 'bg-rippling-surface-2 text-rippling-muted cursor-not-allowed'
                  : 'bg-rippling-plum text-white hover:bg-rippling-plum-hover',
              )}
            >
              Add {selectedKeys.length > 0 ? selectedKeys.length : ''}{' '}
              field{selectedKeys.length === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
