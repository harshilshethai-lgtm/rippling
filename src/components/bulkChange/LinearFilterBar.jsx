import { useEffect, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { avatarClass, classNames, initials } from '../../lib/utils'
import { FILTER_SCHEMA } from './bulkChangeUtils'
import FilterPicker from './FilterPicker'
import MentionInput from './MentionInput'

function chipValueLabel(values) {
  if (values.length === 0) return '—'
  if (values.length === 1) return values[0]
  if (values.length === 2) return `${values[0]}, ${values[1]}`
  return `${values[0]}, ${values[1]} +${values.length - 2}`
}

/**
 * Linear-style filter bar: a search/mention input on top, then a chip row
 * that renders person chips for @-mentions, filter chips (click to edit, X to
 * remove), and an `+ Add filter` trigger that anchors the FilterPicker.
 */
export default function LinearFilterBar({
  search,
  onSearchChange,
  employees,
  chips,
  onAddChip,
  onUpdateChip,
  onRemoveChip,
  mentionedEmployees,
  onMention,
  onRemoveMention,
  onClearFilters,
  attributeCounts,
  scopeForAttribute,
}) {
  const [pickerState, setPickerState] = useState({ open: false, editing: null })
  const addButtonRef = useRef(null)

  useEffect(() => {
    function onKeyDown(event) {
      const target = event.target
      const tag = target?.tagName
      const isTextInput =
        tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTextInput) {
        event.preventDefault()
        setPickerState({ open: true, editing: null })
        addButtonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const excludeMentionIds = new Set(mentionedEmployees.map((employee) => employee.id))

  function openAddPicker() {
    setPickerState({ open: true, editing: null })
  }

  function openEditPicker(chip) {
    setPickerState({ open: true, editing: chip.id })
  }

  function closePicker() {
    setPickerState({ open: false, editing: null })
  }

  function handleApply({ attribute, values }) {
    if (pickerState.editing) {
      onUpdateChip?.(pickerState.editing, { attribute, values })
    } else {
      onAddChip?.({ attribute, values })
    }
    closePicker()
  }

  const editingChip = pickerState.editing
    ? chips.find((chip) => chip.id === pickerState.editing)
    : null

  const hasAnything = chips.length > 0 || mentionedEmployees.length > 0

  return (
    <div className="space-y-2">
      <MentionInput
        value={search}
        onValueChange={onSearchChange}
        employees={employees}
        excludeIds={excludeMentionIds}
        onMention={onMention}
      />

      <div className="relative">
        <div className="flex items-start gap-1.5 flex-wrap min-h-[28px]">
          {mentionedEmployees.map((employee) => (
            <span
              key={`mention-${employee.id}`}
              className="group inline-flex items-center h-7 pl-1 pr-1.5 rounded-full bg-white border border-rippling-line text-[12px] text-rippling-ink-2"
            >
              <span
                className={classNames(
                  'w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold mr-1.5',
                  avatarClass(employee.fullName),
                )}
              >
                {initials(employee.fullName)}
              </span>
              <span className="text-rippling-muted mr-1">@</span>
              <span className="font-medium mr-1">{employee.fullName}</span>
              <button
                type="button"
                onClick={() => onRemoveMention?.(employee.id)}
                className="h-4 w-4 rounded-full ui-interactive flex items-center justify-center text-rippling-muted hover:text-rippling-ink"
                aria-label={`Remove @${employee.fullName}`}
              >
                <X size={10} strokeWidth={2} />
              </button>
            </span>
          ))}

          {chips.map((chip) => {
            const Icon = FILTER_SCHEMA[chip.attribute]?.icon
            return (
              <span
                key={chip.id}
                className="group inline-flex items-center h-7 rounded-full bg-white border border-rippling-line text-[12px] text-rippling-ink-2 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => openEditPicker(chip)}
                  className="flex items-center gap-1.5 h-full px-2 ui-interactive"
                >
                  {Icon && <Icon size={11} strokeWidth={1.75} className="text-rippling-muted" />}
                  <span className="text-rippling-muted">{chip.attribute}</span>
                  <span className="text-rippling-muted">is</span>
                  <span className="font-medium text-rippling-ink truncate max-w-[180px]">
                    {chipValueLabel(chip.values)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveChip?.(chip.id)}
                  className="h-full px-1.5 ui-interactive flex items-center justify-center text-rippling-muted hover:text-rippling-ink border-l border-rippling-line-2"
                  aria-label={`Remove ${chip.attribute} filter`}
                >
                  <X size={11} strokeWidth={2} />
                </button>
              </span>
            )
          })}

          <button
            ref={addButtonRef}
            type="button"
            onClick={openAddPicker}
            className={classNames(
              'inline-flex items-center gap-1 h-7 px-2 rounded-full border border-dashed text-[12px] font-medium transition-colors',
              pickerState.open && !pickerState.editing
                ? 'border-rippling-plum/50 bg-rippling-chip text-rippling-plum'
                : 'border-rippling-line text-rippling-muted hover:text-rippling-ink-2 hover:border-rippling-ink-2/30',
            )}
          >
            <Plus size={12} strokeWidth={2} />
            <span>Add filter</span>
            <span className="ml-1 text-[10px] text-rippling-muted">/</span>
          </button>

          {hasAnything && (
            <button
              type="button"
              onClick={onClearFilters}
              className="ml-auto inline-flex items-center h-7 px-2 text-[12px] text-rippling-muted hover:text-rippling-ink ui-interactive rounded-md"
            >
              Clear filters
            </button>
          )}
        </div>

        <FilterPicker
          open={pickerState.open}
          anchorMode="left"
          initialAttribute={editingChip?.attribute || null}
          initialValues={editingChip?.values || []}
          attributeCounts={attributeCounts}
          scopeForAttribute={(attribute) =>
            scopeForAttribute(attribute, pickerState.editing)
          }
          onClose={closePicker}
          onApply={handleApply}
        />
      </div>
    </div>
  )
}
