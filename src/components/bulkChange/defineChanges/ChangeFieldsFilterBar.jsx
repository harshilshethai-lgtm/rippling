import { useEffect, useRef, useState } from 'react'
import { SlidersHorizontal, User, Users, X } from 'lucide-react'
import { classNames } from '../../../lib/utils'
import { FIELDS_BY_KEY } from './fieldSchema'
import FieldInput from '../../shared/FieldInput'
import ChangeComposer from './ChangeComposer'
import TrimFieldsPanel from './TrimFieldsPanel'

/**
 * Pure "changeset builder" — composer + chip row + trim panel.
 *
 * Used by:
 *   • DefineChangeSetStep — as the only meaningful content of the page
 *   • MakeChangesStep      — as a header strip above the editable table
 *
 * Layout:
 *   1. Composer — AI-first input that accepts free text, "/" (templates),
 *      and "@" (fields). See ChangeComposer.jsx.
 *   2. Chip row — one chip per field being edited, each with a Uniform /
 *      Unique mode toggle and (when Uniform) an inline value editor. A
 *      "Modify" button appears when >=5 chips exist so the user can
 *      bulk-trim the set in one go.
 *
 * Variant prop:
 *   • "expanded" (default) — large composer with the empty-state template
 *     gallery if no chips. Used on the Define page.
 *   • "compact"  — single-row composer, no gallery. Used above the table on
 *     the Make Changes page.
 */
export default function ChangeFieldsFilterBar({
  selectedFieldKeys,
  bulkValues,
  uniformByField,
  onAddFields,
  onApplyTemplate,
  onRemoveField,
  onRemoveFields,
  onChangeBulkValue,
  onToggleUniform,
  variant = 'expanded',
}) {
  const [editingChipKey, setEditingChipKey] = useState(null)
  const [trimOpen, setTrimOpen] = useState(false)
  const trimAnchorRef = useRef(null)

  const showModify = selectedFieldKeys.length >= 5
  // On the Make Changes page the composer is always compact so it doesn't
  // dominate the screen real-estate above the table.
  const composerVariant =
    variant === 'compact' || selectedFieldKeys.length > 0 ? 'compact' : 'empty'

  function handleTrimApply(keysToRemove) {
    if (keysToRemove.length > 0) onRemoveFields?.(keysToRemove)
    setTrimOpen(false)
  }

  return (
    <div className="space-y-3">
      {/* Composer */}
      <ChangeComposer
        variant={composerVariant}
        alreadySelectedKeys={selectedFieldKeys}
        onApplyTemplate={onApplyTemplate}
        onAddFields={onAddFields}
      />

      {/* Chip row */}
      {selectedFieldKeys.length > 0 && (
        <div className="relative">
          <div className="flex items-start gap-1.5 flex-wrap min-h-[28px]">
            {selectedFieldKeys.map((fieldKey) => {
              const meta = FIELDS_BY_KEY.get(fieldKey)
              if (!meta) return null
              const Icon = meta.sectionIcon
              const mode = uniformByField?.[fieldKey] ?? 'uniform'
              const bulkValue = bulkValues?.[fieldKey]
              const hasBulk =
                mode === 'uniform' && bulkValue !== undefined && bulkValue !== ''
              return (
                <FieldChip
                  key={fieldKey}
                  fieldKey={fieldKey}
                  meta={meta}
                  Icon={Icon}
                  mode={mode}
                  bulkValue={bulkValue}
                  hasBulk={hasBulk}
                  editing={editingChipKey === fieldKey}
                  onOpenEditor={() => setEditingChipKey(fieldKey)}
                  onCloseEditor={() => setEditingChipKey(null)}
                  onToggleMode={() => onToggleUniform?.(fieldKey)}
                  onChangeBulkValue={(value) => onChangeBulkValue?.(fieldKey, value)}
                  onRemove={() => {
                    onRemoveField?.(fieldKey)
                    if (editingChipKey === fieldKey) setEditingChipKey(null)
                  }}
                />
              )
            })}

            {showModify && (
              <div ref={trimAnchorRef} className="relative">
                <button
                  type="button"
                  onClick={() => setTrimOpen((v) => !v)}
                  className={classNames(
                    'inline-flex items-center gap-1 h-7 px-2.5 rounded-full border text-[12px] font-medium transition-colors',
                    trimOpen
                      ? 'border-rippling-plum/40 bg-rippling-chip text-rippling-plum'
                      : 'border-rippling-line text-rippling-ink-2 hover:bg-rippling-surface-2',
                  )}
                  aria-expanded={trimOpen}
                >
                  <SlidersHorizontal size={11} strokeWidth={1.9} />
                  <span>Modify</span>
                  <span className="text-rippling-muted tabular-nums">
                    {selectedFieldKeys.length}
                  </span>
                </button>

                <TrimFieldsPanel
                  open={trimOpen}
                  selectedFieldKeys={selectedFieldKeys}
                  bulkValues={bulkValues}
                  onClose={() => setTrimOpen(false)}
                  onApply={handleTrimApply}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FieldChip({
  meta,
  Icon,
  mode,
  bulkValue,
  hasBulk,
  editing,
  onOpenEditor,
  onCloseEditor,
  onToggleMode,
  onChangeBulkValue,
  onRemove,
}) {
  const popoverRef = useRef(null)
  const [draft, setDraft] = useState(bulkValue ?? '')
  const isUniform = mode === 'uniform'

  useEffect(() => {
    if (editing) setDraft(bulkValue ?? '')
  }, [editing, bulkValue])

  useEffect(() => {
    if (!editing) return
    function handleOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onCloseEditor()
      }
    }
    function handleKey(event) {
      if (event.key === 'Escape') onCloseEditor()
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [editing, onCloseEditor])

  function applyValue() {
    onChangeBulkValue(draft)
    onCloseEditor()
  }

  function clearValue() {
    onChangeBulkValue('')
    onCloseEditor()
  }

  // The Uniform/Unique toggle is the heart of the chip: in Uniform mode the
  // chip surfaces an inline value editor; in Unique mode it collapses and
  // the user sets each row in the table.
  return (
    <span className="relative inline-flex">
      <span
        className={classNames(
          'group inline-flex items-stretch h-7 rounded-full border text-[12px] overflow-hidden transition-colors',
          hasBulk
            ? 'bg-rippling-chip border-rippling-plum/30 text-rippling-plum'
            : 'bg-white border-rippling-line text-rippling-ink-2',
        )}
      >
        {/* Label / value (clickable when Uniform) */}
        <button
          type="button"
          onClick={isUniform ? onOpenEditor : undefined}
          disabled={!isUniform}
          className={classNames(
            'flex items-center gap-1.5 h-full px-2',
            isUniform ? 'ui-interactive' : 'cursor-default',
          )}
          title={
            isUniform
              ? 'Click to set the value used for everyone'
              : 'Per-person values — set in the table below'
          }
        >
          {Icon && (
            <Icon
              size={11}
              strokeWidth={1.75}
              className={hasBulk ? 'text-rippling-plum' : 'text-rippling-muted'}
            />
          )}
          <span className={hasBulk ? 'text-rippling-plum/80' : 'text-rippling-muted'}>
            {meta.label}
          </span>
          {isUniform ? (
            hasBulk ? (
              <>
                <span className="text-rippling-plum/60">→</span>
                <span className="font-medium truncate max-w-[180px]">
                  {String(bulkValue)}
                </span>
              </>
            ) : (
              <span className="text-rippling-muted/80 italic">Set value…</span>
            )
          ) : (
            <span className="text-rippling-muted/80 italic">Per person</span>
          )}
        </button>

        {/* Mode toggle */}
        <button
          type="button"
          onClick={onToggleMode}
          className={classNames(
            'h-full px-1.5 ui-interactive flex items-center gap-1 border-l',
            hasBulk
              ? 'border-rippling-plum/20 text-rippling-plum/70 hover:text-rippling-plum'
              : 'border-rippling-line-2 text-rippling-muted hover:text-rippling-ink',
          )}
          aria-label={
            isUniform
              ? 'Switch to per-person values'
              : 'Switch to the same value for everyone'
          }
          title={
            isUniform
              ? 'Currently: same for all. Click for per-person.'
              : 'Currently: per person. Click for same-for-all.'
          }
        >
          {isUniform ? (
            <Users size={11} strokeWidth={1.9} />
          ) : (
            <User size={11} strokeWidth={1.9} />
          )}
          <span className="text-[10.5px] font-medium uppercase tracking-wide">
            {isUniform ? 'All' : 'Each'}
          </span>
        </button>

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          className={classNames(
            'h-full px-1.5 ui-interactive flex items-center justify-center border-l',
            hasBulk
              ? 'border-rippling-plum/20 text-rippling-plum/70 hover:text-rippling-plum'
              : 'border-rippling-line-2 text-rippling-muted hover:text-rippling-ink',
          )}
          aria-label={`Remove ${meta.label} field`}
        >
          <X size={11} strokeWidth={2} />
        </button>
      </span>

      {editing && isUniform && (
        <div
          ref={popoverRef}
          className="absolute z-30 left-0 top-full mt-2 w-[280px] rounded-xl border border-rippling-line bg-white shadow-rippling-dropdown anim-slide-in-bottom p-3"
        >
          <div className="flex items-center gap-1.5 mb-2">
            {Icon && (
              <Icon size={12} strokeWidth={1.75} className="text-rippling-muted" />
            )}
            <span className="text-[12.5px] font-medium text-rippling-ink truncate">
              Set {meta.label.toLowerCase()} for all
            </span>
          </div>
          <p className="text-[11.5px] text-rippling-muted mb-2 leading-relaxed">
            Applied as the default for every employee in the worklist. You can still
            override individual rows in the table.
          </p>
          <FieldInput
            field={{ ...meta, value: draft }}
            onChange={setDraft}
            placeholder={`New ${meta.label.toLowerCase()}`}
          />
          <div className="flex items-center justify-between gap-1.5 mt-3">
            <button
              type="button"
              onClick={clearValue}
              className="h-7 px-2 rounded-md text-[12px] text-rippling-muted hover:text-rippling-ink ui-interactive"
            >
              Clear
            </button>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onCloseEditor}
                className="h-7 px-2.5 rounded-md text-[12px] text-rippling-muted ui-interactive"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyValue}
                className="h-7 px-2.5 rounded-md text-[12px] font-medium bg-rippling-plum text-white hover:bg-rippling-plum-hover transition-colors"
              >
                Apply to all
              </button>
            </div>
          </div>
        </div>
      )}
    </span>
  )
}
