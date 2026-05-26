import { EMPLOYEES } from '../../../data/employees'
import { getCurrentValue } from './currentValues'

// Stable lookup maps built once at module load
const ALL_EMPLOYEES_BY_ID = new Map(EMPLOYEES.map((e) => [e.id, e]))
const EMPLOYEE_BY_NAME = new Map(EMPLOYEES.map((e) => [e.fullName, e]))

export function parseCompValue(str) {
  if (!str) return 0
  const num = parseFloat(String(str).replace(/[$,\s]/g, ''))
  return isNaN(num) ? 0 : num
}

/**
 * Deterministic simulation of "this field is already scheduled for edit in
 * another worklist". Flags ~20% of (employee, field) combinations.
 */
export function isScheduledElsewhere(empId, fieldKey) {
  const raw = empId + '|' + fieldKey
  let hash = 0
  for (let i = 0; i < raw.length; i++) hash = (hash * 31 + raw.charCodeAt(i)) | 0
  return Math.abs(hash) % 5 === 0
}

/**
 * Walk the manager chain starting from startEmpId. At each step, prefer
 * the proposed (new) manager over the existing one. Returns true if we loop
 * back to startEmpId.
 */
export function detectCycle(startEmpId, proposedManagerMap) {
  const visited = new Set()
  let current = startEmpId

  while (current) {
    if (visited.has(current)) return true
    visited.add(current)

    const proposed = proposedManagerMap.get(current)
    if (proposed !== undefined) {
      current = proposed
    } else {
      current = ALL_EMPLOYEES_BY_ID.get(current)?.managerId ?? null
    }
  }
  return false
}

/**
 * Compute a per-employee validation status + human-readable reasons for every
 * employee in the current worklist slice.
 *
 * Rules (precedence: error > warning > clean > empty):
 *   error   — cyclic manager chain OR base comp increase > 20%
 *   warning — field scheduled in another worklist OR base comp increase > 10%
 *   clean   — at least one genuine change, no errors/warnings
 *   empty   — no cells set for this employee
 *
 * Returns a Map<empId, { status: string, reasons: string[] }>.
 */
export function computeRowStatuses({
  employees,
  selectedFieldKeys,
  bulkValues,
  cellOverrides,
  uniformByField,
}) {
  // Build proposed-manager map for cycle detection
  const proposedManagerMap = new Map()
  const managerFieldKey = 'manager'
  if (selectedFieldKeys.includes(managerFieldKey)) {
    const mode = uniformByField?.[managerFieldKey] ?? 'uniform'
    const bulk = bulkValues?.[managerFieldKey]
    const hasBulk = bulk !== undefined && bulk !== ''
    for (const emp of employees) {
      const override = cellOverrides?.[emp.id]?.[managerFieldKey]
      const hasOverride = override !== undefined && override !== ''
      const resolved = mode === 'unique'
        ? hasOverride ? override : hasBulk ? bulk : ''
        : hasBulk ? bulk : ''
      if (resolved !== '') {
        const newManager = EMPLOYEE_BY_NAME.get(resolved)
        proposedManagerMap.set(emp.id, newManager?.id ?? null)
      }
    }
  }

  const statuses = new Map()

  for (const emp of employees) {
    const errors = []
    const warnings = []
    let hasChange = false

    for (const fieldKey of selectedFieldKeys) {
      const mode = uniformByField?.[fieldKey] ?? 'uniform'
      const bulk = bulkValues?.[fieldKey]
      const hasBulk = bulk !== undefined && bulk !== ''
      const override = cellOverrides?.[emp.id]?.[fieldKey]
      const hasOverride = override !== undefined && override !== ''
      const resolved = mode === 'unique'
        ? hasOverride ? override : hasBulk ? bulk : ''
        : hasBulk ? bulk : ''

      if (resolved === '') continue

      const current = getCurrentValue(emp, fieldKey)
      if (resolved === current) continue

      hasChange = true

      if (fieldKey === 'baseCompensation') {
        const currentNum = parseCompValue(current)
        const newNum = parseCompValue(resolved)
        if (currentNum > 0 && newNum > 0) {
          const pct = (newNum - currentNum) / currentNum
          const pctStr = `+${Math.round(pct * 100)}%`
          if (pct > 0.2) errors.push(`Comp increase of ${pctStr} exceeds 20% limit`)
          else if (pct > 0.1) warnings.push(`Comp increase of ${pctStr} exceeds 10% threshold`)
        }
      }

      if (isScheduledElsewhere(emp.id, fieldKey)) {
        const label = fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
        warnings.push(`"${label}" scheduled in another worklist`)
      }
    }

    if (proposedManagerMap.has(emp.id) && detectCycle(emp.id, proposedManagerMap)) {
      errors.push('Cyclic manager dependency — this employee would report to themselves')
    }

    const status = errors.length > 0
      ? 'error'
      : warnings.length > 0
        ? 'warning'
        : hasChange
          ? 'clean'
          : 'empty'

    statuses.set(emp.id, { status, reasons: [...errors, ...warnings] })
  }

  return statuses
}
