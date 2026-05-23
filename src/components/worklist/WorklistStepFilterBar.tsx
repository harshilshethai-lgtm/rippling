import { Check, ChevronDown, Plus, Search, X } from 'lucide-react'
import type { RefObject } from 'react'
import { filterAttributeSchema } from '../../mock/employees'
import type { DraftState, WorklistFilter } from './filterStepTypes'
import {
  FILTER_SCHEMA_BY_ATTRIBUTE,
  cn,
  formatFilterValue,
  isDraftComplete,
} from './filterStepUtils'

type Props = {
  filters: WorklistFilter[]
  pickerOpen: boolean
  pickerStep: 'attribute' | 'value'
  draft: DraftState
  scopedCategoricalOptions: string[]
  pickerRef: RefObject<HTMLDivElement>
  addFilterButtonRef: RefObject<HTMLButtonElement>
  onOpenAddFilter: () => void
  onOpenEditFilter: (filter: WorklistFilter) => void
  onRemoveFilter: (id: string) => void
  onSetPickerStep: (step: 'attribute' | 'value') => void
  onSetPickerOpen: (open: boolean) => void
  onDraftChange: (updater: (prev: DraftState) => DraftState) => void
  onAttributePick: (attribute: WorklistFilter['attribute']) => void
  onApplyFilter: () => void
}

export default function WorklistStepFilterBar({
  filters,
  pickerOpen,
  pickerStep,
  draft,
  scopedCategoricalOptions,
  pickerRef,
  addFilterButtonRef,
  onOpenAddFilter,
  onOpenEditFilter,
  onRemoveFilter,
  onSetPickerStep,
  onSetPickerOpen,
  onDraftChange,
  onAttributePick,
  onApplyFilter,
}: Props) {
  const hasAnyFilter = filters.length > 0
  const activeSchema = draft.attribute ? FILTER_SCHEMA_BY_ATTRIBUTE.get(draft.attribute) : null
  const optionMatches =
    activeSchema?.kind === 'categorical'
      ? scopedCategoricalOptions.filter((option) =>
          option.toLowerCase().includes(draft.optionSearch.trim().toLowerCase()),
        )
      : []

  return (
    <div className="max-w-[1080px] mx-auto relative" ref={pickerRef}>
      {!hasAnyFilter ? (
        <div className="rounded-2xl border border-purple-200 bg-purple-50 px-4 py-4 flex items-center justify-between gap-3 anim-gentle-glow">
          <div className="flex items-center gap-2 text-rippling-ink-2">
            <Search size={16} className="text-rippling-muted" />
            <span className="text-[14px]">Begin by filtering employees to build your worklist</span>
          </div>
          <button
            ref={addFilterButtonRef}
            type="button"
            onClick={onOpenAddFilter}
            className="h-8 px-3 rounded-md bg-white border border-purple-200 text-[12.5px] font-medium text-rippling-plum ui-interactive flex items-center gap-1.5 shrink-0"
          >
            <Plus size={13} />
            Add filter
            <ChevronDown size={13} />
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-rippling-line bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => onOpenEditFilter(filter)}
                className="h-8 px-2.5 rounded-full bg-rippling-chip text-[12.5px] text-rippling-ink-2 flex items-center gap-2 ui-interactive-chip"
              >
                <span>
                  {filter.attribute}: {formatFilterValue(filter)}
                </span>
                <span
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemoveFilter(filter.id)
                  }}
                  className="h-4 w-4 rounded-full bg-white border border-rippling-line text-rippling-muted flex items-center justify-center"
                >
                  <X size={11} />
                </span>
              </button>
            ))}
            <button
              ref={addFilterButtonRef}
              type="button"
              onClick={onOpenAddFilter}
              className="h-8 px-3 rounded-md border border-rippling-line text-[12.5px] font-medium text-rippling-ink-2 ui-interactive flex items-center gap-1.5"
            >
              <Plus size={13} />
              Add filter
              <ChevronDown size={13} />
            </button>
          </div>
        </div>
      )}

      {pickerOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] rounded-xl border border-rippling-line bg-white shadow-rippling-dropdown z-20 anim-slide-in-bottom">
          {pickerStep === 'attribute' ? (
            <>
              <div className="px-4 py-3 border-b border-rippling-line text-[12px] uppercase tracking-wide text-rippling-muted font-semibold">
                Pick an attribute
              </div>
              <div className="p-2">
                {filterAttributeSchema.map((item) => (
                  <button
                    key={item.attribute}
                    type="button"
                    onClick={() => onAttributePick(item.attribute)}
                    className="w-full h-9 px-2 rounded-md text-left text-[13px] text-rippling-ink-2 ui-interactive"
                  >
                    {item.attribute}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-semibold text-rippling-ink">{draft.attribute}</p>
                <button
                  type="button"
                  onClick={() => onSetPickerStep('attribute')}
                  className="text-[12px] text-rippling-muted hover:text-rippling-ink"
                >
                  Change
                </button>
              </div>

              {activeSchema && (
                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-rippling-muted font-semibold">Operator</p>
                    <select
                      value={draft.operator}
                      onChange={(event) =>
                        onDraftChange((previous) => ({
                          ...previous,
                          operator: event.target.value,
                          value:
                            activeSchema.kind === 'date' ? { from: '', to: '' } : previous.value,
                        }))
                      }
                      className="w-full h-9 rounded-md border border-rippling-line px-2 text-[13px] bg-white"
                    >
                      {activeSchema.operators.map((operator) => (
                        <option key={operator} value={operator}>
                          {operator}
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeSchema.kind === 'categorical' && (
                    <div>
                      <div className="relative mb-2">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rippling-muted" />
                        <input
                          value={draft.optionSearch}
                          onChange={(event) =>
                            onDraftChange((previous) => ({ ...previous, optionSearch: event.target.value }))
                          }
                          placeholder="Search values..."
                          className="w-full h-9 rounded-md border border-rippling-line pl-8 pr-2 text-[13px]"
                        />
                      </div>
                      <div className="max-h-44 overflow-auto rounded-md border border-rippling-line p-1 space-y-1">
                        {optionMatches.map((option) => {
                          const selected = Array.isArray(draft.value) && draft.value.includes(option)
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                onDraftChange((previous) => {
                                  const current = Array.isArray(previous.value) ? previous.value : []
                                  return {
                                    ...previous,
                                    value: selected ? current.filter((item) => item !== option) : [...current, option],
                                  }
                                })
                              }
                              className={cn(
                                'w-full h-8 px-2 rounded-md text-left text-[13px] flex items-center justify-between',
                                selected ? 'bg-rippling-chip text-rippling-plum' : 'ui-interactive text-rippling-ink-2',
                              )}
                            >
                              <span>{option}</span>
                              {selected && <Check size={13} />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {activeSchema.kind === 'text' && (
                    <input
                      value={typeof draft.value === 'string' ? draft.value : ''}
                      onChange={(event) => onDraftChange((previous) => ({ ...previous, value: event.target.value }))}
                      placeholder="Enter text value..."
                      className="w-full h-9 rounded-md border border-rippling-line px-2 text-[13px]"
                    />
                  )}

                  {activeSchema.kind === 'numeric' && (
                    <div>
                      <input
                        type="number"
                        value={typeof draft.value === 'number' ? draft.value : 0}
                        onChange={(event) =>
                          onDraftChange((previous) => ({ ...previous, value: Number(event.target.value) }))
                        }
                        className="w-full h-9 rounded-md border border-rippling-line px-2 text-[13px]"
                      />
                      <p className="mt-1 text-[11.5px] text-rippling-muted">
                        {draft.attribute === 'Tenure' ? 'Tenure uses years.' : 'Level uses numeric L value (2-8).'}
                      </p>
                    </div>
                  )}

                  {activeSchema.kind === 'date' && (
                    <div className={cn('grid gap-2', draft.operator === 'between' ? 'grid-cols-2' : 'grid-cols-1')}>
                      <input
                        type="date"
                        value={typeof draft.value === 'object' && !Array.isArray(draft.value) ? draft.value.from : ''}
                        onChange={(event) =>
                          onDraftChange((previous) => ({
                            ...previous,
                            value: {
                              from: event.target.value,
                              to:
                                typeof previous.value === 'object' && !Array.isArray(previous.value)
                                  ? previous.value.to
                                  : '',
                            },
                          }))
                        }
                        className="h-9 rounded-md border border-rippling-line px-2 text-[13px]"
                      />
                      {draft.operator === 'between' && (
                        <input
                          type="date"
                          value={typeof draft.value === 'object' && !Array.isArray(draft.value) ? draft.value.to : ''}
                          onChange={(event) =>
                            onDraftChange((previous) => ({
                              ...previous,
                              value: {
                                from:
                                  typeof previous.value === 'object' && !Array.isArray(previous.value)
                                    ? previous.value.from
                                    : '',
                                to: event.target.value,
                              },
                            }))
                          }
                          className="h-9 rounded-md border border-rippling-line px-2 text-[13px]"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onSetPickerOpen(false)}
                  className="h-8 px-3 rounded-md border border-rippling-line text-[12.5px] text-rippling-ink-2 ui-interactive"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onApplyFilter}
                  disabled={!isDraftComplete(draft)}
                  className={cn(
                    'h-8 px-3 rounded-md text-[12.5px] font-medium',
                    isDraftComplete(draft)
                      ? 'bg-rippling-primary text-white hover:bg-rippling-primary-hover'
                      : 'bg-rippling-surface-2 text-rippling-muted cursor-not-allowed',
                  )}
                >
                  Apply filter
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
