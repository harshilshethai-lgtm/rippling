import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Lightweight runner for department pre-flight checks.
 *
 * Each item carries a hard-coded `outcome` ('success' | 'warning' | 'failure')
 * so the demo author has full control over which checks fire what state. The
 * runner stages items with the same animation cadence the existing System
 * Checks runner uses (~700–1500 ms), then resolves to the configured outcome.
 *
 * Re-running a failed or warned check always succeeds on retry — matches the
 * existing probe behaviour and keeps the demo unstuck.
 *
 * Returned shape mirrors useFollowUpsRunner so panels can render with the
 * existing ChecklistItem component unchanged:
 *
 *   statuses: Map<itemId, { status, error?: string }>
 *   rerun(itemId)
 *   allDone: every item resolved & no non-warning failure
 *   failureCount, warningCount
 */
function staggerDelay(index) {
  return 700 + (index % 5) * 160
}

const WARNING_MESSAGES = {
  'hr.hrbpAssigned':       'No primary HRBP is assigned for the target country yet.',
  'pay.openDrafts':        'There are open paycheck drafts that would need to be re-cut after the change.',
  'it.vpnCapacity':        'The nearest regional VPN concentrator is at >80% capacity.',
  'ben.carrierMap':        'The carrier coverage map for the target country has not been refreshed in 30 days.',
}

const FAILURE_MESSAGES = {
  default: 'The probe did not complete. Re-run to retry.',
}

export function useDepartmentPreflightRunner({ items, panelKey }) {
  const [statuses, setStatuses] = useState(() => new Map())
  const activePanelRef = useRef(panelKey)
  const timerIdsRef = useRef([])
  const retryRef = useRef({})

  const clearTimers = useCallback(() => {
    for (const id of timerIdsRef.current) clearTimeout(id)
    timerIdsRef.current = []
  }, [])

  useEffect(() => {
    activePanelRef.current = panelKey
    clearTimers()
    retryRef.current = {}

    if (!items || items.length === 0) {
      setStatuses(new Map())
      return
    }

    // Seed everything as pending so the UI immediately shows clocks.
    setStatuses(() => {
      const m = new Map()
      for (const item of items) m.set(item.id, { status: 'pending' })
      return m
    })

    items.forEach((item, index) => {
      const delay = staggerDelay(index)

      const runId = setTimeout(() => {
        if (activePanelRef.current !== panelKey) return
        setStatuses((prev) => {
          const next = new Map(prev)
          next.set(item.id, { status: 'running' })
          return next
        })
      }, delay * 0.3)
      timerIdsRef.current.push(runId)

      const resolveId = setTimeout(() => {
        if (activePanelRef.current !== panelKey) return
        setStatuses((prev) => {
          const next = new Map(prev)
          const outcome = item.outcome ?? 'success'
          if (outcome === 'warning') {
            next.set(item.id, {
              status: 'warning',
              error: WARNING_MESSAGES[item.id] ?? 'Heads up — review before continuing.',
            })
          } else if (outcome === 'failure') {
            next.set(item.id, {
              status: 'failure',
              error: FAILURE_MESSAGES[item.id] ?? FAILURE_MESSAGES.default,
            })
          } else {
            next.set(item.id, { status: 'success' })
          }
          return next
        })
      }, delay)
      timerIdsRef.current.push(resolveId)
    })

    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelKey])

  const rerun = useCallback(
    (itemId) => {
      const item = items?.find((i) => i.id === itemId)
      if (!item) return
      retryRef.current[itemId] = (retryRef.current[itemId] ?? 0) + 1

      setStatuses((prev) => {
        const next = new Map(prev)
        next.set(itemId, { status: 'running' })
        return next
      })

      const id = setTimeout(() => {
        setStatuses((prev) => {
          const next = new Map(prev)
          // Re-runs always succeed (mirrors existing probe behaviour).
          next.set(itemId, { status: 'success' })
          return next
        })
      }, 800)
      timerIdsRef.current.push(id)
    },
    [items],
  )

  const runningCount = [...statuses.values()].filter(
    (s) => s.status === 'running' || s.status === 'pending',
  ).length
  const failureCount = [...statuses.values()].filter((s) => s.status === 'failure').length
  const warningCount = [...statuses.values()].filter((s) => s.status === 'warning').length

  // Warnings never block — only hard failures.
  const allDone =
    items.length === 0 || (statuses.size > 0 && runningCount === 0 && failureCount === 0)

  return { statuses, rerun, allDone, failureCount, warningCount, runningCount }
}
