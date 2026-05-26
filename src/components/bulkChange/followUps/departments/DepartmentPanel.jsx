import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import DepartmentOwnerPicker from './DepartmentOwnerPicker'
import DepartmentPreflightList from './DepartmentPreflightList'
import DepartmentTaskGroup from './DepartmentTaskGroup'
import { FIELDS_BY_KEY } from '../../defineChanges/fieldSchema'
import { getPreflightChecks } from './departmentPreflightChecks'
import { classNames } from '../../../../lib/utils'

/**
 * The uniform 3-zone panel rendered for every department in the Follow-ups
 * sub-tracker. Same layout for HR / Payroll / IT / Finance / Global /
 * Benefits / Compliance — only the data inside differs.
 *
 * Zone 1: Automated pre-flight checks (always shown, even when empty)
 * Zone 2: Tasks, grouped "Because of: <field>" per triggering field
 * Zone 3: (implicit) — the Continue gate lives in FollowUpsStep's footer
 *
 * Department-level owner picker sits in the header. Per design contract,
 * one owner per department is applied to every task in it; tasks have no
 * per-row owner picker.
 */
export default function DepartmentPanel({
  department,
  triggeringFieldKeys,
  selectedFieldKeys,
  tasks,
  owner,
  onSetOwner,
  onClearOwner,
  onAddTask,
  onUpdateTask,
  onRemoveTask,
  onResetTaskDescription,
}) {
  const Icon = department.icon

  const preflightItems = useMemo(
    () => getPreflightChecks(department.id, selectedFieldKeys),
    [department.id, selectedFieldKeys],
  )

  // Group tasks by sourceFieldKey, in the order the fields were triggered.
  const tasksByField = useMemo(() => {
    const map = new Map()
    for (const fk of triggeringFieldKeys) map.set(fk, [])
    for (const t of tasks) {
      if (!map.has(t.sourceFieldKey)) map.set(t.sourceFieldKey, [])
      map.get(t.sourceFieldKey).push(t)
    }
    return map
  }, [tasks, triggeringFieldKeys])

  const totalTasks = tasks.length
  const missingDueDates = tasks.filter((t) => !t.dueDate).length
  const summaryPill = (() => {
    if (!owner) return { tone: 'warn', label: 'Needs owner' }
    if (missingDueDates > 0) return { tone: 'warn', label: `${missingDueDates} need due date` }
    return { tone: 'ok', label: 'Ready' }
  })()

  // "Why this matters" sentence: list the triggering fields in plain English.
  const whyLabel = useMemo(() => {
    const labels = triggeringFieldKeys
      .map((fk) => FIELDS_BY_KEY.get(fk)?.label ?? fk)
      .join(', ')
    return `Changing ${labels} requires ${department.label} to ${department.blurb.toLowerCase()}.`
  }, [triggeringFieldKeys, department.label, department.blurb])

  return (
    <div className="w-full">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-rippling-chip text-rippling-plum flex items-center justify-center shrink-0">
            <Icon size={18} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[15px] font-semibold text-rippling-ink">
                {department.label}
              </h3>
              <span
                className={classNames(
                  'inline-flex items-center h-[18px] px-1.5 rounded-full text-[10.5px] font-medium',
                  summaryPill.tone === 'ok'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700',
                )}
              >
                {summaryPill.label}
              </span>
              <span className="text-[11.5px] text-rippling-muted">
                {totalTasks} task{totalTasks === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-[12.5px] text-rippling-muted mt-1 leading-snug">
              {whyLabel}
            </p>
          </div>
        </div>

        <div className="shrink-0 pt-1">
          <DepartmentOwnerPicker
            owner={owner}
            onSelect={onSetOwner}
            onClear={onClearOwner}
          />
        </div>
      </div>

      {/* Owner-applies-to-all hint */}
      <p className="text-[11.5px] text-rippling-muted mb-5 flex items-center gap-1">
        <ChevronRight size={10} strokeWidth={2} className="text-rippling-muted/60" />
        The {department.label} owner is responsible for every task below.
      </p>

      {/* ── Zone 1 · Pre-flight system checks ──────────────────────────── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[12px] uppercase tracking-wide font-semibold text-rippling-muted">
            Pre-flight system checks
          </h4>
        </div>
        <DepartmentPreflightList
          deptId={department.id}
          items={preflightItems}
        />
      </section>

      {/* ── Zone 2 · Tasks (grouped by triggering field) ───────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[12px] uppercase tracking-wide font-semibold text-rippling-muted">
            Tasks for the {department.label} owner
          </h4>
        </div>

        <div className="space-y-5">
          {triggeringFieldKeys.map((fk) => (
            <DepartmentTaskGroup
              key={fk}
              fieldKey={fk}
              tasks={tasksByField.get(fk) ?? []}
              onUpdateTask={(taskId, patch) => onUpdateTask(taskId, patch)}
              onRemoveTask={(taskId) => onRemoveTask(taskId)}
              onResetDescription={(taskId) => onResetTaskDescription(taskId)}
              onAddTask={(fieldKey) => onAddTask(fieldKey)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
