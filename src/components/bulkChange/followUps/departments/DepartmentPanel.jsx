import { useMemo, useState } from 'react'
import { AlertCircle, Calendar, Check, ChevronDown, ChevronUp, RotateCcw, X, Zap } from 'lucide-react'
import DepartmentHeroHeader from './DepartmentHeroHeader'
import DepartmentAiNarrative from './DepartmentAiNarrative'
import DepartmentTaskGroup from './DepartmentTaskGroup'
import PreviewTierSection from '../preview/PreviewTierSection'
import { TIER_ORDER } from '../preview/previewEventsCatalog'
import { getAutoTasksForDept } from './departmentAutoTasks'
import { classNames } from '../../../../lib/utils'

/**
 * Department Panel — the approval + task acceptance surface for one domain.
 *
 * Layout:
 *   1. Hero header       — compact identity, stat chips, owner picker
 *   2. AI Narrative      — why this landed in your domain
 *   3. Issues section    — flagged Preview events for this domain (strong visual header)
 *   4. Section divider
 *   5. Tasks section     — auto summary + human tasks with acknowledge
 *   6. Full slice / Context (collapsed)
 *   7. Approval zone     — single terminal decision at the bottom
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
  triggeredEvents,
  allDomainEvents,
  domainApproval,
  onSetDomainApproval,
  sla,
  onSetSla,
  jobMeta,
}) {
  const [contextExpanded, setContextExpanded] = useState(false)
  const [fullSliceExpanded, setFullSliceExpanded] = useState(false)

  const autoTasks = useMemo(() => getAutoTasksForDept(department.id), [department.id])
  const humanTaskCount = tasks.length
  const autoTaskCount = autoTasks.length

  const tasksByField = useMemo(() => {
    const map = new Map()
    for (const fk of triggeringFieldKeys) map.set(fk, [])
    for (const t of tasks) {
      if (!map.has(t.sourceFieldKey)) map.set(t.sourceFieldKey, [])
      map.get(t.sourceFieldKey).push(t)
    }
    return map
  }, [tasks, triggeringFieldKeys])

  const eventsByTier = useMemo(() => {
    const byTier = {}
    for (const tier of TIER_ORDER) byTier[tier] = []
    for (const e of allDomainEvents ?? []) {
      byTier[e.source.tier]?.push(e)
    }
    return byTier
  }, [allDomainEvents])

  const hasAnyTriggered = (triggeredEvents ?? []).some((e) => e.entry?.triggered)
  const criticalCount = (triggeredEvents ?? []).filter((e) => e.source.tier === 'critical' && e.entry?.triggered).length
  const highCount = (triggeredEvents ?? []).filter((e) => e.source.tier === 'high' && e.entry?.triggered).length

  const routineCount = (allDomainEvents ?? []).filter(
    (e) => !e.entry?.triggered && e.entry?.status === 'not-triggered',
  ).length

  return (
    <div className="w-full space-y-5">

      {/* ── 1. Hero header ─────────────────────────────────────────────── */}
      <DepartmentHeroHeader
        department={department}
        jobMeta={jobMeta}
        triggeredEvents={triggeredEvents ?? []}
        humanTaskCount={humanTaskCount}
        autoTaskCount={autoTaskCount}
        owner={owner}
        onSetOwner={onSetOwner}
        onClearOwner={onClearOwner}
      />

      {/* ── 2. AI narrative ────────────────────────────────────────────── */}
      <DepartmentAiNarrative
        department={department}
        triggeredEvents={triggeredEvents ?? []}
        humanTaskCount={humanTaskCount}
        autoTaskCount={autoTaskCount}
      />

      {/* ── 3. Issues flagged in this domain ───────────────────────────── */}
      {hasAnyTriggered && (
        <section>
          {/* Section header — colored to match risk severity */}
          <div className={classNames(
            'flex items-center gap-3 px-4 py-3 rounded-t-xl border border-b-0',
            criticalCount > 0
              ? 'bg-red-50 border-red-200'
              : highCount > 0
                ? 'bg-orange-50 border-orange-200'
                : 'bg-amber-50 border-amber-200',
          )}>
            <div className={classNames(
              'w-1 h-5 rounded-full shrink-0',
              criticalCount > 0 ? 'bg-red-500' : highCount > 0 ? 'bg-orange-500' : 'bg-amber-400',
            )} />
            <div className="flex-1 min-w-0">
              <p className={classNames(
                'text-[13px] font-semibold',
                criticalCount > 0 ? 'text-red-800' : highCount > 0 ? 'text-orange-800' : 'text-amber-800',
              )}>
                Issues Flagged in Your Domain
              </p>
              <p className={classNames(
                'text-[11.5px] mt-0.5',
                criticalCount > 0 ? 'text-red-600' : highCount > 0 ? 'text-orange-600' : 'text-amber-600',
              )}>
                Review these before making your decision below
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
              {criticalCount > 0 && (
                <span className="inline-flex items-center h-5 px-2 rounded-full bg-red-100 text-red-700 text-[10.5px] font-semibold border border-red-200">
                  {criticalCount} critical
                </span>
              )}
              {highCount > 0 && (
                <span className="inline-flex items-center h-5 px-2 rounded-full bg-orange-100 text-orange-700 text-[10.5px] font-semibold border border-orange-200">
                  {highCount} high
                </span>
              )}
            </div>
          </div>

          {/* Event cards */}
          <div className={classNames(
            'rounded-b-xl border border-t-0 px-4 pt-3 pb-4 space-y-2',
            criticalCount > 0 ? 'border-red-200' : highCount > 0 ? 'border-orange-200' : 'border-amber-200',
          )}>
            {TIER_ORDER.map((tier) => {
              const events = eventsByTier[tier] ?? []
              if (events.length === 0) return null
              return (
                <PreviewTierSection
                  key={tier}
                  tier={tier}
                  events={events}
                  onAssignApprover={null}
                  onRemoveApprover={null}
                  onOpenDetails={null}
                  hideApproverChip
                />
              )
            })}
          </div>
        </section>
      )}

      {/* ── Section divider ────────────────────────────────────────────── */}
      <div className="relative flex items-center">
        <div className="flex-1 h-px bg-rippling-line" />
        <span className="mx-4 text-[10.5px] font-semibold uppercase tracking-widest text-rippling-muted/70 shrink-0">
          Tasks for Your Team
        </span>
        <div className="flex-1 h-px bg-rippling-line" />
      </div>

      {/* ── 4. Tasks section ───────────────────────────────────────────── */}
      <section>
        <div className="rounded-xl border border-rippling-line bg-white overflow-hidden shadow-rippling-card">
          {/* Tasks section header */}
          <div className="px-5 py-3 bg-rippling-surface border-b border-rippling-line flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-rippling-plum shrink-0" />
              <p className="text-[13px] font-semibold text-rippling-ink">
                Tasks on Commit
              </p>
            </div>
            <span className="text-[11.5px] text-rippling-muted">
              {autoTaskCount} automated · {humanTaskCount} need your team
            </span>
          </div>

          <div className="px-5 py-4 space-y-5">
            {/* Automated tasks */}
            {autoTaskCount > 0 && (
              <AutoTasksSummary tasks={autoTasks} />
            )}

            {/* Human tasks */}
            {humanTaskCount > 0 ? (
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
            ) : (
              <div className="py-3 text-center">
                <p className="text-[12.5px] text-rippling-muted">
                  No human tasks — the platform handles everything automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 5. Full Domain Slice (collapsed) ───────────────────────────── */}
      {routineCount > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setFullSliceExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-rippling-line bg-white hover:bg-rippling-surface transition-colors group"
          >
            <span className="text-[12.5px] font-medium text-rippling-ink-2">
              View {routineCount} routine {department.label} event{routineCount === 1 ? '' : 's'}
            </span>
            <span className="text-rippling-muted group-hover:text-rippling-ink transition-colors">
              {fullSliceExpanded ? <ChevronUp size={13} strokeWidth={2} /> : <ChevronDown size={13} strokeWidth={2} />}
            </span>
          </button>
          {fullSliceExpanded && (
            <div className="mt-2 space-y-1">
              {TIER_ORDER.filter((t) => t === 'routine').map((tier) => {
                const events = (allDomainEvents ?? []).filter((e) => e.source.tier === tier)
                if (!events.length) return null
                return (
                  <PreviewTierSection
                    key={tier}
                    tier={tier}
                    events={events}
                    onAssignApprover={null}
                    onRemoveApprover={null}
                    onOpenDetails={null}
                    hideApproverChip
                  />
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ── 6. Context (collapsed) ─────────────────────────────────────── */}
      <section>
        <button
          type="button"
          onClick={() => setContextExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-rippling-line bg-white hover:bg-rippling-surface transition-colors group"
        >
          <span className="text-[12.5px] font-medium text-rippling-ink-2">Context &amp; Parallel Approvals</span>
          <span className="text-rippling-muted group-hover:text-rippling-ink transition-colors">
            {contextExpanded ? <ChevronUp size={13} strokeWidth={2} /> : <ChevronDown size={13} strokeWidth={2} />}
          </span>
        </button>
        {contextExpanded && (
          <div className="mt-2 rounded-xl border border-rippling-line bg-white px-5 py-4 space-y-4">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-rippling-muted mb-2">
                Parallel Domain Approvals
              </p>
              <div className="space-y-1.5">
                {[
                  { label: 'HR', status: 'pending' },
                  { label: 'IT', status: 'pending' },
                  { label: 'Compliance', status: 'pending' },
                ].filter((d) => d.label.toLowerCase() !== department.id).map((d) => (
                  <div key={d.label} className="flex items-center gap-2 text-[12.5px]">
                    <span className={classNames('w-1.5 h-1.5 rounded-full shrink-0', d.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-400')} />
                    <span className="font-medium text-rippling-ink">{d.label}</span>
                    <span className="text-rippling-muted capitalize">{d.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-rippling-muted mb-1.5">
                Cross-Domain Dependencies
              </p>
              <p className="text-[12.5px] text-rippling-muted leading-relaxed">
                Your approval, combined with IT's, unblocks the final HRBP sign-off.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── 7. Approval zone — terminal decision ───────────────────────── */}
      <ApprovalZone
        department={department}
        domainApproval={domainApproval}
        onSetDomainApproval={onSetDomainApproval}
        sla={sla}
        onSetSla={onSetSla}
      />
    </div>
  )
}

/** Terminal approval zone at the bottom of the page. */
function ApprovalZone({ department, domainApproval, onSetDomainApproval, sla, onSetSla }) {
  const [showExceptions, setShowExceptions] = useState(false)
  const [exceptionsText, setExceptionsText] = useState(domainApproval?.exceptions ?? '')

  const hasAction = !!domainApproval?.action

  const BADGE = {
    approved: { bg: 'bg-emerald-50 border-emerald-300 text-emerald-800', label: 'Approved', Icon: Check },
    approvedWithExceptions: { bg: 'bg-emerald-50 border-emerald-300 text-emerald-800', label: 'Approved with Exceptions', Icon: Check },
    rejected: { bg: 'bg-red-50 border-red-300 text-red-800', label: 'Rejected', Icon: X },
    requestChanges: { bg: 'bg-amber-50 border-amber-300 text-amber-800', label: 'Changes Requested', Icon: AlertCircle },
  }
  const badge = hasAction ? BADGE[domainApproval.action] : null

  return (
    <div className="rounded-xl border-2 border-rippling-plum/20 bg-white overflow-hidden shadow-rippling-card">
      {/* Zone header */}
      <div className="px-5 py-3 bg-rippling-chip border-b border-rippling-plum/15 flex items-center gap-3">
        <div className="w-1 h-5 rounded-full bg-rippling-plum shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-rippling-ink">
            Your decision on {department.label}
          </p>
          <p className="text-[11.5px] text-rippling-muted mt-0.5">
            Scroll through the issues and tasks above, then submit your decision
          </p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* SLA row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={12} strokeWidth={1.75} className="text-rippling-muted shrink-0" />
          <span className="text-[12px] text-rippling-muted">Approval deadline:</span>
          <input
            type="date"
            value={sla ?? ''}
            onChange={(e) => onSetSla?.(e.target.value || null)}
            className="h-6 px-2 text-[11.5px] text-rippling-ink border border-rippling-line rounded-md bg-white focus:outline-none focus:border-rippling-plum/60 hover:border-rippling-muted/60 transition-colors"
          />
          {!sla && <span className="text-[11px] text-rippling-muted/50 italic">not set</span>}
        </div>

        {/* Decision state */}
        {!hasAction ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  onSetDomainApproval({ action: 'approved', exceptions: '' })
                  setShowExceptions(false)
                }}
                className="h-9 px-5 rounded-lg bg-rippling-plum text-white text-[13px] font-semibold hover:bg-rippling-plum-hover transition-colors shadow-sm"
              >
                Approve {department.label}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (showExceptions) {
                    onSetDomainApproval({ action: 'approvedWithExceptions', exceptions: exceptionsText })
                    setShowExceptions(false)
                  } else {
                    setShowExceptions(true)
                  }
                }}
                className="h-9 px-4 rounded-lg border border-rippling-plum text-rippling-plum text-[13px] font-medium hover:bg-rippling-chip transition-colors"
              >
                {showExceptions ? 'Confirm Exceptions' : 'Approve with Exceptions'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onSetDomainApproval({ action: 'rejected', exceptions: '' })
                  setShowExceptions(false)
                }}
                className="h-9 px-4 rounded-lg border border-red-300 text-red-600 text-[13px] font-medium hover:bg-red-50 transition-colors"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => {
                  onSetDomainApproval({ action: 'requestChanges', exceptions: '' })
                  setShowExceptions(false)
                }}
                className="h-9 px-4 rounded-lg border border-rippling-line text-rippling-muted text-[13px] font-medium hover:bg-rippling-surface hover:text-rippling-ink transition-colors"
              >
                Request Changes
              </button>
            </div>

            {showExceptions && (
              <div>
                <textarea
                  value={exceptionsText}
                  onChange={(e) => setExceptionsText(e.target.value)}
                  placeholder="Note what you're approving around — e.g. 'ADP India config in progress, resolves by Aug 13'…"
                  rows={2}
                  autoFocus
                  className="w-full text-[12.5px] text-rippling-ink-2 leading-relaxed bg-rippling-surface border border-rippling-plum/30 rounded-lg px-3 py-2 focus:outline-none focus:border-rippling-plum/60 focus:bg-white resize-none"
                />
                <button
                  type="button"
                  onClick={() => setShowExceptions(false)}
                  className="mt-1 text-[11.5px] text-rippling-muted hover:text-rippling-ink transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Decision taken — show badge + change link */
          <div className="flex items-center gap-3 flex-wrap">
            {badge && (
              <span className={classNames(
                'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[13px] font-semibold',
                badge.bg,
              )}>
                <badge.Icon size={13} strokeWidth={2.5} />
                {badge.label}
              </span>
            )}
            {domainApproval?.exceptions && (
              <span className="text-[12px] text-rippling-muted italic max-w-[260px] truncate">
                "{domainApproval.exceptions}"
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                onSetDomainApproval(null)
                setShowExceptions(false)
                setExceptionsText('')
              }}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-rippling-line text-[11.5px] text-rippling-muted hover:text-rippling-ink hover:bg-rippling-surface transition-colors"
            >
              <RotateCcw size={10} strokeWidth={2} />
              Change decision
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** Collapsible informational list of automated tasks. */
function AutoTasksSummary({ tasks }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-emerald-50/70 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
            <Zap size={10} strokeWidth={2.5} />
          </span>
          <span className="text-[12.5px] font-medium text-emerald-800">
            {tasks.length} automated — run by the platform on commit
          </span>
        </div>
        <span className="text-emerald-600 group-hover:text-emerald-800 transition-colors">
          {expanded ? <ChevronUp size={13} strokeWidth={2} /> : <ChevronDown size={13} strokeWidth={2} />}
        </span>
      </button>
      {expanded && (
        <ul className="divide-y divide-emerald-200/60 border-t border-emerald-200">
          {tasks.map((t) => (
            <li key={t.id} className="px-4 py-2.5 flex items-start gap-2">
              <span className="mt-[5px] shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <div>
                <p className="text-[12.5px] font-medium text-rippling-ink">{t.title}</p>
                <p className="text-[11.5px] text-rippling-muted mt-0.5 leading-relaxed">{t.description}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
