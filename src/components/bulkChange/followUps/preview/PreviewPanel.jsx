import { useMemo } from 'react'
import { TIER_ORDER } from './previewEventsCatalog'
import PreviewAiSummary from './PreviewAiSummary'
import PreviewStatsRow from './PreviewStatsRow'
import PreviewTierSection from './PreviewTierSection'
import { buildAiSummary } from './buildPreviewSummary'

/**
 * Main Preview panel — replaces SystemChecksPanel as the first substep
 * inside FollowUpsStep.
 *
 * All runner state is owned by FollowUpsStep (via usePreviewRunner) and passed
 * down here as props so there is a single source of truth for gate logic and
 * approver assignment.
 *
 * Props:
 *   eventSources       — full PREVIEW_EVENT_SOURCES array (from followUpsConfig)
 *   totalEmployees     — number of employees in the cohort
 *   statuses           — Map from usePreviewRunner
 *   assignApprover     — (eventId, person) => void  (from usePreviewRunner)
 *   removeApprover     — (eventId) => void           (from usePreviewRunner)
 *   aggregate          — { critical, high, medium, routine }
 *   allDone            — bool
 *   triggeredByTier    — { [tier]: [{ source, entry }] }
 *   onAssignApprover   — (eventId, person) => void  (syncs reviewer to right rail)
 *   onRemoveApprover   — (eventId) => void
 *   onOpenDetails      — (source) => void  (deep-links to owning substep)
 */
export default function PreviewPanel({
  eventSources,
  totalEmployees,
  statuses,
  assignApprover,
  removeApprover,
  aggregate,
  allDone,
  triggeredByTier,
  onAssignApprover,
  onRemoveApprover,
  onOpenDetails,
}) {
  // Build AI summary from triggered events
  const aiSummary = useMemo(() => {
    if (!allDone) return null
    const topCategories = []
    for (const tier of ['critical', 'high', 'medium']) {
      const events = triggeredByTier[tier] ?? []
      for (const { source } of events) {
        const chip = source.axis
        if (!topCategories.includes(chip)) topCategories.push(chip)
        if (topCategories.length >= 4) break
      }
      if (topCategories.length >= 4) break
    }
    return buildAiSummary({ aggregate, totalEmployees, topCategories })
  }, [allDone, aggregate, totalEmployees, triggeredByTier])

  const handleAssign = (eventId, person) => {
    assignApprover(eventId, person)
    onAssignApprover?.(eventId, person)
  }

  const handleRemove = (eventId) => {
    removeApprover(eventId)
    onRemoveApprover?.(eventId)
  }

  return (
    <div className="w-full">
      {/* AI summary (fades in once checks settle) */}
      {allDone && aiSummary && (
        <PreviewAiSummary
          headline={aiSummary.headline}
          body={aiSummary.body}
          chips={aiSummary.chips}
          isLoading={!allDone}
        />
      )}

      {/* KPI stats row */}
      <PreviewStatsRow
        aggregate={aggregate}
        totalEmployees={totalEmployees}
        isLoading={!allDone}
      />

      {/* Divider */}
      <div className="h-px bg-rippling-line mb-4" />

      {/* Tier sections */}
      {TIER_ORDER.map((tier) => {
        const events = triggeredByTier[tier] ?? []
        // For loading state, also include pending events in each tier
        const allTierEvents = eventSources
          ? eventSources
              .filter((src) => src.tier === tier)
              .map((src) => ({ source: src, entry: statuses.get(src.id) }))
          : []

        return (
          <PreviewTierSection
            key={tier}
            tier={tier}
            events={allTierEvents}
            onAssignApprover={handleAssign}
            onRemoveApprover={handleRemove}
            onOpenDetails={onOpenDetails}
          />
        )
      })}

      {/* Empty state */}
      {allDone && Object.values(aggregate).every((v) => v === 0) && (
        <div className="py-8 text-center">
          <p className="text-[14px] font-medium text-rippling-ink">All clear</p>
          <p className="text-[12.5px] text-rippling-muted mt-1">
            No events flagged for this change. You're good to go.
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Gate logic for FollowUpsStep — determines if the Preview substep allows
 * the user to continue.
 *
 * Rules:
 *   - All checks must have settled (no pending/running).
 *   - Every triggered Critical or High event that has requiresApproval: true
 *     must have an approver assigned.
 *   - Medium and Routine events never block.
 *
 * @param {Map}    statuses       — from usePreviewRunner
 * @param {object} aggregate      — { critical, high, medium, routine }
 * @param {Array}  eventSources   — full source list
 * @param {bool}   allDone        — whether all runners have settled
 * @returns {{ canContinue: bool, disabledReason: string | null }}
 */
export function computePreviewGate({ statuses, aggregate, eventSources, allDone }) {
  if (!allDone) {
    return { canContinue: false, disabledReason: 'Running pre-flight checks…' }
  }
  // Count triggered Critical/High events missing an approver
  let missing = 0
  if (eventSources) {
    for (const src of eventSources) {
      if (src.tier !== 'critical' && src.tier !== 'high') continue
      if (!src.requiresApproval) continue
      const entry = statuses.get(src.id)
      if (!entry?.triggered) continue
      if (!entry.approver) missing++
    }
  }
  if (missing > 0) {
    return {
      canContinue: false,
      disabledReason: `Assign a reviewer to ${missing} Critical/High event${missing === 1 ? '' : 's'} to continue`,
    }
  }
  return { canContinue: true, disabledReason: null }
}
