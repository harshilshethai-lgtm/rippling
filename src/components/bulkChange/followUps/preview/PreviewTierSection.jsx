import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { classNames } from '../../../../lib/utils'
import EventCard from './EventCard'
import { TIER_META } from './previewEventsCatalog'

const TIER_COUNT_STYLES = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  routine: 'bg-rippling-surface-2 text-rippling-muted',
}

const TIER_HEADER_STYLES = {
  critical: 'text-red-700',
  high: 'text-orange-700',
  medium: 'text-amber-700',
  routine: 'text-rippling-muted',
}

const TIER_DOT = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  routine: 'bg-rippling-elevated',
}

/**
 * Collapsible section for one risk tier (Blocker / Critical / High / Routine).
 * When collapsed, shows a one-line summary of what's inside.
 *
 * Props:
 *   tier        — 'blocker' | 'critical' | 'high' | 'routine'
 *   events      — [{ source, entry }] — only triggered events
 *   allStatuses — the full statuses Map (for loading detection)
 *   onAssignApprover — (eventId, person) => void
 *   onRemoveApprover — (eventId) => void
 *   onOpenDetails    — (source) => void
 */
export default function PreviewTierSection({
  tier,
  events,
  onAssignApprover,
  onRemoveApprover,
  onOpenDetails,
  hideApproverChip = false,
}) {
  const meta = TIER_META[tier]
  const [expanded, setExpanded] = useState(meta?.expandedByDefault ?? false)

  const triggeredEvents = events.filter((e) => e.entry?.triggered)
  const loadingEvents = events.filter((e) => e.entry?.status === 'pending' || e.entry?.status === 'running')
  const isLoading = loadingEvents.length > 0 && triggeredEvents.length === 0

  // Don't render the section at all if nothing triggered and not loading
  if (triggeredEvents.length === 0 && !isLoading) return null

  const count = triggeredEvents.length
  const axes = [...new Set(triggeredEvents.map((e) => e.source.axis))]
  const axisLabel = axes.slice(0, 3).join(' · ')

  // Summary line shown when collapsed (for non-expanded sections)
  const summaryLine = count > 0
    ? `${count} event${count === 1 ? '' : 's'}${axisLabel ? ': ' + axisLabel : ''}`
    : 'Running checks…'

  return (
    <div className="mb-3">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-1 py-1.5 group rounded-md hover:bg-rippling-surface transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {/* Tier dot */}
          <div className={classNames('w-2 h-2 rounded-full shrink-0', TIER_DOT[tier])} />

          {/* Tier label + count */}
          <div className="flex items-center gap-2">
            <span className={classNames('text-[13px] font-semibold', TIER_HEADER_STYLES[tier])}>
              {count > 0 ? `${count} ${meta?.label?.toLowerCase()} event${count === 1 ? '' : 's'}` : meta?.label}
            </span>
            {meta?.sublabel && (
              <span className="text-[11.5px] text-rippling-muted">
                {meta.sublabel}
              </span>
            )}
          </div>

          {/* Axis chips when collapsed */}
          {!expanded && axisLabel && (
            <span className="text-[11px] text-rippling-muted">
              · {axisLabel}
            </span>
          )}
        </div>

        <span className="text-rippling-muted group-hover:text-rippling-ink transition-colors">
          {expanded ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
        </span>
      </button>

      {/* Events list */}
      {expanded && (
        <div className="mt-2 space-y-3">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-white rounded-xl border border-rippling-line shadow-rippling-card animate-pulse" />
              ))}
            </div>
          )}
          {triggeredEvents.map(({ source, entry }) => (
            <EventCard
              key={source.id}
              source={source}
              entry={entry}
              onAssignApprover={onAssignApprover}
              onRemoveApprover={onRemoveApprover}
              onOpenDetails={onOpenDetails}
              hideApproverChip={hideApproverChip}
            />
          ))}
        </div>
      )}

      {/* Collapsed summary for non-default-expanded tiers */}
      {!expanded && !meta?.expandedByDefault && count > 0 && (
        <p className="text-[12px] text-rippling-muted pl-6 mt-0.5">
          {summaryLine}
        </p>
      )}
    </div>
  )
}
