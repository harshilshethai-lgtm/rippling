import { useEffect, useRef, useState } from 'react'
import { Plus, X, ChevronDown, Sparkles, ArrowRight } from 'lucide-react'
import { CHANGE_FIELDS } from './derivationRules'
import { classNames } from '../../../lib/utils'

// Group the fields by section for the picker dropdown
function groupFieldsBySection(fields) {
  const groups = {}
  for (const f of fields) {
    if (!groups[f.section]) groups[f.section] = []
    groups[f.section].push(f)
  }
  return groups
}

const SECTION_ORDER = ['Role', 'Compensation', 'Job', 'Personal', 'IT', 'Documents']

/**
 * Picker dropdown for selecting a field to add to the change set.
 */
function FieldPickerDropdown({ selectedKeys, onSelect, onClose }) {
  const ref = useRef(null)
  const groups = groupFieldsBySection(CHANGE_FIELDS)

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 z-40" onMouseDown={onClose} />
      <div
        ref={ref}
        className="absolute z-50 left-0 top-full mt-1 w-60 rounded-lg border border-rippling-line bg-white shadow-rippling-dropdown py-1"
      >
        {SECTION_ORDER.filter((s) => groups[s]).map((section) => (
          <div key={section}>
            <div className="px-3 pt-2 pb-1">
              <span className="text-[10.5px] font-semibold text-rippling-muted uppercase tracking-wide">
                {section}
              </span>
            </div>
            {groups[section].map((field) => {
              const isSelected = selectedKeys.has(field.key)
              return (
                <button
                  key={field.key}
                  type="button"
                  disabled={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (!isSelected) {
                      onSelect(field.key)
                      onClose()
                    }
                  }}
                  className={classNames(
                    'w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors',
                    isSelected
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-rippling-surface cursor-pointer',
                  )}
                >
                  <field.Icon
                    size={13}
                    strokeWidth={1.75}
                    className={
                      isSelected ? 'text-rippling-muted' : 'text-rippling-plum'
                    }
                  />
                  <span className="text-[12.5px] text-rippling-ink">{field.label}</span>
                  {isSelected && (
                    <span className="ml-auto text-[10px] text-rippling-muted">Added</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </>
  )
}

/**
 * A single "Before → After" stub card for a selected change field.
 */
function ChangeCard({ fieldKey, onRemove }) {
  const field = CHANGE_FIELDS.find((f) => f.key === fieldKey)
  if (!field) return null

  return (
    <div className="bg-white border border-rippling-line rounded-lg p-4 shadow-rippling-card group relative">
      {/* Card header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-md bg-rippling-chip flex items-center justify-center">
            <field.Icon size={13} strokeWidth={1.75} className="text-rippling-plum" />
          </span>
          <span className="text-[13px] font-medium text-rippling-ink">{field.label}</span>
          {field.riskTier === 'high' && (
            <span className="text-[9.5px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded">
              High impact
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRemove(fieldKey)}
          className="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rippling-surface flex items-center justify-center text-rippling-muted hover:text-rippling-ink transition-all"
          aria-label={`Remove ${field.label} change`}
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Before → After columns */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        {/* Before */}
        <div className="rounded-md border border-rippling-line bg-rippling-surface px-3 py-2">
          <p className="text-[10px] text-rippling-muted font-medium uppercase tracking-wide mb-1">
            Before
          </p>
          <p className="text-[12.5px] text-rippling-muted italic">Current value</p>
        </div>

        <ArrowRight size={14} strokeWidth={1.75} className="text-rippling-muted shrink-0" />

        {/* After */}
        <div className="rounded-md border border-rippling-plum/30 bg-rippling-chip/20 px-3 py-2">
          <p className="text-[10px] text-rippling-plum font-medium uppercase tracking-wide mb-1">
            After
          </p>
          <p className="text-[12.5px] text-rippling-muted italic">Set new value…</p>
        </div>
      </div>

      {/* Bottom bar showing it affects all selected employees */}
      <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-rippling-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-rippling-plum/40 shrink-0" />
        Applies to all employees in worklist
        {field.riskTier === 'high' && (
          <span className="ml-auto flex items-center gap-1 text-amber-600">
            <Sparkles size={10} strokeWidth={2} />
            Triggers downstream rules
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Empty state shown when no fields have been added yet.
 */
function EmptyState({ onOpenPicker }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
      <div className="h-12 w-12 rounded-xl bg-rippling-chip flex items-center justify-center">
        <Plus size={22} strokeWidth={1.5} className="text-rippling-plum" />
      </div>
      <div>
        <p className="text-[14px] font-medium text-rippling-ink mb-1">
          No changes added yet
        </p>
        <p className="text-[12.5px] text-rippling-muted max-w-[260px]">
          Add a field to start building your change set. Each field generates the relevant
          approvers and process steps automatically.
        </p>
      </div>
      <button
        type="button"
        onClick={onOpenPicker}
        className="h-8 pl-3 pr-3 rounded-md bg-rippling-plum text-white text-[12.5px] font-medium hover:bg-rippling-plum-hover transition-colors shadow-sm flex items-center gap-1.5"
      >
        <Plus size={13} strokeWidth={2} />
        Add field to change
      </button>
    </div>
  )
}

/**
 * Main canvas for Step 2.
 * Shows an "Add field to change" button and renders Before|After stub cards
 * for each selected field. Communicates selections up via onSelectedKeysChange.
 */
export default function ChangeFieldsCanvas({
  selectedKeys,
  onAddField,
  onRemoveField,
  employeeCount,
}) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Canvas toolbar */}
      <div className="px-5 py-2.5 border-b border-rippling-line bg-white flex items-center gap-3 shrink-0">
        {/* Worklist count chip */}
        <span className="h-6 px-2.5 rounded-full bg-rippling-chip text-[12px] text-rippling-ink-2 font-medium flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rippling-plum shrink-0" />
          {employeeCount} {employeeCount === 1 ? 'employee' : 'employees'} in worklist
        </span>

        <div className="flex-1" />

        {/* Add field button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="h-7 pl-2.5 pr-2 rounded-md border border-rippling-line hover:border-rippling-plum/50 bg-white hover:bg-rippling-chip/20 text-[12.5px] font-medium text-rippling-ink-2 hover:text-rippling-plum flex items-center gap-1.5 transition-colors"
          >
            <Plus size={12} strokeWidth={2.5} />
            Add field
            <ChevronDown size={11} strokeWidth={2} className="text-rippling-muted" />
          </button>

          {pickerOpen && (
            <FieldPickerDropdown
              selectedKeys={selectedKeys}
              onSelect={onAddField}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Cards area */}
      <div className="flex-1 overflow-y-auto p-5 bg-rippling-surface">
        {selectedKeys.size === 0 ? (
          <EmptyState onOpenPicker={() => setPickerOpen(true)} />
        ) : (
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            {[...selectedKeys].map((key) => (
              <ChangeCard key={key} fieldKey={key} onRemove={onRemoveField} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
