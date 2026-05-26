import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { classNames } from '../../../../lib/utils'
import SampleAffectedList from './SampleAffectedList'
import EventApproverChip from './EventApproverChip'

const TIER_STYLES = {
  critical: {
    bar: 'bg-red-500',
    axisBg: 'bg-red-50 text-red-700',
    border: 'border-red-200',
    whatHappensBg: 'bg-red-50 border-red-100 text-red-700',
  },
  high: {
    bar: 'bg-orange-500',
    axisBg: 'bg-orange-50 text-orange-700',
    border: 'border-orange-200',
    whatHappensBg: 'bg-orange-50 border-orange-100 text-orange-700',
  },
  medium: {
    bar: 'bg-amber-400',
    axisBg: 'bg-amber-50 text-amber-700',
    border: 'border-amber-200',
    whatHappensBg: 'bg-amber-50 border-amber-100 text-amber-700',
  },
  routine: {
    bar: 'bg-rippling-elevated',
    axisBg: 'bg-rippling-surface-2 text-rippling-muted',
    border: 'border-rippling-line',
    whatHappensBg: 'bg-rippling-surface text-rippling-muted border-rippling-line',
  },
}

/**
 * Single event card inside PreviewTierSection.
 *
 * Props:
 *   source     — EventSource descriptor from previewEventsCatalog.js
 *   entry      — status entry from usePreviewRunner statuses map
 *   onAssignApprover(eventId, person) — bubble up to FollowUpsStep for right-rail sync
 *   onRemoveApprover(eventId)
 *   onOpenDetails(source) — navigate to the owning substep
 *   isLoading  — bool (entry still pending/running)
 */
export default function EventCard({ source, entry, onAssignApprover, onRemoveApprover, onOpenDetails, hideApproverChip = false }) {
  const [expanded, setExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const styles = TIER_STYLES[source.tier] ?? TIER_STYLES.routine
  const isLoading = !entry || entry.status === 'pending' || entry.status === 'running'

  const contextFields = entry?.contextFields ?? source.contextFields ?? []
  const sampleEmployees = entry?.sampleEmployees ?? []
  const count = entry?.count ?? 0
  const approver = entry?.approver ?? null

  const allEmployeesVisible = showAll || sampleEmployees.length <= 3
  const visibleEmployees = allEmployeesVisible ? sampleEmployees : sampleEmployees.slice(0, 3)
  const overflow = sampleEmployees.length - 3

  return (
    <div
      className={classNames(
        'relative rounded-xl border shadow-rippling-card overflow-hidden bg-white transition-shadow hover:shadow-md',
        styles.border,
      )}
    >
      {/* Left accent bar */}
      <div className={classNames('absolute left-0 top-0 bottom-0 w-1', styles.bar)} />

      {/* Main content */}
      <div className="pl-5 pr-4 py-4">
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className={classNames('inline-flex h-5 items-center px-2 rounded-full text-[10.5px] font-semibold', styles.axisBg)}>
            {source.axis.toUpperCase()}
          </span>
          {count > 0 && (
            <span className="text-[11.5px] text-rippling-muted font-medium tabular-nums">
              {count} employee{count === 1 ? '' : 's'}
            </span>
          )}
          {source.systemPill && (
            <>
              <span className="text-rippling-line">·</span>
              <span className="text-[11.5px] text-rippling-muted">{source.systemPill}</span>
            </>
          )}
        </div>

        {/* Title */}
        {isLoading ? (
          <div className="h-4 w-56 bg-rippling-surface-2 rounded animate-pulse mb-1" />
        ) : (
          <p className="text-[14px] font-semibold text-rippling-ink leading-snug mb-0.5">
            {source.title}
          </p>
        )}

        {/* Sublabel */}
        {!isLoading && source.sublabel && (
          <p className="text-[12px] text-rippling-muted mb-3 leading-relaxed">
            {source.sublabel}
          </p>
        )}

        {/* Expanded content */}
        {!isLoading && expanded && (
          <div className="space-y-3 mb-3">
            {/* What happens callout */}
            {source.whatHappens && (
              <div className={classNames('rounded-lg border px-3 py-2.5 text-[12px] leading-relaxed', styles.whatHappensBg)}>
                <span className="font-semibold">What happens: </span>
                {source.whatHappens}
              </div>
            )}

            {/* Context fields 2-col grid */}
            {contextFields.length > 0 && (
              <div className={classNames(
                'grid gap-2',
                contextFields.length >= 3 ? 'grid-cols-2' : 'grid-cols-1',
              )}>
                {contextFields.map((field) => (
                  <div key={field.label} className="bg-rippling-surface-2 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-rippling-muted mb-0.5">
                      {field.label}
                    </p>
                    <p className="text-[12.5px] font-medium text-rippling-ink">{field.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Sample affected employees */}
            {sampleEmployees.length > 0 && (
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-rippling-muted mb-1.5">
                  Sample affected ({Math.min(visibleEmployees.length, sampleEmployees.length)} of {count || sampleEmployees.length})
                </p>
                <SampleAffectedList
                  employees={visibleEmployees}
                  max={visibleEmployees.length}
                  accentClass="text-rippling-muted"
                  nameClass="text-rippling-ink"
                />
                {!showAll && overflow > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="mt-1.5 text-[11.5px] font-medium text-rippling-plum hover:underline"
                  >
                    View all {count} →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer row: expand toggle + approver + details */}
        {!isLoading && (
          <div className="flex items-center justify-between gap-3 mt-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Expand / collapse */}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 h-6 px-2 rounded-full border border-rippling-line bg-white text-[11.5px] text-rippling-muted hover:text-rippling-ink hover:bg-rippling-surface transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp size={11} strokeWidth={2} />
                    Less
                  </>
                ) : (
                  <>
                    <ChevronDown size={11} strokeWidth={2} />
                    Details
                  </>
                )}
              </button>

              {/* Approver chip — only for events that require approval, and not hidden by context */}
              {source.requiresApproval && !hideApproverChip && (
                <EventApproverChip
                  approver={approver}
                  onAssign={(person) => onAssignApprover?.(source.id, person)}
                  onRemove={() => onRemoveApprover?.(source.id)}
                  required={!approver}
                />
              )}
            </div>

            {/* Deep-link to resolution substep */}
            {source.ownsResolution && (
              <button
                type="button"
                onClick={() => onOpenDetails?.(source)}
                className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full border border-rippling-line bg-white text-[11.5px] text-rippling-muted hover:text-rippling-ink hover:bg-rippling-surface transition-colors shrink-0"
              >
                <ExternalLink size={11} strokeWidth={1.75} />
                Go to {source.ownsResolution.kind === 'integration' ? 'Integrations' : source.ownsResolution.kind === 'comms' ? 'Communications' : 'department'}
              </button>
            )}
          </div>
        )}

        {/* Loading skeleton footer */}
        {isLoading && (
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-20 bg-rippling-surface-2 rounded-full animate-pulse" />
            <div className="h-5 w-24 bg-rippling-surface-2 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )
}
