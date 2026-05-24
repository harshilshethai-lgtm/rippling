import { useEffect, useRef, useState } from 'react'
import { Plus, Search, Sparkles, X } from 'lucide-react'
import { classNames } from '../../../lib/utils'
import { FIELDS_BY_KEY } from './fieldSchema'
import ChangeFieldPicker from './ChangeFieldPicker'
import FieldInput from '../../shared/FieldInput'

/**
 * Top bar for Define Changes. Visually mirrors LinearFilterBar so the page
 * feels like a sibling of Select Users — but the chips here represent
 * fields being edited (not filters narrowing employees).
 *
 *   • Search input on top — filters the employees in the editable table by
 *     name.
 *   • Chip row — one chip per selected field. Click chip to set/edit the
 *     "apply to all" bulk default. X removes the field.
 *   • + Add field button — opens ChangeFieldPicker.
 *   • Ask AI button — placeholder for natural-language change prompts.
 */
export default function ChangeFieldsFilterBar({
  search,
  onSearchChange,
  selectedFieldKeys,
  bulkValues,
  onAddFields,
  onRemoveField,
  onChangeBulkValue,
  employeeCount,
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editingChipKey, setEditingChipKey] = useState(null)
  const addButtonRef = useRef(null)

  // Keyboard shortcut: "/" to open the picker, mirrors LinearFilterBar.
  useEffect(() => {
    function onKeyDown(event) {
      const target = event.target
      const tag = target?.tagName
      const isTextInput =
        tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable
      if (
        event.key === '/' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTextInput
      ) {
        event.preventDefault()
        setPickerOpen(true)
        addButtonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleApplyPicker(keys) {
    onAddFields?.(keys)
    setPickerOpen(false)
  }

  return (
    <div className="space-y-2">
      {/* Employee search */}
      <div className="relative">
        <Search
          size={14}
          strokeWidth={1.9}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-rippling-muted"
        />
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder={`Search ${employeeCount} ${
            employeeCount === 1 ? 'employee' : 'employees'
          } in worklist...`}
          className="w-full h-9 pl-9 pr-3 text-[13px] rounded-md bg-rippling-surface border border-transparent placeholder:text-rippling-muted focus:outline-none focus:bg-white focus:border-rippling-line transition-colors"
        />
      </div>

      {/* Field chips + Add field button */}
      <div className="relative">
        <div className="flex items-start gap-1.5 flex-wrap min-h-[28px]">
          {selectedFieldKeys.map((fieldKey) => {
            const meta = FIELDS_BY_KEY.get(fieldKey)
            if (!meta) return null
            const Icon = meta.sectionIcon
            const bulkValue = bulkValues?.[fieldKey]
            const hasBulk = bulkValue !== undefined && bulkValue !== ''
            return (
              <FieldChip
                key={fieldKey}
                fieldKey={fieldKey}
                meta={meta}
                Icon={Icon}
                bulkValue={bulkValue}
                hasBulk={hasBulk}
                editing={editingChipKey === fieldKey}
                onOpenEditor={() => setEditingChipKey(fieldKey)}
                onCloseEditor={() => setEditingChipKey(null)}
                onChangeBulkValue={(value) => onChangeBulkValue?.(fieldKey, value)}
                onRemove={() => {
                  onRemoveField?.(fieldKey)
                  if (editingChipKey === fieldKey) setEditingChipKey(null)
                }}
              />
            )
          })}

          <button
            ref={addButtonRef}
            type="button"
            onClick={() => setPickerOpen(true)}
            className={classNames(
              'inline-flex items-center gap-1 h-7 px-2 rounded-full border border-dashed text-[12px] font-medium transition-colors',
              pickerOpen
                ? 'border-rippling-plum/50 bg-rippling-chip text-rippling-plum'
                : 'border-rippling-line text-rippling-muted hover:text-rippling-ink-2 hover:border-rippling-ink-2/30',
            )}
          >
            <Plus size={12} strokeWidth={2} />
            <span>Add field</span>
            <span className="ml-1 text-[10px] text-rippling-muted">/</span>
          </button>

          <button
            type="button"
            disabled
            title="Ask AI — coming soon"
            className="inline-flex items-center gap-1 h-7 px-2 rounded-full border border-dashed border-purple-200 bg-purple-50/60 text-rippling-plum/70 text-[12px] font-medium cursor-not-allowed opacity-70"
            aria-label="Ask AI to fill changes (coming soon)"
          >
            <Sparkles size={12} strokeWidth={2} className="text-rippling-primary" />
            <span>Ask AI</span>
          </button>
        </div>

        <ChangeFieldPicker
          open={pickerOpen}
          anchorMode="left"
          alreadySelectedKeys={selectedFieldKeys}
          onClose={() => setPickerOpen(false)}
          onApply={handleApplyPicker}
        />
      </div>
    </div>
  )
}

function FieldChip({
  meta,
  Icon,
  bulkValue,
  hasBulk,
  editing,
  onOpenEditor,
  onCloseEditor,
  onChangeBulkValue,
  onRemove,
}) {
  const popoverRef = useRef(null)
  const [draft, setDraft] = useState(bulkValue ?? '')

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

  return (
    <span className="relative inline-flex">
      <span
        className={classNames(
          'group inline-flex items-center h-7 rounded-full border text-[12px] overflow-hidden transition-colors',
          hasBulk
            ? 'bg-rippling-chip border-rippling-plum/30 text-rippling-plum'
            : 'bg-white border-rippling-line text-rippling-ink-2',
        )}
      >
        <button
          type="button"
          onClick={onOpenEditor}
          className="flex items-center gap-1.5 h-full px-2 ui-interactive"
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
          {hasBulk ? (
            <>
              <span className="text-rippling-plum/60">→</span>
              <span className="font-medium truncate max-w-[180px]">{String(bulkValue)}</span>
            </>
          ) : (
            <span className="text-rippling-muted/80 italic">Set value…</span>
          )}
        </button>
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

      {editing && (
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
