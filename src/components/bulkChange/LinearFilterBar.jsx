import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Sparkles, X } from 'lucide-react'
import { avatarClass, classNames, initials } from '../../lib/utils'
import { FILTER_SCHEMA, formatChipValueLabel } from './bulkChangeUtils'
import FilterPicker from './FilterPicker'
import MentionInput from './MentionInput'
import AskAiPopover from './AskAiPopover'

/**
 * Linear-style filter bar: a search/mention input on top, then a chip row
 * that renders person chips for @-mentions, filter chips (click to edit, X to
 * remove), `+ Add filter`, and a sparkle "Ask AI" entry point.
 */
export default function LinearFilterBar({
  search,
  onSearchChange,
  employees,
  chips,
  onAddChip,
  onAddChips,
  onUpdateChip,
  onRemoveChip,
  mentionedEmployees,
  onMention,
  onRemoveMention,
  onClearFilters,
  attributeCounts,
  scopeForAttribute,
  aiContext,
}) {
  const [pickerState, setPickerState] = useState({ open: false, editing: null })
  const [askAi, setAskAi] = useState({ open: false, prompt: '' })
  const addButtonRef = useRef(null)
  const askAiButtonRef = useRef(null)

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
      if (event.key === '?' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTextInput) {
        event.preventDefault()
        setPickerState({ open: false, editing: null })
        setAskAi({ open: true, prompt: '' })
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

  const parserContext = useMemo(
    () => ({
      employees: aiContext?.employees || employees,
      departments: aiContext?.departments || [],
      locations: aiContext?.locations || [],
      managers: aiContext?.managers || [],
      titles: aiContext?.titles || [],
    }),
    [aiContext, employees],
  )

  function openAskAi(prompt) {
    setPickerState({ open: false, editing: null })
    setAskAi({ open: true, prompt: prompt || '' })
  }

  function closeAskAi() {
    setAskAi({ open: false, prompt: '' })
  }

  function handleApplyAiChips(provisionalChips) {
    if (!provisionalChips || provisionalChips.length === 0) {
      closeAskAi()
      return
    }
    onAddChips?.(provisionalChips)
    closeAskAi()
  }

  return (
    <div className="space-y-2">
      <MentionInput
        value={search}
        onValueChange={onSearchChange}
        employees={employees}
        excludeIds={excludeMentionIds}
        onMention={onMention}
        onAskAi={openAskAi}
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
                    {formatChipValueLabel(chip)}
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

          <button
            ref={askAiButtonRef}
            type="button"
            onClick={() => openAskAi('')}
            className={classNames(
              'inline-flex items-center gap-1 h-7 px-2 rounded-full border border-dashed text-[12px] font-medium transition-colors',
              askAi.open
                ? 'border-rippling-plum bg-rippling-chip text-rippling-plum shadow-sm ring-1 ring-rippling-plum/20'
                : 'border-purple-300 bg-purple-50 text-rippling-plum hover:bg-purple-100 hover:border-rippling-plum/50',
            )}
            aria-label="Ask AI to filter"
          >
            <Sparkles size={12} strokeWidth={2} className="text-rippling-primary" />
            <span>Ask AI</span>
            <span className="ml-1 text-[10px] text-rippling-plum/60">?</span>
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

        <AskAiPopover
          open={askAi.open}
          anchorMode="left"
          initialPrompt={askAi.prompt}
          parserContext={parserContext}
          onClose={closeAskAi}
          onApplyChips={handleApplyAiChips}
        />
      </div>
    </div>
  )
}
