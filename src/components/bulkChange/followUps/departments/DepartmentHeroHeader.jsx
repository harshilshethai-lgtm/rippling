import DepartmentOwnerPicker from './DepartmentOwnerPicker'
import { classNames } from '../../../../lib/utils'

/**
 * Compact hero header — department identity, job meta, and stat chips.
 * Approval actions live at the bottom of DepartmentPanel as a terminal zone.
 */
export default function DepartmentHeroHeader({
  department,
  jobMeta,
  triggeredEvents,
  humanTaskCount,
  autoTaskCount,
  owner,
  onSetOwner,
  onClearOwner,
}) {
  const Icon = department.icon

  const criticalCount = (triggeredEvents ?? []).filter((e) => e.source.tier === 'critical' && e.entry?.triggered).length
  const highCount = (triggeredEvents ?? []).filter((e) => e.source.tier === 'high' && e.entry?.triggered).length
  const mediumCount = (triggeredEvents ?? []).filter((e) => e.source.tier === 'medium' && e.entry?.triggered).length
  const totalTriggered = criticalCount + highCount + mediumCount +
    (triggeredEvents ?? []).filter((e) => e.source.tier === 'routine' && e.entry?.triggered).length
  const totalTasks = humanTaskCount + autoTaskCount

  return (
    <div className="bg-white rounded-xl border border-rippling-line shadow-rippling-card mb-5 overflow-hidden">
      {/* Identity row */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-rippling-chip text-rippling-plum flex items-center justify-center shrink-0">
            <Icon size={20} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[16px] font-semibold text-rippling-ink leading-tight">
                {department.label}
              </h3>
              <span className="inline-flex items-center h-[18px] px-1.5 rounded bg-rippling-surface-2 text-[9.5px] font-bold uppercase tracking-widest text-rippling-muted/80">
                Your Domain
              </span>
            </div>
            <p className="text-[12px] text-rippling-muted mt-0.5 leading-snug">{department.blurb}</p>
          </div>
        </div>
        <div className="shrink-0 pt-0.5">
          <DepartmentOwnerPicker owner={owner} onSelect={onSetOwner} onClear={onClearOwner} />
        </div>
      </div>

      {/* Job meta strip */}
      {jobMeta && (
        <div className="px-5 py-1.5 bg-rippling-surface border-t border-rippling-line/50 flex items-center gap-2 flex-wrap">
          <span className="text-[11.5px] font-medium text-rippling-ink truncate max-w-[200px]">{jobMeta.name}</span>
          {jobMeta.lead && (
            <>
              <span className="text-rippling-line text-[10px]">·</span>
              <span className="text-[11.5px] text-rippling-muted">{jobMeta.lead.name}</span>
            </>
          )}
          {jobMeta.effectiveDate && (
            <>
              <span className="text-rippling-line text-[10px]">·</span>
              <span className="text-[11.5px] text-rippling-muted">
                Effective {new Date(jobMeta.effectiveDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </>
          )}
        </div>
      )}

      {/* Stat chips */}
      <div className="px-5 py-3 border-t border-rippling-line/50 flex items-center gap-2 flex-wrap">
        {/* Issue chips */}
        {totalTriggered === 0 ? (
          <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11.5px] font-medium text-emerald-700">
            No issues flagged
          </span>
        ) : (
          <>
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-red-50 border border-red-200 text-[11.5px] font-semibold text-red-700">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {criticalCount} critical
              </span>
            )}
            {highCount > 0 && (
              <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-orange-50 border border-orange-200 text-[11.5px] font-semibold text-orange-700">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                {highCount} high
              </span>
            )}
            {mediumCount > 0 && (
              <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-amber-50 border border-amber-200 text-[11.5px] font-medium text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                {mediumCount} medium
              </span>
            )}
          </>
        )}

        {/* Divider dot */}
        {totalTasks > 0 && (
          <span className="text-rippling-line/80 text-[10px] mx-0.5">·</span>
        )}

        {/* Task chip */}
        {totalTasks > 0 && (
          <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-rippling-chip border border-rippling-line text-[11.5px] font-medium text-rippling-ink-2">
            {totalTasks} task{totalTasks === 1 ? '' : 's'} on commit
          </span>
        )}
        {humanTaskCount > 0 && (
          <span className="text-[11px] text-rippling-muted">
            ({autoTaskCount} auto · {humanTaskCount} for your team)
          </span>
        )}
      </div>
    </div>
  )
}
