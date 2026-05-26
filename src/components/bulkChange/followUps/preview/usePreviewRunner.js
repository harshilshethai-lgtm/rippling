import { useCallback, useEffect, useRef, useState } from 'react'
import { TIER_ORDER } from './previewEventsCatalog'

/**
 * Runs every EventSource from PREVIEW_EVENT_SOURCES against the current wizard
 * context and produces a statuses map keyed by event id.
 *
 * statuses: Map<eventId, {
 *   status:          'pending' | 'running' | 'resolved' | 'not-triggered'
 *   triggered:       bool
 *   count:           number
 *   sampleEmployees: { id, name, reason }[]
 *   contextFields:   { label, value }[] | undefined  (overrides source if provided by evaluate)
 *   tier:            string   (copied from source for convenience)
 *   approver:        { id, name, role } | null
 * }>
 *
 * aggregate: { blocker, critical, high, routine } — count of triggered events per tier
 * allDone:   bool — true when all events have settled (no pending/running)
 * blockerCount, criticalCount, highCount — derived from aggregate for gate logic
 */
/**
 * @param {Function} onAutoApprove  — called with (approver) for each auto-approver
 *                                    on a newly-triggered event.  Called once per
 *                                    approver per run so the caller can deduplicate.
 */
export function usePreviewRunner({ eventSources, ctx, substepId, onAutoApprove }) {
  const [statuses, setStatuses] = useState(() => new Map())
  const activeRef = useRef(substepId)
  const timerIdsRef = useRef([])

  const clearTimers = useCallback(() => {
    for (const id of timerIdsRef.current) clearTimeout(id)
    timerIdsRef.current = []
  }, [])

  useEffect(() => {
    activeRef.current = substepId
    clearTimers()

    if (!eventSources || eventSources.length === 0) return

    // Immediately set all to pending
    setStatuses(() => {
      const m = new Map()
      for (const src of eventSources) {
        m.set(src.id, { status: 'pending', triggered: false, count: 0, sampleEmployees: [], tier: src.tier, approver: null })
      }
      return m
    })

    // Evaluate all sources synchronously (they're pure functions against ctx)
    // but reveal results with a stagger to preserve the "pre-flight running" feel.
    const evaluations = new Map()
    for (const src of eventSources) {
      try {
        const result = src.evaluate(ctx)
        evaluations.set(src.id, result)
      } catch (_) {
        evaluations.set(src.id, { triggered: false, count: 0, sampleEmployees: [] })
      }
    }

    eventSources.forEach((src, index) => {
      const runDelay = 200 + index * 90
      const resolveDelay = 600 + index * 110

      const runId = setTimeout(() => {
        if (activeRef.current !== substepId) return
        setStatuses((prev) => {
          const next = new Map(prev)
          const existing = next.get(src.id) ?? {}
          next.set(src.id, { ...existing, status: 'running' })
          return next
        })
      }, runDelay)
      timerIdsRef.current.push(runId)

      const resolveId = setTimeout(() => {
        if (activeRef.current !== substepId) return
        const result = evaluations.get(src.id) ?? { triggered: false, count: 0, sampleEmployees: [] }
        setStatuses((prev) => {
          const next = new Map(prev)
          const existing = next.get(src.id) ?? {}
          next.set(src.id, {
            ...existing,
            status: result.triggered ? 'resolved' : 'not-triggered',
            triggered: result.triggered,
            count: result.count ?? 0,
            sampleEmployees: result.sampleEmployees ?? [],
            // evaluate() may return richer contextFields that override the source default
            contextFields: result.contextFields ?? src.contextFields,
            tier: src.tier,
          })
          return next
        })
        // Fire auto-approvers for triggered events
        if (result.triggered && src.autoApprovers?.length && onAutoApprove) {
          for (const approver of src.autoApprovers) {
            onAutoApprove(approver)
          }
        }
      }, resolveDelay)
      timerIdsRef.current.push(resolveId)
    })

    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [substepId])

  // Assign an approver to a specific event (called from PreviewPanel)
  const assignApprover = useCallback((eventId, person) => {
    setStatuses((prev) => {
      const next = new Map(prev)
      const existing = next.get(eventId)
      if (!existing) return prev
      next.set(eventId, { ...existing, approver: person })
      return next
    })
  }, [])

  const removeApprover = useCallback((eventId) => {
    setStatuses((prev) => {
      const next = new Map(prev)
      const existing = next.get(eventId)
      if (!existing) return prev
      next.set(eventId, { ...existing, approver: null })
      return next
    })
  }, [])

  // Computed aggregates
  const aggregate = { critical: 0, high: 0, medium: 0, routine: 0 }
  let allDone = true
  for (const [, entry] of statuses) {
    if (entry.status === 'pending' || entry.status === 'running') {
      allDone = false
    }
    if (entry.triggered) {
      aggregate[entry.tier] = (aggregate[entry.tier] ?? 0) + 1
    }
  }
  if (statuses.size === 0) allDone = false

  // Count triggered Critical/High events missing a reviewer
  let missingApprovers = 0
  if (eventSources) {
    for (const src of eventSources) {
      if (src.tier !== 'critical' && src.tier !== 'high') continue
      if (!src.requiresApproval) continue
      const entry = statuses.get(src.id)
      if (!entry?.triggered) continue
      if (!entry.approver) missingApprovers++
    }
  }

  // Ordered list of triggered events for rendering
  const triggeredByTier = {}
  for (const tier of TIER_ORDER) triggeredByTier[tier] = []
  if (eventSources) {
    for (const src of eventSources) {
      const entry = statuses.get(src.id)
      if (!entry) continue
      triggeredByTier[src.tier] = triggeredByTier[src.tier] ?? []
      triggeredByTier[src.tier].push({ source: src, entry })
    }
  }

  return {
    statuses,
    assignApprover,
    removeApprover,
    aggregate,
    allDone,
    missingApprovers,
    triggeredByTier,
  }
}
