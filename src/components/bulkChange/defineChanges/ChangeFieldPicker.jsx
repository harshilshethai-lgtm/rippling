import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Search, X } from 'lucide-react'
import { classNames } from '../../../lib/utils'
import { FIELD_SECTIONS } from './fieldSchema'

/**
 * Linear-style split-pane modal for adding fields to bulk-edit.
 *
 *   Left rail  — scrollable list of all sections with per-section selection counts
 *   Right pane — searchable, checkboxable field list for the active section
 *   Footer     — running "N properties selected" count + Cancel / Apply
 *
 * Selections accumulate as the user moves between sections. The user never
 * has to go "back" — they just click a different section in the left rail and
 * keep picking. Apply commits the entire union in one call.
 *
 * Rendered via createPortal to document.body so it sits above everything.
 */
export default function ChangeFieldPicker({
  open,
  alreadySelectedKeys = [],
  onClose,
  onApply,
  initialSectionId,
}) {
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [selectedKeys, setSelectedKeys] = useState([])
  const [fieldQuery, setFieldQuery] = useState('')
  const fieldSearchRef = useRef(null)

  // Reset on each open
  useEffect(() => {
    if (!open) return
    setActiveSectionId(initialSectionId ?? FIELD_SECTIONS[0]?.id ?? null)
    setSelectedKeys([])
    setFieldQuery('')
  }, [open, initialSectionId])

  // Focus the field search when the active section changes
  useEffect(() => {
    if (!open) return
    const id = window.requestAnimationFrame(() => fieldSearchRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [open, activeSectionId])

  // ESC closes
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const alreadyAddedSet = useMemo(() => new Set(alreadySelectedKeys), [alreadySelectedKeys])

  const activeSection = useMemo(
    () => FIELD_SECTIONS.find((s) => s.id === activeSectionId) ?? null,
    [activeSectionId],
  )

  const visibleFields = useMemo(() => {
    if (!activeSection) return []
    const q = fieldQuery.trim().toLowerCase()
    return q
      ? activeSection.fields.filter((f) => f.label.toLowerCase().includes(q))
      : activeSection.fields
  }, [activeSection, fieldQuery])

  const selectableVisibleFields = useMemo(
    () => visibleFields.filter((f) => !alreadyAddedSet.has(f.key)),
    [visibleFields, alreadyAddedSet],
  )

  const activeSectionKeys = useMemo(
    () => selectableVisibleFields.map((f) => f.key),
    [selectableVisibleFields],
  )

  const selectedVisibleCount = useMemo(
    () => activeSectionKeys.filter((k) => selectedKeys.includes(k)).length,
    [activeSectionKeys, selectedKeys],
  )

  const allVisibleSelected =
    activeSectionKeys.length > 0 && selectedVisibleCount === activeSectionKeys.length
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected

  // Per-section counts of newly-selected fields (shown in left rail badges)
  const sectionCounts = useMemo(() => {
    const counts = {}
    for (const section of FIELD_SECTIONS) {
      counts[section.id] = section.fields.filter(
        (f) => !alreadyAddedSet.has(f.key) && selectedKeys.includes(f.key),
      ).length
    }
    return counts
  }, [selectedKeys, alreadyAddedSet])

  function switchSection(id) {
    setActiveSectionId(id)
    setFieldQuery('')
  }

  function toggleField(key) {
    if (alreadyAddedSet.has(key)) return
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedKeys((prev) => prev.filter((k) => !activeSectionKeys.includes(k)))
    } else {
      setSelectedKeys((prev) => {
        const next = new Set(prev)
        for (const k of activeSectionKeys) next.add(k)
        return [...next]
      })
    }
  }

  function handleApply() {
    if (selectedKeys.length === 0) return
    onApply?.(selectedKeys)
  }

  if (!open) return null

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 anim-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        className="w-[720px] max-h-[580px] bg-white rounded-2xl shadow-xl border border-rippling-line flex flex-col overflow-hidden anim-slide-in-bottom"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="h-12 px-5 border-b border-rippling-line flex items-center gap-3 shrink-0">
          <span className="text-[14px] font-semibold text-rippling-ink">Add properties</span>
          <span className="text-[12.5px] text-rippling-muted">
            Select from any section — they all apply together
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto h-7 w-7 rounded-md ui-interactive flex items-center justify-center text-rippling-muted hover:text-rippling-ink"
            aria-label="Close"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Two-pane body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: section rail */}
          <div className="w-[220px] border-r border-rippling-line overflow-y-auto shrink-0 py-1.5 px-1.5">
            {FIELD_SECTIONS.map((section) => {
              const Icon = section.icon
              const count = sectionCounts[section.id] ?? 0
              const isActive = section.id === activeSectionId
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => switchSection(section.id)}
                  className={classNames(
                    'w-full h-9 px-2.5 flex items-center justify-between gap-2 text-[13px] rounded-md transition-colors mb-0.5 text-left',
                    isActive
                      ? 'bg-rippling-chip text-rippling-plum'
                      : 'text-rippling-ink-2 hover:bg-rippling-surface-2',
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Icon
                      size={13}
                      strokeWidth={1.75}
                      className={
                        isActive ? 'text-rippling-plum shrink-0' : 'text-rippling-muted shrink-0'
                      }
                    />
                    <span className="truncate">{section.label}</span>
                  </span>
                  {count > 0 && (
                    <span className="text-[10.5px] font-semibold tabular-nums text-rippling-plum bg-rippling-plum/10 px-1.5 py-0.5 rounded-full shrink-0">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Right: field leaf */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Section search */}
            <div className="px-3 py-2.5 border-b border-rippling-line-2 shrink-0">
              <div className="relative">
                <Search
                  size={13}
                  strokeWidth={1.75}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rippling-muted"
                />
                <input
                  ref={fieldSearchRef}
                  value={fieldQuery}
                  onChange={(e) => setFieldQuery(e.target.value)}
                  placeholder={`Filter in ${activeSection?.label ?? 'section'}...`}
                  className="w-full h-8 pl-7 pr-2 text-[12.5px] rounded-md bg-rippling-surface border border-transparent placeholder:text-rippling-muted focus:outline-none focus:bg-white focus:border-rippling-line transition-colors"
                />
              </div>
            </div>

            {/* Select all row */}
            {selectableVisibleFields.length > 0 && (
              <div className="px-3 py-1.5 border-b border-rippling-line-2 shrink-0">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="w-full flex items-center gap-2.5 h-8 px-1 text-[12.5px] text-rippling-ink-2 hover:bg-rippling-surface-2 rounded-md transition-colors"
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
                  <span className="font-medium">Select all in {activeSection?.label}</span>
                  <span className="ml-auto text-[11px] tabular-nums text-rippling-muted">
                    {selectedVisibleCount}/{selectableVisibleFields.length}
                  </span>
                </button>
              </div>
            )}

            {/* Field list */}
            <div className="flex-1 overflow-y-auto py-1 px-1">
              {visibleFields.length === 0 && (
                <div className="px-3 py-8 text-center text-[12px] text-rippling-muted">
                  No fields match in this section.
                </div>
              )}
              {visibleFields.map((field) => {
                const selected = selectedKeys.includes(field.key)
                const alreadyAdded = alreadyAddedSet.has(field.key)
                return (
                  <button
                    key={field.key}
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => toggleField(field.key)}
                    className={classNames(
                      'w-full h-8 px-2.5 flex items-center gap-2.5 text-[13px] rounded-md transition-colors mb-0.5',
                      selected && !alreadyAdded && 'bg-rippling-chip text-rippling-plum',
                      !selected && !alreadyAdded && 'text-rippling-ink-2 hover:bg-rippling-surface-2',
                      alreadyAdded && 'opacity-50 cursor-not-allowed text-rippling-ink-2',
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
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-rippling-line bg-rippling-surface/40 flex items-center gap-3 shrink-0">
          <span className="text-[12.5px] text-rippling-muted flex-1">
            {selectedKeys.length === 0
              ? 'No properties selected yet'
              : `${selectedKeys.length} ${
                  selectedKeys.length === 1 ? 'property' : 'properties'
                } selected`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 rounded-md text-[12.5px] text-rippling-muted ui-interactive"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={selectedKeys.length === 0}
            className={classNames(
              'h-8 px-4 rounded-md text-[12.5px] font-medium transition-colors',
              selectedKeys.length === 0
                ? 'bg-rippling-surface-2 text-rippling-muted cursor-not-allowed'
                : 'bg-rippling-plum text-white hover:bg-rippling-plum-hover shadow-sm',
            )}
          >
            Add{selectedKeys.length > 0 ? ` ${selectedKeys.length}` : ''}{' '}
            {selectedKeys.length === 1 ? 'property' : 'properties'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
