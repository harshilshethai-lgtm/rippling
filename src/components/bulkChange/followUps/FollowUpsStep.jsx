import { useCallback, useMemo, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { EMPLOYEES } from '../../../data/employees'
import { buildFollowUpsPlan } from './followUpsConfig'
import { useFollowUpsRunner } from './useFollowUpsRunner'
import FollowUpsSubTracker from './FollowUpsSubTracker'
import CommunicationsPanel from './CommunicationsPanel'
import IntegrationsPanel from './IntegrationsPanel'
import DepartmentPanel from './departments/DepartmentPanel'
import {
  useDepartmentTasks,
  getDepartmentGateState,
} from './departments/useDepartmentTasks'
import { DEPARTMENTS_BY_ID } from './departments/DEPARTMENTS'
import PropertiesSidebar from '../defineChanges/PropertiesSidebar'
import { useDerivedContext } from '../defineChanges/useDerivedContext'
import { classNames } from '../../../lib/utils'
import PreviewPanel, { computePreviewGate } from './preview/PreviewPanel'
import { usePreviewRunner } from './preview/usePreviewRunner'

/**
 * Step 4 of the Bulk Change wizard — "Follow ups".
 *
 * Sub-tracker order:
 *   System checks → [active departments] → Communications → Integrations
 *
 * Active departments are derived from selectedFieldKeys via FIELD_DEPARTMENT_MAP.
 * Each department panel has:
 *   Zone 1 — automated pre-flight checks
 *   Zone 2 — system-recommended + user-added tasks, grouped by triggering field
 * Zone 3 (the Continue gate) lives in this component's footer:
 *   every active dept must have an owner AND every task must have a due date
 *   AND no non-warning System Check has failed.
 */
export default function FollowUpsStep({
  selectedFieldKeys,
  selectedEmployeeIds,
  bulkValues,
  cellOverrides,
  uniformByField,
  manualPeople,
  effectiveDateTime,
  onEffectiveDateTimeChange,
  lead,
  onComplete,
  onBack,
  onAddObserver,
  onRemoveObserver,
  onAddApprover,
  onRemoveApprover,
  onAddCollaborator,
  onRemoveCollaborator,
  onNavigateToEdit,
  // Department state (lifted to BulkChangePage)
  tasksByDepartment,
  setTasksByDepartment,
  ownerByDepartment,
  setOwnerByDepartment,
  // Preview event approver state (lifted to BulkChangePage)
  approverByEventId,
  setApproverByEventId,
}) {
  const plan = useMemo(
    () => buildFollowUpsPlan(selectedFieldKeys),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedFieldKeys.join(',')],
  )

  const [activeSubstepId, setActiveSubstepId] = useState(plan[0]?.id ?? 'systemChecks')
  const [completedIds, setCompletedIds] = useState(new Set())

  // If the plan reshapes (e.g. user changed field selection upstream), keep
  // the active substep valid.
  const activeIndex = plan.findIndex((s) => s.id === activeSubstepId)
  const safeActiveIndex = activeIndex === -1 ? 0 : activeIndex
  const activeSubstep = plan[safeActiveIndex]
  const isLastSubstep = safeActiveIndex === plan.length - 1
  const isFirstSubstep = safeActiveIndex === 0

  // ── Department state hook ───────────────────────────────────────────────

  const {
    setOwner,
    clearOwner,
    addUserTask,
    removeTask,
    updateTask,
    resetSystemDescription,
  } = useDepartmentTasks({
    selectedFieldKeys,
    tasksByDepartment,
    setTasksByDepartment,
    ownerByDepartment,
    setOwnerByDepartment,
    onAddCollaborator,
  })

  const activeDeptIds = useMemo(
    () => plan.filter((s) => s.kind === 'department').map((s) => s.departmentId),
    [plan],
  )

  // ── System checks / comms / integrations runner ─────────────────────────

  const employees = useMemo(() => {
    if (!selectedEmployeeIds?.length) return []
    const idSet = new Set(selectedEmployeeIds)
    return EMPLOYEES.filter((e) => idSet.has(e.id))
  }, [selectedEmployeeIds])

  const ctx = useMemo(
    () => ({ employees, selectedFieldKeys, bulkValues, cellOverrides, uniformByField }),
    [employees, selectedFieldKeys, bulkValues, cellOverrides, uniformByField],
  )

  const isPreview = activeSubstep?.kind === 'preview'
  const isDepartment = activeSubstep?.kind === 'department'
  const isIntegrations = activeSubstep?.kind === 'integrations'
  const isComms = activeSubstep?.kind === 'comms'

  // Auto-approvers from event rules → right-rail approvers list (deduplicated by id).
  // Defined before previewRunner so the stable ref can be passed in.
  const addedAutoApproverIds = useRef(new Set())
  const handleAutoApprove = useCallback(
    (approver) => {
      if (addedAutoApproverIds.current.has(approver.id)) return
      addedAutoApproverIds.current.add(approver.id)
      onAddApprover?.(approver)
    },
    [onAddApprover],
  )

  // Preview runner — single instance, owns all state for gate logic + chip assignment
  const previewRunner = usePreviewRunner({
    eventSources: isPreview ? (activeSubstep?.items ?? []) : [],
    ctx,
    substepId: activeSubstepId,
    onAutoApprove: handleAutoApprove,
  })

  // The existing runner applies to comms / integrations substeps only.
  // Department panels manage their own runner internally.
  const runnerItems = (isDepartment || isPreview) ? [] : activeSubstep?.items ?? []
  const { statuses, rerun, allDone, failureCount, warningCount } = useFollowUpsRunner({
    items: runnerItems,
    substepId: activeSubstepId,
    ctx,
    isSystemChecks: false,
  })

  // ── Continue gate ──────────────────────────────────────────────────────

  const gate = useMemo(() => {
    if (isPreview) {
      return computePreviewGate({
        statuses: previewRunner.statuses,
        aggregate: previewRunner.aggregate,
        eventSources: activeSubstep?.items ?? [],
        allDone: previewRunner.allDone,
      })
    }
    if (!isDepartment) {
      return {
        canContinue: allDone,
        disabledReason:
          failureCount > 0
            ? `${failureCount} item${failureCount === 1 ? '' : 's'} failed`
            : runnerItems.length === 0
              ? null
              : 'Some items are still running',
      }
    }
    // Department panel gate — owner + due dates per task
    const dept = ownerByDepartment[activeSubstep.departmentId] ?? null
    const tasks = tasksByDepartment[activeSubstep.departmentId] ?? []
    const missingDueDates = tasks.filter((t) => !t.dueDate).length
    if (!dept) {
      return { canContinue: false, disabledReason: 'Assign an owner to continue' }
    }
    if (missingDueDates > 0) {
      return {
        canContinue: false,
        disabledReason: `${missingDueDates} task${missingDueDates === 1 ? '' : 's'} missing a due date`,
      }
    }
    return { canContinue: true, disabledReason: null }
  }, [
    isPreview,
    previewRunner.statuses,
    previewRunner.aggregate,
    previewRunner.allDone,
    isDepartment,
    allDone,
    failureCount,
    runnerItems.length,
    ownerByDepartment,
    tasksByDepartment,
    activeSubstep,
  ])

  const handleContinue = useCallback(() => {
    setCompletedIds((prev) => new Set([...prev, activeSubstepId]))
    if (isLastSubstep) {
      onComplete?.()
    } else {
      setActiveSubstepId(plan[safeActiveIndex + 1].id)
    }
  }, [activeSubstepId, isLastSubstep, onComplete, plan, safeActiveIndex])

  const handleBack = useCallback(() => {
    if (isFirstSubstep) return
    setActiveSubstepId(plan[safeActiveIndex - 1].id)
  }, [isFirstSubstep, plan, safeActiveIndex])

  // Sidebar context
  const { observers, approvers, collaborators } = useDerivedContext(selectedFieldKeys, manualPeople)

  // Deep-link from a Preview event card to the owning substep
  const handleOpenEventDetails = useCallback(
    (source) => {
      const res = source?.ownsResolution
      if (!res) return
      if (res.kind === 'integration') {
        setActiveSubstepId('integrations')
      } else if (res.kind === 'department') {
        setActiveSubstepId(`dept.${res.id}`)
      } else if (res.kind === 'comms') {
        setActiveSubstepId('communications')
      }
    },
    [],
  )

  // Reviewer assignment on Preview event cards → collaborators list (not approvers)
  const handleAssignEventApprover = useCallback(
    (eventId, person) => {
      setApproverByEventId?.((prev) => ({ ...prev, [eventId]: person }))
      onAddCollaborator?.(person)
    },
    [setApproverByEventId, onAddCollaborator],
  )

  const handleRemoveEventApprover = useCallback(
    (eventId) => {
      setApproverByEventId?.((prev) => {
        const next = { ...prev }
        delete next[eventId]
        return next
      })
    },
    [setApproverByEventId],
  )

  // ── Render department panel data ───────────────────────────────────────

  const activeDepartment = isDepartment
    ? DEPARTMENTS_BY_ID.get(activeSubstep.departmentId)
    : null
  const activeDeptTasks = isDepartment
    ? tasksByDepartment[activeSubstep.departmentId] ?? []
    : []
  const activeDeptOwner = isDepartment
    ? ownerByDepartment[activeSubstep.departmentId] ?? null
    : null

  // Overall gate state for the footer caption when many things are missing
  const overallGate = useMemo(
    () =>
      getDepartmentGateState({
        activeDeptIds,
        tasksByDepartment,
        ownerByDepartment,
      }),
    [activeDeptIds, tasksByDepartment, ownerByDepartment],
  )

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

        {/* ── Sub-tracker band ────────────────────────────────────────── */}
        <div className="shrink-0 px-6 py-2.5 border-b border-rippling-line bg-white overflow-x-auto">
          <FollowUpsSubTracker
            substeps={plan}
            activeId={activeSubstepId}
            completedIds={completedIds}
          />
        </div>

        {/* ── Active panel (scrollable) ────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-rippling-surface">
          <div className="max-w-[760px] mx-auto w-full px-6 py-8">

            {/* Step intro */}
            <div className="mb-6 text-center">
              <h2 className="text-[17px] font-semibold text-rippling-ink tracking-tight">
                {isPreview ? 'Pre-flight review' : 'Follow up steps'}
              </h2>
              <p className="text-[13px] text-rippling-muted mt-1">
                {isPreview
                  ? 'Review every event your change will trigger before submitting.'
                  : 'Complete each step below before applying your changes.'}
              </p>
            </div>

            {/* Panel card */}
            <div className={classNames(
              'rounded-xl border border-rippling-line',
              isPreview ? 'bg-rippling-surface p-0' : 'bg-white shadow-rippling-card p-6',
            )}>
              {isPreview && (
                <PreviewPanel
                  eventSources={activeSubstep?.items ?? []}
                  totalEmployees={ctx?.employees?.length ?? 0}
                  statuses={previewRunner.statuses}
                  assignApprover={previewRunner.assignApprover}
                  removeApprover={previewRunner.removeApprover}
                  aggregate={previewRunner.aggregate}
                  allDone={previewRunner.allDone}
                  triggeredByTier={previewRunner.triggeredByTier}
                  onAssignApprover={handleAssignEventApprover}
                  onRemoveApprover={handleRemoveEventApprover}
                  onOpenDetails={handleOpenEventDetails}
                />
              )}

              {isDepartment && activeDepartment && (
                <DepartmentPanel
                  department={activeDepartment}
                  triggeringFieldKeys={activeSubstep.triggeringFieldKeys}
                  selectedFieldKeys={selectedFieldKeys}
                  tasks={activeDeptTasks}
                  owner={activeDeptOwner}
                  onSetOwner={(person) => setOwner(activeSubstep.departmentId, person)}
                  onClearOwner={() => clearOwner(activeSubstep.departmentId)}
                  onAddTask={(fieldKey) => addUserTask(activeSubstep.departmentId, fieldKey)}
                  onUpdateTask={(taskId, patch) =>
                    updateTask(activeSubstep.departmentId, taskId, patch)
                  }
                  onRemoveTask={(taskId) => removeTask(activeSubstep.departmentId, taskId)}
                  onResetTaskDescription={(taskId) =>
                    resetSystemDescription(activeSubstep.departmentId, taskId)
                  }
                />
              )}

              {isComms && (
                <CommunicationsPanel
                  items={activeSubstep.items}
                  statuses={statuses}
                  onRerun={rerun}
                />
              )}

              {isIntegrations && (
                <IntegrationsPanel
                  substep={activeSubstep}
                  statuses={statuses}
                  onRerun={rerun}
                />
              )}
            </div>

            {/* Status summaries — only for comms/integrations, Preview manages its own */}
            {!isDepartment && !isPreview && failureCount > 0 && !isIntegrations && (
              <p className="text-center text-[12.5px] text-red-600 mt-4">
                {failureCount} item{failureCount > 1 ? 's' : ''} failed — click Re-run on each failed item to retry.
              </p>
            )}
            {!isDepartment && !isPreview && failureCount === 0 && warningCount > 0 && (
              <p className="text-center text-[12.5px] text-amber-600 mt-4">
                {warningCount} warning{warningCount > 1 ? 's' : ''} noted — you can continue when ready.
              </p>
            )}
            {isDepartment && !gate.canContinue && (
              <p className="text-center text-[12.5px] text-amber-600 mt-4">
                {gate.disabledReason} for {activeDepartment?.label}.
              </p>
            )}
            {isDepartment && gate.canContinue && overallGate.canContinue === false && (
              <p className="text-center text-[12px] text-rippling-muted mt-4">
                Across all departments: {overallGate.missingOwnerCount} owner
                {overallGate.missingOwnerCount === 1 ? '' : 's'} and {overallGate.missingDueDateCount} due date
                {overallGate.missingDueDateCount === 1 ? '' : 's'} still to set.
              </p>
            )}
          </div>
        </div>

        {/* ── Footer: Back + Continue ──────────────────────────────────── */}
        <div className="shrink-0 h-14 px-6 border-t border-rippling-line bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={isFirstSubstep}
            className={classNames(
              'h-8 px-4 rounded-md text-[13px] font-medium transition-colors',
              isFirstSubstep
                ? 'text-rippling-muted cursor-not-allowed opacity-40'
                : 'text-rippling-plum hover:bg-rippling-chip',
            )}
          >
            Back
          </button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!gate.canContinue}
            title={gate.canContinue ? undefined : gate.disabledReason ?? 'Resolve all items to continue'}
            className={classNames(
              'h-8 pl-3 pr-2.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors',
              gate.canContinue
                ? 'bg-rippling-plum text-white hover:bg-rippling-plum-hover shadow-sm'
                : 'bg-rippling-surface-2 text-rippling-muted cursor-not-allowed',
            )}
          >
            <span>{isLastSubstep ? 'Review & apply' : 'Continue'}</span>
            <ArrowRight size={13} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── Right rail ────────────────────────────────────────────────── */}
      <PropertiesSidebar
        lead={lead}
        observers={observers}
        approvers={approvers}
        collaborators={collaborators}
        steps={[]}
        effectiveDateTime={effectiveDateTime}
        onEffectiveDateTimeChange={onEffectiveDateTimeChange}
        onAddObserver={onAddObserver}
        onRemoveObserver={onRemoveObserver}
        onAddApprover={onAddApprover}
        onRemoveApprover={onRemoveApprover}
        onAddCollaborator={onAddCollaborator}
        onRemoveCollaborator={onRemoveCollaborator}
        hideProcessSection
      />
    </div>
  )
}
