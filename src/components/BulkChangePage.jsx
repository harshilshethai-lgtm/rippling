import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Pencil } from 'lucide-react'
import StepIndicator, { BULK_CHANGE_STEPS } from './bulkChange/StepIndicator'
import UserSelectionStep from './bulkChange/UserSelectionStep'
import { classNames } from '../lib/utils'

const EMPTY_FILTERS = {
  department: [],
  location: [],
  manager: [],
  employmentType: [],
  status: [],
}

const INITIAL_STATS = { candidates: 0, selected: 0, filteredCount: 0, mentionedCount: 0 }

export default function BulkChangePage({
  onNavigate,
  initialEmployeeIds = [],
  initialFilters = EMPTY_FILTERS,
}) {
  const [worklistName, setWorklistName] = useState('Untitled bulk change')
  const [nameEditing, setNameEditing] = useState(false)
  const [stepId] = useState('select')
  const [selectionStats, setSelectionStats] = useState(INITIAL_STATS)
  const nameInputRef = useRef(null)

  useEffect(() => {
    if (!nameEditing) return
    nameInputRef.current?.focus()
    nameInputRef.current?.select()
  }, [nameEditing])

  const handleSelectionChange = useCallback((stats) => {
    setSelectionStats(stats)
  }, [])

  const canContinue = selectionStats.selected > 0 && stepId === 'select'
  const showRatio =
    selectionStats.selected > 0 && selectionStats.selected !== selectionStats.candidates

  function handleContinue() {
    if (!canContinue) return
    alert(
      `Continue to "${BULK_CHANGE_STEPS[1].label}" with ${selectionStats.selected} ${
        selectionStats.selected === 1 ? 'employee' : 'employees'
      } in the worklist.\n\nFollow-up steps will be implemented next.`,
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-rippling-surface">
      <header className="h-14 px-5 border-b border-rippling-line bg-white flex items-center gap-4">
        <button
          type="button"
          onClick={() => onNavigate({ name: 'list' })}
          className="h-8 w-8 rounded-md ui-interactive flex items-center justify-center text-rippling-muted hover:text-rippling-ink shrink-0"
          aria-label="Back to People"
          title="Back to People"
        >
          <ArrowLeft size={15} strokeWidth={1.75} />
        </button>

        <div className="min-w-0 flex items-center gap-1.5 group">
          <span className="text-[12.5px] text-rippling-muted shrink-0">Bulk Changes</span>
          <span className="text-rippling-muted shrink-0" aria-hidden>
            ›
          </span>
          {nameEditing ? (
            <input
              ref={nameInputRef}
              value={worklistName}
              onChange={(event) => setWorklistName(event.target.value)}
              onBlur={() => setNameEditing(false)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === 'Escape') {
                  event.preventDefault()
                  setNameEditing(false)
                }
              }}
              className="text-[15px] font-medium text-rippling-ink bg-transparent border-b border-rippling-plum/40 focus:border-rippling-plum focus:outline-none min-w-0 max-w-[360px]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setNameEditing(true)}
              className="flex items-center gap-1.5 text-[15px] font-medium text-rippling-ink hover:text-rippling-plum transition-colors text-left min-w-0 max-w-[360px]"
              title="Rename worklist"
            >
              <span className="truncate">{worklistName}</span>
              <Pencil
                size={12}
                strokeWidth={1.75}
                className="text-rippling-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              />
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <StepIndicator currentStepId={stepId} />
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className={classNames(
              'h-8 pl-3 pr-2.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors',
              canContinue
                ? 'bg-rippling-plum text-white hover:bg-rippling-plum-hover shadow-sm'
                : 'bg-rippling-surface-2 text-rippling-muted cursor-not-allowed',
            )}
          >
            <span>Continue</span>
            {selectionStats.selected > 0 && (
              <span className="bg-white/20 text-white text-[11px] font-semibold px-1.5 rounded tabular-nums">
                {showRatio
                  ? `${selectionStats.selected}/${selectionStats.candidates}`
                  : selectionStats.selected}
              </span>
            )}
            <ArrowRight size={13} strokeWidth={2} />
          </button>
        </div>
      </header>

      {stepId === 'select' && (
        <UserSelectionStep
          initialFilters={initialFilters}
          initialEmployeeIds={initialEmployeeIds}
          onSelectionChange={handleSelectionChange}
        />
      )}
    </div>
  )
}
