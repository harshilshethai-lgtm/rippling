import { ChevronDown, ChevronUp, X } from 'lucide-react'
import type { Employee } from '../../mock/employees'

type Props = {
  selectedCount: number
  selectedEmployees: Employee[]
  selectedInViewCount: number
  selectedOutsideViewCount: number
  expanded: boolean
  onToggleExpanded: () => void
  onToggleSelected: (id: string) => void
  onClearAll: () => void
}

export default function WorklistStepSelectionTray({
  selectedCount,
  selectedEmployees,
  selectedInViewCount,
  selectedOutsideViewCount,
  expanded,
  onToggleExpanded,
  onToggleSelected,
  onClearAll,
}: Props) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed left-0 right-0 bottom-0 border-t border-rippling-line bg-white px-5 py-3 shadow-[0_-2px_14px_rgba(0,0,0,0.06)]">
      <div className="max-w-[1080px] mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-rippling-ink">{selectedCount} selected</span>
            <span className="text-[12.5px] text-rippling-muted">
              {selectedInViewCount} in current view
              {selectedOutsideViewCount > 0 && ` · ${selectedOutsideViewCount} outside current view`}
            </span>
            <button
              type="button"
              onClick={onToggleExpanded}
              className="h-7 px-2 rounded-md text-[12.5px] text-rippling-ink-2 border border-rippling-line ui-interactive flex items-center gap-1.5"
            >
              View selection
              {expanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </button>
          </div>
          <button
            type="button"
            className="h-8 px-3 rounded-md bg-rippling-primary text-white text-[12.5px] font-medium hover:bg-rippling-primary-hover"
          >
            Continue
          </button>
        </div>

        {expanded && (
          <div className="mt-3 rounded-lg border border-rippling-line bg-rippling-surface max-h-36 overflow-auto p-2">
            <div className="flex flex-wrap gap-2">
              {selectedEmployees.map((employee) => (
                <span
                  key={employee.id}
                  className="h-7 pl-2.5 pr-1 rounded-full bg-white border border-rippling-line text-[12px] text-rippling-ink-2 flex items-center gap-1.5"
                >
                  {employee.name}
                  <button
                    type="button"
                    onClick={() => onToggleSelected(employee.id)}
                    className="h-5 w-5 rounded-full ui-interactive flex items-center justify-center text-rippling-muted"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <button type="button" onClick={onClearAll} className="mt-2 text-[12px] text-rippling-muted hover:text-rippling-ink">
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
