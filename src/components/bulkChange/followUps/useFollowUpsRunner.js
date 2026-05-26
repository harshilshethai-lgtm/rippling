import { useCallback, useEffect, useRef, useState } from 'react'
import { computeRowStatuses } from '../defineChanges/validation'

/**
 * Deterministic failure decision for write/comm items.
 * ~15% failure rate keyed by item id + retry count so every run is stable
 * but retries have an 85% pass bias.
 */
function shouldFail(itemId, retryCount) {
  if (retryCount > 0) {
    // Retries succeed ~85% of the time
    let hash = 0
    const raw = itemId + '|retry|' + retryCount
    for (let i = 0; i < raw.length; i++) hash = (hash * 31 + raw.charCodeAt(i)) | 0
    return Math.abs(hash) % 100 < 15
  }
  let hash = 0
  for (let i = 0; i < itemId.length; i++) hash = (hash * 31 + itemId.charCodeAt(i)) | 0
  return Math.abs(hash) % 100 < 15
}

/** Pick a canned error message deterministically */
function pickError(item, retryCount) {
  if (!item.errorMessages || item.errorMessages.length === 0) return null
  let hash = 0
  const raw = item.id + retryCount
  for (let i = 0; i < raw.length; i++) hash = (hash * 31 + raw.charCodeAt(i)) | 0
  return item.errorMessages[Math.abs(hash) % item.errorMessages.length]
}

/** Stagger delay between 700 and 1500 ms, deterministic per item position */
function staggerDelay(index) {
  return 700 + (index % 5) * 160
}

/**
 * Deterministic simulation helpers for warning checks.
 * These run against the employee list; ~25% of employees trigger each warning.
 */
function hasRecentChange(empId, fieldKey) {
  const raw = empId + '|recentChange|' + fieldKey
  let hash = 0
  for (let i = 0; i < raw.length; i++) hash = (hash * 31 + raw.charCodeAt(i)) | 0
  return Math.abs(hash) % 4 === 0
}

function isOnLeave(empId) {
  let hash = 0
  for (let i = 0; i < empId.length; i++) hash = (hash * 31 + empId.charCodeAt(i)) | 0
  return Math.abs(hash) % 5 === 0
}

function hasPendingApproval(empId, fieldKey) {
  const raw = empId + '|pendingApproval|' + fieldKey
  let hash = 0
  for (let i = 0; i < raw.length; i++) hash = (hash * 31 + raw.charCodeAt(i)) | 0
  return Math.abs(hash) % 5 === 0
}

/**
 * Run the System Checks validators against the current wizard context.
 * Returns a map of itemId → { ok: bool, affectedEmployees: [] }.
 */
function runValidations(systemCheckItems, ctx) {
  const { employees, selectedFieldKeys, bulkValues, cellOverrides, uniformByField } = ctx

  if (!employees || employees.length === 0) {
    return {}
  }

  const rowStatuses = computeRowStatuses({
    employees,
    selectedFieldKeys,
    bulkValues,
    cellOverrides,
    uniformByField,
  })

  const results = {}

  for (const item of systemCheckItems) {
    if (item.kind !== 'validation') continue

    if (item.ruleTag === 'cyclic') {
      const affected = []
      for (const [empId, { reasons }] of rowStatuses) {
        if (reasons.some((r) => r.includes('Cyclic manager dependency'))) {
          const emp = employees.find((e) => e.id === empId)
          if (emp) affected.push({ id: empId, name: emp.fullName, reason: reasons.find((r) => r.includes('Cyclic')) })
        }
      }
      results[item.id] = { ok: affected.length === 0, affectedEmployees: affected }
    }

    if (item.ruleTag === 'comp') {
      const affected = []
      for (const [empId, { reasons }] of rowStatuses) {
        const compReason = reasons.find((r) => r.includes('Comp increase') && r.includes('exceeds 20%'))
        if (compReason) {
          const emp = employees.find((e) => e.id === empId)
          if (emp) affected.push({ id: empId, name: emp.fullName, reason: compReason })
        }
      }
      results[item.id] = { ok: affected.length === 0, affectedEmployees: affected }
    }

    if (item.ruleTag === 'compWarning') {
      const affected = []
      for (const [empId, { reasons }] of rowStatuses) {
        const compReason = reasons.find((r) => r.includes('Comp increase') && r.includes('exceeds 10%'))
        if (compReason) {
          const emp = employees.find((e) => e.id === empId)
          if (emp) affected.push({ id: empId, name: emp.fullName, reason: compReason })
        }
      }
      results[item.id] = { ok: affected.length === 0, affectedEmployees: affected }
    }

    if (item.ruleTag === 'conflict') {
      const affected = []
      for (const [empId, { reasons }] of rowStatuses) {
        const conflictReason = reasons.find((r) => r.includes('scheduled in another worklist'))
        if (conflictReason) {
          const emp = employees.find((e) => e.id === empId)
          if (emp) affected.push({ id: empId, name: emp.fullName, reason: conflictReason })
        }
      }
      results[item.id] = { ok: affected.length === 0, affectedEmployees: affected }
    }

    if (item.ruleTag === 'recentChange') {
      const affected = []
      for (const emp of employees) {
        const triggeredField = selectedFieldKeys.find((k) => hasRecentChange(emp.id, k))
        if (triggeredField) {
          const label = triggeredField.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
          affected.push({ id: emp.id, name: emp.fullName, reason: `"${label}" was changed within the last 30 days` })
        }
      }
      results[item.id] = { ok: affected.length === 0, affectedEmployees: affected }
    }

    if (item.ruleTag === 'onLeave') {
      const affected = []
      for (const emp of employees) {
        if (isOnLeave(emp.id)) {
          affected.push({ id: emp.id, name: emp.fullName, reason: 'Employee is on leave — changes will be queued' })
        }
      }
      results[item.id] = { ok: affected.length === 0, affectedEmployees: affected }
    }

    if (item.ruleTag === 'pendingApproval') {
      const affected = []
      for (const emp of employees) {
        const triggeredField = selectedFieldKeys.find((k) => hasPendingApproval(emp.id, k))
        if (triggeredField) {
          const label = triggeredField.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
          affected.push({ id: emp.id, name: emp.fullName, reason: `Pending approval for "${label}" in another workflow` })
        }
      }
      results[item.id] = { ok: affected.length === 0, affectedEmployees: affected }
    }
  }

  return results
}

/**
 * Per-substep runner hook.
 *
 * @param {object[]} items   — the item list for the currently active substep
 * @param {string}   substepId — changes on substep switch, which triggers a fresh run
 * @param {object}   ctx     — { employees, selectedFieldKeys, bulkValues, cellOverrides, uniformByField }
 * @param {boolean}  isSystemChecks — whether the active substep is the System Checks panel
 *
 * Returns { statuses, rerun, allDone, runningCount, failureCount }
 *
 * statuses: Map<itemId, {
 *   status: 'pending'|'running'|'success'|'failure',
 *   error?: string,
 *   affectedEmployees?: { id, name, reason }[],
 * }>
 */
export function useFollowUpsRunner({ items, substepId, ctx, isSystemChecks }) {
  const [statuses, setStatuses] = useState(() => new Map())
  const retryCountsRef = useRef({})
  const activeSubstepRef = useRef(substepId)
  const timerIdsRef = useRef([])

  const clearTimers = useCallback(() => {
    for (const id of timerIdsRef.current) clearTimeout(id)
    timerIdsRef.current = []
  }, [])

  // Start (or restart) the run whenever the substep or items change
  useEffect(() => {
    activeSubstepRef.current = substepId
    clearTimers()
    retryCountsRef.current = {}

    if (!items || items.length === 0) return

    // Set everything to pending immediately
    setStatuses(() => {
      const m = new Map()
      for (const item of items) m.set(item.id, { status: 'pending' })
      return m
    })

    // Run System Checks validations synchronously (fast), probes with delay
    if (isSystemChecks) {
      const validationResults = runValidations(items, ctx)

      items.forEach((item, index) => {
        const delay = staggerDelay(index)

        // Mark running immediately after a tiny stagger
        const runId = setTimeout(() => {
          if (activeSubstepRef.current !== substepId) return
          setStatuses((prev) => {
            const next = new Map(prev)
            next.set(item.id, { status: 'running' })
            return next
          })
        }, delay * 0.3)
        timerIdsRef.current.push(runId)

        const resolveId = setTimeout(() => {
          if (activeSubstepRef.current !== substepId) return
          setStatuses((prev) => {
            const next = new Map(prev)

            if (item.kind === 'validation') {
              const result = validationResults[item.id]
              if (!result || result.ok) {
                next.set(item.id, { status: 'success' })
              } else if (item.warningOnly) {
                next.set(item.id, {
                  status: 'warning',
                  affectedEmployees: result.affectedEmployees,
                  error: `${result.affectedEmployees.length} employee${result.affectedEmployees.length === 1 ? '' : 's'} flagged — you can still continue.`,
                })
              } else {
                next.set(item.id, {
                  status: 'failure',
                  affectedEmployees: result.affectedEmployees,
                  error: `${result.affectedEmployees.length} employee${result.affectedEmployees.length === 1 ? '' : 's'} failed this check.`,
                })
              }
            } else {
              // probe items — mostly pass, ~10% fail for payrollLock, ~5% for idpHealth
              const failRate = item.id === 'check.payrollLock' ? 10 : item.id === 'check.idpHealth' ? 5 : 0
              let hash = 0
              for (let i = 0; i < item.id.length; i++) hash = (hash * 31 + item.id.charCodeAt(i)) | 0
              const fails = Math.abs(hash) % 100 < failRate
              if (fails) {
                next.set(item.id, {
                  status: 'failure',
                  error: pickError(item, 0),
                })
              } else {
                next.set(item.id, { status: 'success' })
              }
            }
            return next
          })
        }, delay)
        timerIdsRef.current.push(resolveId)
      })
    } else {
      // Write / comm items — simulate with deterministic failure
      items.forEach((item, index) => {
        const delay = staggerDelay(index)

        const runId = setTimeout(() => {
          if (activeSubstepRef.current !== substepId) return
          setStatuses((prev) => {
            const next = new Map(prev)
            next.set(item.id, { status: 'running' })
            return next
          })
        }, delay * 0.3)
        timerIdsRef.current.push(runId)

        const resolveId = setTimeout(() => {
          if (activeSubstepRef.current !== substepId) return
          setStatuses((prev) => {
            const next = new Map(prev)
            const fails = shouldFail(item.id, retryCountsRef.current[item.id] ?? 0)
            if (fails) {
              next.set(item.id, { status: 'failure', error: pickError(item, 0) })
            } else {
              next.set(item.id, { status: 'success' })
            }
            return next
          })
        }, delay)
        timerIdsRef.current.push(resolveId)
      })
    }

    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [substepId, isSystemChecks])

  const rerun = useCallback((itemId) => {
    const item = items?.find((i) => i.id === itemId)
    if (!item) return

    retryCountsRef.current[itemId] = (retryCountsRef.current[itemId] ?? 0) + 1
    const retryCount = retryCountsRef.current[itemId]

    setStatuses((prev) => {
      const next = new Map(prev)
      next.set(itemId, { status: 'running' })
      return next
    })

    const delay = 800 + Math.random() * 600
    const id = setTimeout(() => {
      setStatuses((prev) => {
        const next = new Map(prev)
        const fails = isSystemChecks
          ? false // probe re-runs always succeed
          : shouldFail(itemId, retryCount)
        if (fails) {
          next.set(itemId, { status: 'failure', error: pickError(item, retryCount) })
        } else {
          next.set(itemId, { status: 'success' })
        }
        return next
      })
    }, delay)
    timerIdsRef.current.push(id)
  }, [items, isSystemChecks])

  const runningCount = [...statuses.values()].filter((s) => s.status === 'running' || s.status === 'pending').length
  const failureCount = [...statuses.values()].filter((s) => s.status === 'failure').length
  const warningCount = [...statuses.values()].filter((s) => s.status === 'warning').length
  // Warnings do not block — only hard failures prevent Continue
  const allDone = statuses.size > 0 && runningCount === 0 && failureCount === 0

  return { statuses, rerun, allDone, runningCount, failureCount, warningCount }
}
