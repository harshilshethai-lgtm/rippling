import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Pencil } from 'lucide-react'
import { EMPLOYEES } from '../data/employees'
import UserSelectionStep from './bulkChange/UserSelectionStep'
import DefineChangeSetStep from './bulkChange/DefineChangeSetStep'
import MakeChangesStep from './bulkChange/MakeChangesStep'
import FollowUpsStep from './bulkChange/followUps/FollowUpsStep'
import ReviewApplyStep from './bulkChange/review/ReviewApplyStep'
import StepIndicator, { BULK_CHANGE_STEPS } from './bulkChange/StepIndicator'
import { getDepartmentsOwnedByPerson } from './bulkChange/followUps/departments/useDepartmentTasks'
import { DEPARTMENTS_BY_ID } from './bulkChange/followUps/departments/DEPARTMENTS'
import { classNames } from '../lib/utils'
import { upsertWorklist } from '../data/worklists'

const EMPTY_FILTERS = {
  department: [],
  location: [],
  manager: [],
  employmentType: [],
  status: [],
}

const INITIAL_STATS = { candidates: 0, selected: 0, filteredCount: 0, mentionedCount: 0, ids: [] }

const EMPTY_MANUAL_PEOPLE = {
  observers: [],
  approvers: [],
  collaborators: [],
}

function buildDefaultEffectiveDateTime() {
  const now = new Date()
  let hour = now.getHours()
  const minute = now.getMinutes()
  const ampm = hour >= 12 ? 'PM' : 'AM'
  hour = hour % 12 || 12
  return {
    date: now.toISOString().slice(0, 10),
    hour,
    minute,
    ampm,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

// Minimal lead object representing whoever creates the worklist
const WORKLIST_LEAD = { id: 'lead-me', name: 'Harshil Sheth', role: 'People Admin' }

/**
 * Orchestrates the four-step Bulk Change wizard:
 *   1. select   — pick people
 *   2. define   — pick fields (the "change set")
 *   3. edit     — fill in per-row values in the table
 *   4. review   — (future) preview + apply
 *
 * Changeset state (selectedFieldKeys, bulkValues, cellOverrides,
 * uniformByField, manualPeople) lives here, not in the child steps, so the
 * user can move forward/back between Define and Make Changes without
 * losing any progress.
 *
 * Per-column resolution contract (see MakeChangesStep / ChangesTable):
 *   Uniform: override → bulk default → current employee value
 *   Unique:  override → current employee value
 *
 * Toggling a column to Unique never wipes its bulkValues entry — flipping
 * back to Uniform restores the previous "apply to all" value. This is the
 * non-destructive mode contract.
 */
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

  // Changeset state — lives at the wizard level so it persists across the
  // Define ↔ Make Changes navigation.
  const [selectedFieldKeys, setSelectedFieldKeys] = useState([])
  const [bulkValues, setBulkValues] = useState({})
  const [cellOverrides, setCellOverrides] = useState({})
  const [uniformByField, setUniformByField] = useState({})
  const [manualPeople, setManualPeople] = useState(EMPTY_MANUAL_PEOPLE)
  const [effectiveDateTime, setEffectiveDateTime] = useState(buildDefaultEffectiveDateTime)
  const [stagedCsvDraft, setStagedCsvDraft] = useState(null)

  // Department follow-ups state — lifted to the wizard so it survives the
  // Back/Forward navigation between Follow ups and earlier steps.
  // Shape:
  //   tasksByDepartment: { [deptId]: Task[] }
  //   ownerByDepartment: { [deptId]: { id, name, role } | null }
  // See followUps/departments/useDepartmentTasks.js for the Task shape.
  const [tasksByDepartment, setTasksByDepartment] = useState({})
  const [ownerByDepartment, setOwnerByDepartment] = useState({})

  // Preview event approver state — keyed by event id so it survives step
  // navigation. Also used by the right-rail approver list (one-way sync via
  // onAddApprover inside FollowUpsStep).
  // Shape: { [eventId]: { id, name, role } }
  const [approverByEventId, setApproverByEventId] = useState({})

  // Department approval state — keyed by deptId.
  // Shape: { [deptId]: { action: 'approved'|'approvedWithExceptions'|'rejected'|'requestChanges'|null, exceptions: string } | null }
  const [approvalByDepartment, setApprovalByDepartment] = useState({})

  // SLA date per department — keyed by deptId.
  // Shape: { [deptId]: 'YYYY-MM-DD' | null }
  const [slaByDepartment, setSlaByDepartment] = useState({})

  const handleEffectiveDateTimeChange = useCallback((patch) => {
    setEffectiveDateTime((prev) => ({ ...prev, ...patch }))
  }, [])

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

  useEffect(() => {
    if (!nameEditing) return
    nameInputRef.current?.focus()
    nameInputRef.current?.select()
  }, [nameEditing])

  const handleSelectionChange = useCallback((stats) => {
    setSelectionStats(stats)
  }, [])

  // ── Step transitions ────────────────────────────────────────────────────

  const canContinueFromSelect = selectionStats.selected > 0 && stepId === 'select'
  const canContinueFromDefine = selectedFieldKeys.length > 0 && stepId === 'define'
  const showRatio =
    selectionStats.selected > 0 && selectionStats.selected !== selectionStats.candidates

  function handleContinue() {
    if (stepId === 'select' && canContinueFromSelect) {
      // Freeze the actual selected employee IDs so MakeChangesStep can
      // render names, avatars, and look up current field values per
      // employee.
      setFinalizedEmployeeIds(selectionStats.ids ?? [])
      setStepId('define')
      return
    }
    if (stepId === 'define' && canContinueFromDefine) {
      setStepId('edit')
      return
    }
    if (stepId === 'edit') {
      setStepId('followups')
      return
    }
    if (stepId === 'followups') {
      setStepId('review')
    }
  }

  function handleBack() {
    if (stepId === 'review') {
      setStepId('followups')
      return
    }
    if (stepId === 'followups') {
      setStepId('edit')
      return
    }
    if (stepId === 'edit') {
      setStepId('define')
      return
    }
    if (stepId === 'define') {
      setStepId('select')
      return
    }
    onNavigate({ name: 'list' })
  }

  // ── Field management ────────────────────────────────────────────────────

  const handleAddFields = useCallback((keys) => {
    setSelectedFieldKeys((prev) => {
      const seen = new Set(prev)
      const next = [...prev]
      for (const key of keys) {
        if (!seen.has(key)) {
          next.push(key)
          seen.add(key)
        }
      }
      return next
    })
  }, [])

  // Apply a whole template in one shot — adds the fieldKeys (de-duped) and
  // seeds bulkValues from the template's `defaults` for keys that don't yet
  // have a value. Doesn't clobber a value the user already typed.
  const handleApplyTemplate = useCallback((template) => {
    if (!template) return
    const incoming = template.fieldKeys ?? []
    setSelectedFieldKeys((prev) => {
      const seen = new Set(prev)
      const next = [...prev]
      for (const key of incoming) {
        if (!seen.has(key)) {
          next.push(key)
          seen.add(key)
        }
      }
      return next
    })
    if (template.defaults && Object.keys(template.defaults).length > 0) {
      setBulkValues((prev) => {
        const next = { ...prev }
        for (const [k, v] of Object.entries(template.defaults)) {
          if (next[k] === undefined || next[k] === '') next[k] = v
        }
        return next
      })
    }
  }, [])

  const handleRemoveField = useCallback((key) => {
    setSelectedFieldKeys((prev) => prev.filter((k) => k !== key))
    setBulkValues((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    setUniformByField((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    setCellOverrides((prev) => {
      let changed = false
      const next = {}
      for (const [empId, fieldMap] of Object.entries(prev)) {
        if (fieldMap && key in fieldMap) {
          const { [key]: _, ...rest } = fieldMap
          changed = true
          if (Object.keys(rest).length > 0) next[empId] = rest
        } else if (fieldMap && Object.keys(fieldMap).length > 0) {
          next[empId] = fieldMap
        }
      }
      return changed ? next : prev
    })
  }, [])

  // Bulk-remove (used by the Modify trim panel) so the table only re-renders
  // once when the user drops many fields at once.
  const handleRemoveFields = useCallback((keys) => {
    if (!keys || keys.length === 0) return
    const keySet = new Set(keys)
    setSelectedFieldKeys((prev) => prev.filter((k) => !keySet.has(k)))
    setBulkValues((prev) => {
      let changed = false
      const next = {}
      for (const [k, v] of Object.entries(prev)) {
        if (keySet.has(k)) {
          changed = true
          continue
        }
        next[k] = v
      }
      return changed ? next : prev
    })
    setUniformByField((prev) => {
      let changed = false
      const next = {}
      for (const [k, v] of Object.entries(prev)) {
        if (keySet.has(k)) {
          changed = true
          continue
        }
        next[k] = v
      }
      return changed ? next : prev
    })
    setCellOverrides((prev) => {
      let changed = false
      const next = {}
      for (const [empId, fieldMap] of Object.entries(prev)) {
        if (!fieldMap) continue
        const filtered = {}
        for (const [k, v] of Object.entries(fieldMap)) {
          if (keySet.has(k)) {
            changed = true
            continue
          }
          filtered[k] = v
        }
        if (Object.keys(filtered).length > 0) next[empId] = filtered
      }
      return changed ? next : prev
    })
  }, [])

  const handleChangeBulkValue = useCallback((fieldKey, value) => {
    setBulkValues((prev) => {
      if (value === '' || value === undefined) {
        if (!(fieldKey in prev)) return prev
        const next = { ...prev }
        delete next[fieldKey]
        return next
      }
      return { ...prev, [fieldKey]: value }
    })
  }, [])

  const handleChangeCell = useCallback((empId, fieldKey, value) => {
    setCellOverrides((prev) => {
      const existing = prev[empId] ?? {}
      const next = { ...prev, [empId]: { ...existing, [fieldKey]: value } }
      return next
    })
  }, [])

  const handleApplyCsvStatePatch = useCallback((patch) => {
    if (!patch) return
    if (patch.bulkValues) {
      setBulkValues((prev) => ({ ...prev, ...patch.bulkValues }))
    }
    if (patch.uniformByField) {
      setUniformByField((prev) => ({ ...prev, ...patch.uniformByField }))
    }
    if (patch.cellOverrides) {
      setCellOverrides((prev) => {
        const next = { ...prev }
        for (const [employeeId, fieldMap] of Object.entries(patch.cellOverrides)) {
          next[employeeId] = { ...(next[employeeId] ?? {}), ...(fieldMap ?? {}) }
        }
        return next
      })
    }
  }, [])

  const handleStageCsvDraft = useCallback((draft) => {
    setStagedCsvDraft(draft)
  }, [])

  const handleResetOverrides = useCallback(() => {
    setCellOverrides({})
  }, [])

  // Toggle a column between 'uniform' and 'unique' modes.
  //
  // uniform → unique: seed every employee's cellOverride with the current
  //   bulk value (overwrites any prior per-row value for deterministic
  //   behaviour). bulkValues[fieldKey] is left intact so that flipping
  //   back to uniform always restores the previous "apply to all" value.
  //
  // unique → uniform: pure mode flip only — bulkValues already persists.
  const handleToggleUniform = useCallback((fieldKey) => {
    setUniformByField((prev) => {
      const current = prev[fieldKey] ?? 'uniform'
      const nextMode = current === 'uniform' ? 'unique' : 'uniform'
      if (nextMode === 'unique') {
        const seed = bulkValues[fieldKey] ?? ''
        setCellOverrides((prevOverrides) => {
          const out = { ...prevOverrides }
          for (const id of finalizedEmployeeIds) {
            out[id] = { ...(out[id] ?? {}), [fieldKey]: seed }
          }
          return out
        })
      }
      return { ...prev, [fieldKey]: nextMode }
    })
  }, [bulkValues, finalizedEmployeeIds])

  // ── Manual people management ────────────────────────────────────────────

  function addPerson(role, person) {
    setManualPeople((prev) => ({
      ...prev,
      [role]: [...(prev[role] ?? []), person],
    }))
  }

  function removePerson(role, id) {
    setManualPeople((prev) => ({
      ...prev,
      [role]: (prev[role] ?? []).filter((p) => p.id !== id),
    }))
  }

  const handleAddObserver = useCallback((p) => addPerson('observers', p), [])
  const handleRemoveObserver = useCallback((id) => removePerson('observers', id), [])
  const handleAddApprover = useCallback((p) => addPerson('approvers', p), [])
  const handleRemoveApprover = useCallback((id) => removePerson('approvers', id), [])

  // Adding a collaborator is idempotent — if they're already in the list,
  // do nothing. Lets the department follow-up flow safely call this whenever
  // a department owner is assigned without producing duplicates.
  const handleAddCollaborator = useCallback((p) => {
    if (!p) return
    setManualPeople((prev) => {
      const existing = prev.collaborators ?? []
      if (existing.some((c) => c.id === p.id)) return prev
      return { ...prev, collaborators: [...existing, p] }
    })
  }, [])

  // Removing a collaborator who currently owns one or more department
  // follow-ups confirms with the user, then clears the owner on those
  // departments before removing from the collaborators list. One-way sync,
  // per the design contract.
  const handleRemoveCollaborator = useCallback(
    (id) => {
      const ownedDeptIds = getDepartmentsOwnedByPerson(ownerByDepartment, id)
      if (ownedDeptIds.length > 0) {
        const personName =
          ownerByDepartment[ownedDeptIds[0]]?.name ?? 'This person'
        const deptLabels = ownedDeptIds
          .map((d) => DEPARTMENTS_BY_ID.get(d)?.label ?? d)
          .join(', ')
        const ok = window.confirm(
          `${personName} owns follow-ups for ${deptLabels}. Removing them will leave those tasks unassigned. Continue?`,
        )
        if (!ok) return
        setOwnerByDepartment((prev) => {
          const next = { ...prev }
          for (const d of ownedDeptIds) next[d] = null
          return next
        })
      }
      removePerson('collaborators', id)
    },
    [ownerByDepartment],
  )

  // ── Header derived state ────────────────────────────────────────────────

  const isFirstStep = stepId === 'select'
  const backLabel = isFirstStep
    ? 'Back to People'
    : stepId === 'define'
      ? 'Back to Select people'
      : stepId === 'edit'
        ? 'Back to Define change set'
        : stepId === 'followups'
          ? 'Back to Make changes'
          : 'Back to Follow ups'

  const currentStepIndex = BULK_CHANGE_STEPS.findIndex((s) => s.id === stepId)
  const selectedEmployees = EMPLOYEES.filter((employee) => finalizedEmployeeIds.includes(employee.id))

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-rippling-surface">
      {/* ── Header ── */}
      <header className="h-14 px-5 border-b border-rippling-line bg-white flex items-center gap-4 shrink-0">
        <button
          type="button"
          onClick={handleBack}
          className="h-8 w-8 rounded-md ui-interactive flex items-center justify-center text-rippling-muted hover:text-rippling-ink shrink-0"
          aria-label={backLabel}
          title={backLabel}
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

          {stepId === 'define' && (
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinueFromDefine}
              className={classNames(
                'h-8 pl-3 pr-2.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors',
                canContinueFromDefine
                  ? 'bg-rippling-plum text-white hover:bg-rippling-plum-hover shadow-sm'
                  : 'bg-rippling-surface-2 text-rippling-muted cursor-not-allowed',
              )}
              title={
                canContinueFromDefine
                  ? 'Continue to set values for each employee'
                  : 'Pick at least one field to continue'
              }
            >
              <span>Make changes</span>
              {selectedFieldKeys.length > 0 && (
                <span className="bg-white/20 text-white text-[11px] font-semibold px-1.5 rounded tabular-nums">
                  {selectedFieldKeys.length}{' '}
                  {selectedFieldKeys.length === 1 ? 'field' : 'fields'}
                </span>
              )}
              <ArrowRight size={13} strokeWidth={2} />
            </button>
          )}

          {stepId === 'edit' && (
            <button
              type="button"
              onClick={handleContinue}
              className="h-8 pl-3 pr-2.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 bg-rippling-plum text-white hover:bg-rippling-plum-hover shadow-sm transition-colors"
            >
              <span>Follow up steps</span>
              <ArrowRight size={13} strokeWidth={2} />
            </button>
          )}

          {stepId === 'followups' && null}

          {stepId === 'review' && (
            <button
              type="button"
              className="h-8 pl-3 pr-2.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 bg-rippling-plum text-white hover:bg-rippling-plum-hover shadow-sm transition-colors"
            >
              <span>Apply changes</span>
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
        />
      )}

      {stepId === 'define' && (
        <DefineChangeSetStep
          lead={WORKLIST_LEAD}
          selectedEmployees={selectedEmployees}
          selectedFieldKeys={selectedFieldKeys}
          bulkValues={bulkValues}
          manualPeople={manualPeople}
          effectiveDateTime={effectiveDateTime}
          onEffectiveDateTimeChange={handleEffectiveDateTimeChange}
          onAddFields={handleAddFields}
          onApplyTemplate={handleApplyTemplate}
          onRemoveField={handleRemoveField}
          onRemoveFields={handleRemoveFields}
          onAddObserver={handleAddObserver}
          onRemoveObserver={handleRemoveObserver}
          onAddApprover={handleAddApprover}
          onRemoveApprover={handleRemoveApprover}
          onAddCollaborator={handleAddCollaborator}
          onRemoveCollaborator={handleRemoveCollaborator}
          onStageCsvDraft={handleStageCsvDraft}
        />
      )}

      {stepId === 'followups' && (
        <FollowUpsStep
          selectedFieldKeys={selectedFieldKeys}
          selectedEmployeeIds={finalizedEmployeeIds}
          bulkValues={bulkValues}
          cellOverrides={cellOverrides}
          uniformByField={uniformByField}
          manualPeople={manualPeople}
          effectiveDateTime={effectiveDateTime}
          onEffectiveDateTimeChange={handleEffectiveDateTimeChange}
          lead={WORKLIST_LEAD}
          worklistName={worklistName}
          onComplete={handleContinue}
          onBack={handleBack}
          onNavigateToEdit={() => setStepId('edit')}
          onAddObserver={handleAddObserver}
          onRemoveObserver={handleRemoveObserver}
          onAddApprover={handleAddApprover}
          onRemoveApprover={handleRemoveApprover}
          onAddCollaborator={handleAddCollaborator}
          onRemoveCollaborator={handleRemoveCollaborator}
          tasksByDepartment={tasksByDepartment}
          setTasksByDepartment={setTasksByDepartment}
          ownerByDepartment={ownerByDepartment}
          setOwnerByDepartment={setOwnerByDepartment}
          approvalByDepartment={approvalByDepartment}
          setApprovalByDepartment={setApprovalByDepartment}
          slaByDepartment={slaByDepartment}
          setSlaByDepartment={setSlaByDepartment}
          approverByEventId={approverByEventId}
          setApproverByEventId={setApproverByEventId}
        />
      )}

      {stepId === 'review' && (
        <ReviewApplyStep
          selectedFieldKeys={selectedFieldKeys}
          selectedEmployeeIds={finalizedEmployeeIds}
          bulkValues={bulkValues}
          cellOverrides={cellOverrides}
          uniformByField={uniformByField}
          tasksByDepartment={tasksByDepartment}
          effectiveDateTime={effectiveDateTime}
          worklistName={worklistName}
          manualPeople={manualPeople}
          onNavigateToFollowups={() => setStepId('followups')}
        />
      )}

      {stepId === 'edit' && (
        <MakeChangesStep
          selectedEmployeeIds={finalizedEmployeeIds}
          lead={WORKLIST_LEAD}
          selectedFieldKeys={selectedFieldKeys}
          bulkValues={bulkValues}
          cellOverrides={cellOverrides}
          uniformByField={uniformByField}
          manualPeople={manualPeople}
          effectiveDateTime={effectiveDateTime}
          onEffectiveDateTimeChange={handleEffectiveDateTimeChange}
          onAddFields={handleAddFields}
          onChangeBulkValue={handleChangeBulkValue}
          onChangeCell={handleChangeCell}
          onToggleUniform={handleToggleUniform}
          onApplyCsvStatePatch={handleApplyCsvStatePatch}
          stagedCsvDraft={stagedCsvDraft}
          onClearStagedCsvDraft={() => setStagedCsvDraft(null)}
          onAddObserver={handleAddObserver}
          onRemoveObserver={handleRemoveObserver}
          onAddApprover={handleAddApprover}
          onRemoveApprover={handleRemoveApprover}
          onAddCollaborator={handleAddCollaborator}
          onRemoveCollaborator={handleRemoveCollaborator}
        />
      )}
    </div>
  )
}
