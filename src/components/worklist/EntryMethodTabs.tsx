import { Sparkles, Upload, UserRoundSearch, SlidersHorizontal, Plus, X } from 'lucide-react'

export type EntryMethod = 'filter' | 'ai' | 'paste' | 'manual'
export type FilterChip = { id: string; attribute: string; operator: string; value: string }

type PasteMatch = {
  raw: string
  status: 'matched' | 'ambiguous' | 'unmatched'
  employeeIds: string[]
  message: string
}

type Props = {
  activeMethod: EntryMethod
  onMethodChange: (method: EntryMethod) => void
  filterChips: FilterChip[]
  onAddFilter: () => void
  onUpdateFilter: (id: string, patch: Partial<FilterChip>) => void
  onRemoveFilter: (id: string) => void
  filterPreviewCount: number
  onAddAllFiltered: () => void
  aiPrompt: string
  onAiPromptChange: (value: string) => void
  onRunAi: () => void
  aiInterpretation: FilterChip[]
  aiOptions: FilterChip[][]
  onUseAiOption: (chips: FilterChip[]) => void
  onAddAllAi: () => void
  pasteValue: string
  onPasteValueChange: (value: string) => void
  onResolvePaste: () => void
  pasteMatches: PasteMatch[]
  onAddMatched: () => void
  manualQuery: string
  onManualQueryChange: (value: string) => void
}

const TAB_COPY: Array<{ id: EntryMethod; label: string; icon: typeof SlidersHorizontal }> = [
  { id: 'filter', label: 'Filter', icon: SlidersHorizontal },
  { id: 'ai', label: 'Ask AI', icon: Sparkles },
  { id: 'paste', label: 'Paste / Upload', icon: Upload },
  { id: 'manual', label: 'Manual search', icon: UserRoundSearch },
]

const ATTRIBUTES = ['Department', 'Manager', 'Title', 'Level', 'Location', 'Employment type', 'Tenure', 'Custom fields']
const OPERATORS = ['is', 'is not', 'contains', 'is one of', 'is empty']

export default function EntryMethodTabs(props: Props) {
  return (
    <aside className="w-[280px] border-r border-rippling-line bg-white p-3 overflow-auto">
      <div className="space-y-1">
        {TAB_COPY.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => props.onMethodChange(tab.id)}
              className={`w-full h-9 px-2 rounded-md text-left text-[13px] flex items-center gap-2 transition-colors ${
                props.activeMethod === tab.id
                  ? 'bg-rippling-chip text-rippling-plum font-medium'
                  : 'text-rippling-ink-2 ui-interactive-chip'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 rounded-lg border border-rippling-line bg-rippling-surface p-3">
        {props.activeMethod === 'filter' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-rippling-ink">Filters</h3>
              <button
                type="button"
                onClick={props.onAddFilter}
                className="h-7 px-2 rounded-md bg-white border border-rippling-line text-[12px] text-rippling-ink-2 flex items-center gap-1"
              >
                <Plus size={12} />
                Add
              </button>
            </div>
            {props.filterChips.length === 0 ? (
              <p className="text-[12px] text-rippling-muted">Add filters to build the worklist without loading everyone.</p>
            ) : (
              props.filterChips.map((chip) => (
                <div key={chip.id} className="rounded-md border border-rippling-line bg-white p-2 space-y-2">
                  <div className="grid grid-cols-[1fr_1fr_24px] gap-1">
                    <select
                      value={chip.attribute}
                      onChange={(event) => props.onUpdateFilter(chip.id, { attribute: event.target.value })}
                      className="h-7 rounded-md border border-rippling-line bg-white px-2 text-[12px] focus:outline-none"
                    >
                      {ATTRIBUTES.map((attribute) => (
                        <option key={attribute} value={attribute}>
                          {attribute}
                        </option>
                      ))}
                    </select>
                    <select
                      value={chip.operator}
                      onChange={(event) => props.onUpdateFilter(chip.id, { operator: event.target.value })}
                      className="h-7 rounded-md border border-rippling-line bg-white px-2 text-[12px] focus:outline-none"
                    >
                      {OPERATORS.map((operator) => (
                        <option key={operator} value={operator}>
                          {operator}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => props.onRemoveFilter(chip.id)}
                      className="h-7 w-6 rounded-md text-rippling-muted hover:text-rippling-ink ui-interactive"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <input
                    value={chip.value}
                    onChange={(event) => props.onUpdateFilter(chip.id, { value: event.target.value })}
                    placeholder="Value (multi-values comma-separated)"
                    className="w-full h-7 rounded-md border border-rippling-line bg-white px-2 text-[12px] focus:outline-none"
                  />
                </div>
              ))
            )}
            <div className="pt-1 border-t border-rippling-line-2">
              <p className="text-[12px] text-rippling-muted mb-2">{props.filterPreviewCount} employees match these filters</p>
              <button
                type="button"
                onClick={props.onAddAllFiltered}
                className="h-8 w-full rounded-md bg-rippling-plum text-white text-[12.5px] font-medium hover:bg-rippling-plum-hover transition-colors"
              >
                Add all to worklist
              </button>
            </div>
          </div>
        )}

        {props.activeMethod === 'ai' && (
          <div className="space-y-3">
            <h3 className="text-[13px] font-semibold text-rippling-ink">Ask AI</h3>
            <textarea
              value={props.aiPrompt}
              onChange={(event) => props.onAiPromptChange(event.target.value)}
              placeholder="e.g., All engineers in NYC who report to Maya Singh"
              className="w-full min-h-[84px] rounded-md border border-rippling-line bg-white p-2 text-[12.5px] focus:outline-none resize-y"
            />
            <button
              type="button"
              onClick={props.onRunAi}
              className="h-8 w-full rounded-md bg-rippling-plum text-white text-[12.5px] font-medium"
            >
              Interpret query
            </button>
            {props.aiInterpretation.length > 0 && (
              <div className="rounded-md border border-rippling-line bg-white p-2">
                <p className="text-[12px] text-rippling-muted mb-1">These look right?</p>
                <div className="flex flex-wrap gap-1">
                  {props.aiInterpretation.map((chip) => (
                    <span key={chip.id} className="px-2 py-1 rounded-full bg-rippling-chip text-rippling-plum text-[11px]">
                      {chip.attribute}: {chip.value}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={props.onAddAllAi}
                  className="mt-2 h-7 w-full rounded-md border border-rippling-line text-[12px] font-medium text-rippling-ink"
                >
                  Found matches [Add all]
                </button>
              </div>
            )}
            {props.aiOptions.length > 0 && (
              <div className="space-y-2">
                <p className="text-[12px] text-rippling-muted">This query is ambiguous. Pick one:</p>
                {props.aiOptions.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => props.onUseAiOption(option)}
                    className="w-full text-left rounded-md border border-rippling-line bg-white p-2 hover:border-rippling-plum/40 transition-colors"
                  >
                    <div className="flex flex-wrap gap-1">
                      {option.map((chip) => (
                        <span key={chip.id} className="px-2 py-0.5 rounded-full bg-rippling-surface-2 text-[11px] text-rippling-ink-2">
                          {chip.attribute}: {chip.value}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {props.activeMethod === 'paste' && (
          <div className="space-y-3">
            <h3 className="text-[13px] font-semibold text-rippling-ink">Paste / Upload</h3>
            <textarea
              value={props.pasteValue}
              onChange={(event) => props.onPasteValueChange(event.target.value)}
              placeholder="Paste emails, names, or employee IDs. One per line."
              className="w-full min-h-[96px] rounded-md border border-dashed border-rippling-line bg-white p-2 text-[12.5px] focus:outline-none resize-y"
            />
            <button
              type="button"
              onClick={props.onResolvePaste}
              className="h-8 w-full rounded-md bg-rippling-plum text-white text-[12.5px] font-medium"
            >
              Match entries
            </button>
            {props.pasteMatches.length > 0 && (
              <div className="max-h-[220px] overflow-auto rounded-md border border-rippling-line bg-white">
                {props.pasteMatches.map((match, index) => (
                  <div key={`${match.raw}-${index}`} className="border-b border-rippling-line-2 last:border-b-0 px-2 py-1.5 text-[12px]">
                    <span
                      className={`mr-1 font-semibold ${
                        match.status === 'matched'
                          ? 'text-emerald-600'
                          : match.status === 'ambiguous'
                            ? 'text-amber-600'
                            : 'text-rose-600'
                      }`}
                    >
                      {match.status === 'matched' ? '✓' : match.status === 'ambiguous' ? '⚠' : '✗'}
                    </span>
                    <span className="text-rippling-ink">{match.raw}</span>
                    <p className="text-rippling-muted">{match.message}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={props.onAddMatched}
              className="h-8 w-full rounded-md border border-rippling-line bg-white text-[12.5px] font-medium text-rippling-ink"
            >
              Add matched
            </button>
          </div>
        )}

        {props.activeMethod === 'manual' && (
          <div className="space-y-3">
            <h3 className="text-[13px] font-semibold text-rippling-ink">Manual search</h3>
            <input
              value={props.manualQuery}
              onChange={(event) => props.onManualQueryChange(event.target.value)}
              placeholder="Search name or email to add manually"
              className="w-full h-8 rounded-md border border-rippling-line bg-white px-2 text-[12.5px] focus:outline-none"
            />
            <p className="text-[12px] text-rippling-muted">
              Use checkboxes in the center list or hit <kbd className="px-1 py-0.5 rounded bg-white border border-rippling-line">x</kbd> on hovered row.
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
