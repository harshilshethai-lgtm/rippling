import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Pencil } from 'lucide-react'
import UserSelectionStep from './bulkChange/UserSelectionStep'
import DefineChangesStep from './bulkChange/DefineChangesStep'
import StepIndicator, { BULK_CHANGE_STEPS } from './bulkChange/StepIndicator'
import CsvImportButton from './bulkChange/csvImport/CsvImportButton'
import { classNames } from '../lib/utils'
import { upsertWorklist } from '../data/worklists'

const EMPTY_FILTERS = {
  department: [],
  location: [],
  manager: [],
  employmentType: [],
  status: [],
}

const INITIAL_STATS = { candidates: 0, selected: 0, filteredCount: 0, mentionedCount: 0 }

// Minimal lead object representing whoever creates the worklist
const WORKLIST_LEAD = { id: 'lead-me', name: 'Harshil Sheth', role: 'People Admin' }

export default function BulkChangePage({
  onNavigate,
  initialEmployeeIds = [],
  initialFilters = EMPTY_FILTERS,
}) {
  const [worklistName, setWorklistName] = useState('Untitled bulk change')
  const [nameEditing, setNameEditing] = useState(false)
  const [stepId, setStepId] = useState('select')
  const [selectionStats, setSelectionStats] = useState(INITIAL_STATS)
  const [finalizedEmployeeIds, setFinalizedEmployeeIds] = useState([])
  const nameInputRef = useRef(null)
  const worklistIdRef = useRef(null)

  // Persist a Draft entry as soon as the user enters the bulk change flow.
  // Subsequent useEffect calls update the same entry by id.
  useEffect(() => {
    if (worklistIdRef.current) return
    const entry = upsertWorklist({
      name: 'Untitled bulk change',
      status: 'Draft',
      bucket: 'drafts',
      role: 'Lead',
      leadName: WORKLIST_LEAD.name,
      step: 'select',
      peopleCount: 0,
    })
    worklistIdRef.current = entry.id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the persisted entry in sync with current editor state.
  useEffect(() => {
    if (!worklistIdRef.current) return
    upsertWorklist({
      id: worklistIdRef.current,
      name: worklistName?.trim() ? worklistName : 'Untitled bulk change',
      step: stepId,
      peopleCount:
        finalizedEmployeeIds.length > 0
          ? finalizedEmployeeIds.length
          : selectionStats.selected,
    })
  }, [worklistName, stepId, selectionStats.selected, finalizedEmployeeIds])

  const csvImportHandlerRef = useRef(null)
  const registerCsvImport = useCallback((handler) => {
    csvImportHandlerRef.current = handler
  }, [])
  const handleHeaderCsvImport = useCallback((payload) => {
    csvImportHandlerRef.current?.(payload)
  }, [])

  useEffect(() => {
    if (!nameEditing) return
    nameInputRef.current?.focus()
    nameInputRef.current?.select()
  }, [nameEditing])

  const handleSelectionChange = useCallback((stats) => {
    setSelectionStats(stats)
  }, [])

  const canContinueFromSelect = selectionStats.selected > 0 && stepId === 'select'
  const showRatio =
    selectionStats.selected > 0 && selectionStats.selected !== selectionStats.candidates

  function handleContinue() {
    if (!canContinueFromSelect) return
    // Freeze the selection so DefineChangesStep gets a stable count
    setFinalizedEmployeeIds(Array.from({ length: selectionStats.selected }, (_, i) => i))
    setStepId('changes')
  }

  function handleBackToSelect() {
    setStepId('select')
  }

  const currentStepIndex = BULK_CHANGE_STEPS.findIndex((s) => s.id === stepId)

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-rippling-surface">
      {/* ── Header ── */}
      <header className="h-14 px-5 border-b border-rippling-line bg-white flex items-center gap-4 shrink-0">
        {/* Back button — goes to list on step 1, back to select on step 2 */}
        <button
          type="button"
          onClick={stepId === 'select' ? () => onNavigate({ name: 'list' }) : handleBackToSelect}
          className="h-8 w-8 rounded-md ui-interactive flex items-center justify-center text-rippling-muted hover:text-rippling-ink shrink-0"
          aria-label={stepId === 'select' ? 'Back to People' : 'Back to Select people'}
          title={stepId === 'select' ? 'Back to People' : 'Back to Select people'}
        >
          <ArrowLeft size={15} strokeWidth={1.75} />
        </button>

        {/* Breadcrumb + editable name */}
        <div className="min-w-0 flex items-center gap-1.5 group">
          <span className="text-[12.5px] text-rippling-muted shrink-0">Bulk Changes</span>
          <span className="text-rippling-muted shrink-0" aria-hidden>›</span>
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
              className="text-[15px] font-medium text-rippling-ink bg-transparent border-b border-rippling-plum/40 focus:border-rippling-plum focus:outline-none min-w-0 max-w-[260px]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setNameEditing(true)}
              className="flex items-center gap-1.5 text-[15px] font-medium text-rippling-ink hover:text-rippling-plum transition-colors text-left min-w-0 max-w-[260px] rounded px-1 -mx-1 border-b border-dashed border-rippling-line hover:border-rippling-plum/50 group/name"
              title="Click to rename"
              aria-label={`Worklist name: ${worklistName}. Click to rename.`}
            >
              <span className="truncate">{worklistName}</span>
              <Pencil
                size={12}
                strokeWidth={1.75}
                className="text-rippling-muted/70 group-hover/name:text-rippling-plum shrink-0"
              />
            </button>
          )}
        </div>

        {/* Step indicator — centred */}
        <div className="flex-1 flex justify-center">
          <StepIndicator currentStepId={stepId} />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 shrink-0">
          {stepId === 'select' && (
            <CsvImportButton variant="header" onImported={handleHeaderCsvImport} />
          )}

          {stepId === 'select' && (
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinueFromSelect}
              className={classNames(
                'h-8 pl-3 pr-2.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors',
                canContinueFromSelect
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
          )}

          {stepId === 'changes' && (
            <button
              type="button"
              disabled
              className="h-8 pl-3 pr-2.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 bg-rippling-surface-2 text-rippling-muted cursor-not-allowed"
              title="Review & apply — coming in next step"
            >
              <span>Review changes</span>
              <ArrowRight size={13} strokeWidth={2} />
            </button>
          )}
        </div>
      </header>

      {/* ── Step content ── */}
      {stepId === 'select' && (
        <UserSelectionStep
          initialFilters={initialFilters}
          initialEmployeeIds={initialEmployeeIds}
          onSelectionChange={handleSelectionChange}
          registerCsvImport={registerCsvImport}
        />
      )}

      {stepId === 'changes' && (
        <DefineChangesStep
          selectedEmployeeIds={finalizedEmployeeIds}
          worklistName={worklistName}
          lead={WORKLIST_LEAD}
        />
      )}
    </div>
  )
}
