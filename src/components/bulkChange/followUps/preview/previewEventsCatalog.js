/**
 * Preview page — event source catalog.
 *
 * Each EventSource has:
 *   id               — stable identifier
 *   tier             — 'critical' | 'high' | 'medium' | 'routine'
 *   axis             — display category label
 *   systemPill       — the system(s) label in the meta row
 *   title            — headline copy
 *   sublabel         — one-line supporting copy
 *   whatHappens      — explanation of consequence (shown in expanded card)
 *   contextFields    — array of { label, value } pairs for the 2×2 grid
 *   ownsResolution   — { kind: 'integration', key } | { kind: 'department', id } | { kind: 'comms' }
 *   requiresApproval — whether this event must have an approver before Continue
 *   evaluate(ctx)    — returns { triggered: bool, count: number, sampleEmployees: [{id, name, reason}] }
 *                      ctx = { employees, selectedFieldKeys, bulkValues, cellOverrides, uniformByField }
 *
 * Order within the array determines render order within each tier.
 */

import { parseCompValue, isScheduledElsewhere, detectCycle } from '../../defineChanges/validation'
import { EMPLOYEES } from '../../../../data/employees'

const ALL_EMPLOYEES_BY_ID = new Map(EMPLOYEES.map((e) => [e.id, e]))

/**
 * Role-based auto-approver personas.
 * Synthetic stable IDs so deduplication works when multiple events share an approver.
 * These are added to the approvers list automatically when the owning event fires.
 */
export const AUTO_APPROVERS = {
  peopleLead:      { id: 'auto.people-lead',      name: 'People Ops Lead',    role: 'VP, People' },
  totalRewards:    { id: 'auto.total-rewards',     name: 'Total Rewards Lead', role: 'Director, Total Rewards' },
  financeVp:       { id: 'auto.finance-vp',        name: 'Finance VP',         role: 'VP, Finance' },
  payrollLead:     { id: 'auto.payroll-lead',      name: 'Payroll Lead',       role: 'Director, Payroll' },
  legalCounsel:    { id: 'auto.legal-counsel',     name: 'Legal Counsel',      role: 'Associate General Counsel' },
  globalMobility:  { id: 'auto.global-mobility',   name: 'Global Mobility',    role: 'Global Mobility Lead' },
  peoplePartner:   { id: 'auto.people-partner',    name: 'People Partner',     role: 'Sr. People Business Partner' },
  itSecurityLead:  { id: 'auto.it-security',       name: 'IT Security Lead',   role: 'Director, IT Security' },
  complianceLead:  { id: 'auto.compliance-lead',   name: 'Compliance Lead',    role: 'Director, Compliance' },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve the effective value for (emp, fieldKey) from wizard state. */
function resolveValue(emp, fieldKey, { bulkValues, cellOverrides, uniformByField }) {
  const mode = uniformByField?.[fieldKey] ?? 'uniform'
  const bulk = bulkValues?.[fieldKey]
  const hasBulk = bulk !== undefined && bulk !== ''
  const override = cellOverrides?.[emp.id]?.[fieldKey]
  const hasOverride = override !== undefined && override !== ''
  if (mode === 'unique') return hasOverride ? override : hasBulk ? bulk : ''
  return hasBulk ? bulk : ''
}

/** True if any employee in the cohort has a given location attribute. */
function cohortIncludesCountry(employees, country) {
  return employees.some((e) => {
    const loc = (e.location ?? e.workLocation ?? '').toLowerCase()
    return loc.includes(country.toLowerCase())
  })
}

/** True if we're crossing country borders (moving employees to/from India). */
function hasIndiaRelocation(employees, selectedFieldKeys, state) {
  if (!selectedFieldKeys.some((k) => ['legalEntity', 'workLocation', 'jobsWorkLocation', 'state', 'location'].includes(k))) return false
  return cohortIncludesCountry(employees, 'india') ||
    cohortIncludesCountry(employees, 'bangalore') ||
    cohortIncludesCountry(employees, 'bengaluru') ||
    cohortIncludesCountry(employees, 'mumbai') ||
    cohortIncludesCountry(employees, 'delhi')
}

/** Deterministic hash for stable randomness per-employee. */
function stableHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function hashPct(empId, salt) {
  return stableHash(empId + '|' + salt) % 100
}

/** Returns subset of employees where deterministic "flag" fires at given rate. */
function deterministicSubset(employees, salt, pct) {
  return employees.filter((e) => hashPct(e.id, salt) < pct)
}

/** Filter employees whose department matches (case-insensitive). */
function inDept(employees, dept) {
  return employees.filter((e) => e.department?.toLowerCase().includes(dept.toLowerCase()))
}

// ── Event sources ─────────────────────────────────────────────────────────────

export const PREVIEW_EVENT_SOURCES = [

  // ─────────────────────────── CRITICAL ─────────────────────────────────────

  {
    id: 'event.cyclicManager',
    tier: 'critical',
    axis: 'HR',
    systemPill: 'Rippling HRIS',
    title: 'Cyclic manager dependency detected',
    sublabel: 'One or more employees would end up reporting to themselves.',
    whatHappens: 'Submit is blocked. Fix the manager chain for the affected employees before applying.',
    contextFields: [],
    ownsResolution: { kind: 'department', id: 'hr' },
    requiresApproval: true,
    autoApprovers: [AUTO_APPROVERS.peopleLead],
    evaluate({ employees, selectedFieldKeys, bulkValues, cellOverrides, uniformByField }) {
      if (!selectedFieldKeys.includes('manager') && !selectedFieldKeys.includes('jobsManager')) {
        return { triggered: false, count: 0, sampleEmployees: [] }
      }
      const proposedManagerMap = new Map()
      const EMPLOYEE_BY_NAME = new Map(EMPLOYEES.map((e) => [e.fullName, e]))
      for (const emp of employees) {
        const resolved = resolveValue(emp, 'manager', { bulkValues, cellOverrides, uniformByField })
        if (resolved) {
          const newMgr = EMPLOYEE_BY_NAME.get(resolved)
          proposedManagerMap.set(emp.id, newMgr?.id ?? null)
        }
      }
      const affected = employees.filter((emp) =>
        proposedManagerMap.has(emp.id) && detectCycle(emp.id, proposedManagerMap)
      ).map((emp) => ({ id: emp.id, name: emp.fullName, reason: 'Would report to themselves' }))
      return { triggered: affected.length > 0, count: affected.length, sampleEmployees: affected }
    },
  },

  {
    id: 'event.compHardGuardrail',
    tier: 'critical',
    axis: 'Compensation',
    systemPill: 'Rippling Comp',
    title: 'Compensation increase exceeds 20% policy limit',
    sublabel: 'One or more employees exceed the maximum single-cycle increase.',
    whatHappens: 'Submit is blocked until the flagged increases are reduced below the 20% policy threshold or an exception is filed.',
    contextFields: [
      { label: 'Policy limit', value: '20% per cycle' },
      { label: 'Escalation path', value: 'Finance → Total Rewards' },
    ],
    ownsResolution: { kind: 'department', id: 'finance' },
    requiresApproval: true,
    autoApprovers: [AUTO_APPROVERS.totalRewards, AUTO_APPROVERS.financeVp],
    evaluate({ employees, selectedFieldKeys, bulkValues, cellOverrides, uniformByField }) {
      if (!selectedFieldKeys.some((k) => ['baseCompensation', 'basePay', 'annualSalary', 'hourlyRate'].includes(k))) {
        return { triggered: false, count: 0, sampleEmployees: [] }
      }
      const compKey = selectedFieldKeys.find((k) => ['baseCompensation', 'basePay', 'annualSalary', 'hourlyRate'].includes(k))
      const affected = []
      for (const emp of employees) {
        const resolved = resolveValue(emp, compKey, { bulkValues, cellOverrides, uniformByField })
        if (!resolved) continue
        const current = parseCompValue(emp.salary ?? emp.basePay ?? emp.compensation ?? '')
        const next = parseCompValue(resolved)
        if (current > 0 && next > 0 && (next - current) / current > 0.2) {
          const pct = Math.round(((next - current) / current) * 100)
          affected.push({ id: emp.id, name: emp.fullName, reason: `+${pct}% increase` })
        }
      }
      return { triggered: affected.length > 0, count: affected.length, sampleEmployees: affected }
    },
  },

  {
    id: 'event.adpIndiaConfig',
    tier: 'critical',
    axis: 'Payroll',
    systemPill: 'ADP Workforce Now',
    title: 'ADP has no India payroll configuration',
    sublabel: 'Bangalore employees cannot be processed through ADP.',
    whatHappens: 'Submit is blocked until ADP India is configured or these employees are removed from the cohort.',
    contextFields: [
      { label: 'Missing config', value: 'India (IN) — Karnataka' },
      { label: 'Next payroll at risk', value: 'Aug 15, 2026' },
      { label: 'ADP error', value: 'ERR_COUNTRY_UNSUPPORTED' },
    ],
    ownsResolution: { kind: 'integration', key: 'adp' },
    requiresApproval: true,
    autoApprovers: [AUTO_APPROVERS.payrollLead],
    evaluate({ employees, selectedFieldKeys }) {
      const payFields = ['baseCompensation', 'basePay', 'annualSalary', 'hourlyRate', 'bonus', 'employmentType', 'startDate']
      if (!selectedFieldKeys.some((k) => payFields.includes(k))) return { triggered: false, count: 0, sampleEmployees: [] }
      const indiaEmps = employees.filter((e) => {
        const loc = (e.location ?? e.workLocation ?? e.office ?? '').toLowerCase()
        return loc.includes('india') || loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('mumbai')
      })
      if (indiaEmps.length === 0) return { triggered: false, count: 0, sampleEmployees: [] }
      const sample = indiaEmps.slice(0, 5).map((e) => ({ id: e.id, name: e.fullName, reason: 'India-based employee' }))
      return {
        triggered: true,
        count: indiaEmps.length,
        sampleEmployees: sample,
        contextFields: [
          { label: 'Missing config', value: 'India (IN) — Karnataka' },
          { label: 'Next payroll at risk', value: 'Aug 15, 2026' },
          { label: 'Estimated impact', value: `$${(indiaEmps.length * 27500).toLocaleString()} payroll` },
          { label: 'ADP error', value: 'ERR_COUNTRY_UNSUPPORTED' },
        ],
      }
    },
  },

  {
    id: 'event.payrollLockWindow',
    tier: 'critical',
    axis: 'Payroll',
    systemPill: 'Rippling Payroll',
    title: 'Payroll lock window active',
    sublabel: 'A payroll run is currently locked for reconciliation.',
    whatHappens: 'Submit is blocked. Retry after the lock lifts (typically within 2 hours).',
    contextFields: [
      { label: 'Lock reason', value: 'Reconciliation in progress' },
      { label: 'Estimated unlock', value: '~2 hours' },
    ],
    ownsResolution: { kind: 'department', id: 'payroll' },
    requiresApproval: true,
    autoApprovers: [AUTO_APPROVERS.payrollLead],
    evaluate({ employees, selectedFieldKeys }) {
      const payFields = ['baseCompensation', 'basePay', 'annualSalary', 'hourlyRate', 'bonus']
      if (!selectedFieldKeys.some((k) => payFields.includes(k))) return { triggered: false, count: 0, sampleEmployees: [] }
      // ~8% probability based on stable hash of cohort size
      const triggered = stableHash('payrollLock|' + employees.length) % 100 < 8
      return { triggered, count: triggered ? employees.length : 0, sampleEmployees: [] }
    },
  },

  // ─────────────────────────── HIGH ─────────────────────────────────────────

  {
    id: 'event.aboveBandCompExposure',
    tier: 'high',
    axis: 'Access',
    systemPill: 'Rippling HRIS',
    title: 'Above-band comp exposed to unauthorized managers',
    sublabel: 'Manager changes will grant comp visibility to managers without L3 auth.',
    whatHappens: 'After submission, affected managers will be able to see compensation data they are not authorized to view. Remove them from the cohort or request L3 access before submitting.',
    contextFields: [
      { label: 'Access risk', value: 'Comp visibility' },
      { label: 'Auth level required', value: 'L3' },
    ],
    ownsResolution: { kind: 'department', id: 'hr' },
    requiresApproval: true,
    autoApprovers: [AUTO_APPROVERS.peoplePartner, AUTO_APPROVERS.legalCounsel],
    evaluate({ employees, selectedFieldKeys }) {
      if (!selectedFieldKeys.includes('manager') && !selectedFieldKeys.includes('jobsManager')) {
        return { triggered: false, count: 0, sampleEmployees: [] }
      }
      const compFields = ['baseCompensation', 'basePay', 'annualSalary']
      if (!selectedFieldKeys.some((k) => compFields.includes(k)) && employees.length < 20) {
        return { triggered: false, count: 0, sampleEmployees: [] }
      }
      const affected = deterministicSubset(employees, 'aboveBandExp', 26)
      if (affected.length === 0) return { triggered: false, count: 0, sampleEmployees: [] }
      const unauthorizedCount = Math.max(1, Math.round(affected.length * 0.26))
      return {
        triggered: true,
        count: affected.length,
        sampleEmployees: affected.slice(0, 5).map((e) => ({ id: e.id, name: e.fullName, reason: 'New manager lacks L3 auth' })),
        contextFields: [
          { label: 'Unauthorized managers', value: String(unauthorizedCount) },
          { label: 'Auth level required', value: 'L3' },
        ],
      }
    },
  },

  {
    id: 'event.compVelocityAnomaly',
    tier: 'high',
    axis: 'Compensation',
    systemPill: 'Rippling Comp',
    title: 'Velocity anomaly: raises above 25% in one cycle',
    sublabel: 'Comp changes exceed the 25% single-cycle threshold flagged by your comp policy.',
    whatHappens: 'These employees will receive a raise above your velocity policy. You can proceed, but Total Rewards must approve before the effective date.',
    contextFields: [
      { label: 'Policy threshold', value: '25% per cycle' },
      { label: 'Approver required', value: 'Total Rewards' },
    ],
    ownsResolution: { kind: 'department', id: 'finance' },
    requiresApproval: true,
    autoApprovers: [AUTO_APPROVERS.totalRewards],
    evaluate({ employees, selectedFieldKeys, bulkValues, cellOverrides, uniformByField }) {
      const compKey = selectedFieldKeys.find((k) => ['baseCompensation', 'basePay', 'annualSalary', 'hourlyRate'].includes(k))
      if (!compKey) return { triggered: false, count: 0, sampleEmployees: [] }
      const affected = []
      for (const emp of employees) {
        const resolved = resolveValue(emp, compKey, { bulkValues, cellOverrides, uniformByField })
        if (!resolved) continue
        const current = parseCompValue(emp.salary ?? emp.basePay ?? emp.compensation ?? '')
        const next = parseCompValue(resolved)
        if (current > 0 && next > 0 && (next - current) / current > 0.25) {
          const pct = Math.round(((next - current) / current) * 100)
          affected.push({ id: emp.id, name: emp.fullName, reason: `+${pct}% increase` })
        }
      }
      return { triggered: affected.length > 0, count: affected.length, sampleEmployees: affected.slice(0, 5) }
    },
  },

  {
    id: 'event.crossBorderTaxReview',
    tier: 'high',
    axis: 'Compliance',
    systemPill: 'Deel, NetSuite',
    title: 'Cross-border moves require visa & tax review',
    sublabel: 'Relocations trigger tax-residency, social-security, and immigration checks.',
    whatHappens: 'Each cross-border employee must pass a Global Mobility review before their new entity is activated.',
    contextFields: [
      { label: 'Review type', value: 'Tax residency + immigration' },
      { label: 'SLA', value: '5 business days' },
    ],
    ownsResolution: { kind: 'department', id: 'global' },
    requiresApproval: true,
    autoApprovers: [AUTO_APPROVERS.legalCounsel, AUTO_APPROVERS.globalMobility],
    evaluate({ employees, selectedFieldKeys }) {
      if (!selectedFieldKeys.some((k) => ['legalEntity', 'workLocation', 'jobsWorkLocation', 'state'].includes(k))) {
        return { triggered: false, count: 0, sampleEmployees: [] }
      }
      const indiaEmps = employees.filter((e) => {
        const loc = (e.location ?? e.workLocation ?? e.office ?? '').toLowerCase()
        return loc.includes('india') || loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('london') || loc.includes('singapore')
      })
      if (indiaEmps.length === 0) {
        const crossBorder = deterministicSubset(employees, 'crossBorderTax', 12)
        if (crossBorder.length === 0) return { triggered: false, count: 0, sampleEmployees: [] }
        return {
          triggered: true,
          count: crossBorder.length,
          sampleEmployees: crossBorder.slice(0, 5).map((e) => ({ id: e.id, name: e.fullName, reason: 'Cross-jurisdiction relocation' })),
        }
      }
      return {
        triggered: true,
        count: indiaEmps.length,
        sampleEmployees: indiaEmps.slice(0, 5).map((e) => ({ id: e.id, name: e.fullName, reason: 'Cross-border relocation' })),
        contextFields: [
          { label: 'Destination country', value: 'India (IN)' },
          { label: 'Review type', value: 'Tax residency + immigration' },
          { label: 'SLA', value: '5 business days' },
        ],
      }
    },
  },

  {
    id: 'event.compThresholdReview',
    tier: 'high',
    axis: 'Compensation',
    systemPill: 'Rippling Comp',
    title: 'Compensation increases between 10–20% flagged for review',
    sublabel: 'Increases are above the 10% threshold but within policy limits.',
    whatHappens: 'These increases can proceed, but require a People Partner review on record.',
    contextFields: [
      { label: 'Flag range', value: '10%–20% increase' },
      { label: 'Required action', value: 'People Partner sign-off' },
    ],
    ownsResolution: { kind: 'department', id: 'hr' },
    requiresApproval: true,
    autoApprovers: [AUTO_APPROVERS.peoplePartner],
    evaluate({ employees, selectedFieldKeys, bulkValues, cellOverrides, uniformByField }) {
      const compKey = selectedFieldKeys.find((k) => ['baseCompensation', 'basePay', 'annualSalary'].includes(k))
      if (!compKey) return { triggered: false, count: 0, sampleEmployees: [] }
      const affected = []
      for (const emp of employees) {
        const resolved = resolveValue(emp, compKey, { bulkValues, cellOverrides, uniformByField })
        if (!resolved) continue
        const current = parseCompValue(emp.salary ?? emp.basePay ?? emp.compensation ?? '')
        const next = parseCompValue(resolved)
        if (current > 0 && next > 0) {
          const pct = (next - current) / current
          if (pct > 0.1 && pct <= 0.2) {
            affected.push({ id: emp.id, name: emp.fullName, reason: `+${Math.round(pct * 100)}% increase` })
          }
        }
      }
      return { triggered: affected.length > 0, count: affected.length, sampleEmployees: affected.slice(0, 5) }
    },
  },

  // ─────────────────────────── MEDIUM ──────────────────────────────────────

  {
    id: 'event.oktaGroupDrift',
    tier: 'medium',
    axis: 'Access',
    systemPill: 'Okta',
    title: 'Okta group drift: conflicting assignments',
    sublabel: 'Okta group reassignments cannot be auto-resolved.',
    whatHappens: 'These employees will be placed in conflicting Okta groups after the change. IT must manually reconcile before access takes effect.',
    contextFields: [
      { label: 'Conflict type', value: 'Group membership overlap' },
      { label: 'Resolution owner', value: 'IT / Identity team' },
    ],
    ownsResolution: { kind: 'integration', key: 'okta' },
    requiresApproval: false,
    evaluate({ employees, selectedFieldKeys }) {
      if (!selectedFieldKeys.some((k) => ['apps', 'manager', 'level', 'department', 'teams', 'workEmailAccess', 'authentication'].includes(k))) {
        return { triggered: false, count: 0, sampleEmployees: [] }
      }
      const affected = deterministicSubset(employees, 'oktaDrift', 22)
      if (affected.length === 0) return { triggered: false, count: 0, sampleEmployees: [] }
      const conflicts = Math.max(1, Math.round(affected.length * 0.02))
      return {
        triggered: true,
        count: affected.length,
        sampleEmployees: affected.slice(0, 5).map((e) => ({ id: e.id, name: e.fullName, reason: 'Group assignment conflict' })),
        contextFields: [
          { label: 'Total reassignments', value: String(affected.length) },
          { label: 'Cannot auto-resolve', value: String(conflicts) },
        ],
      }
    },
  },

  {
    id: 'event.cohortVelocityIc',
    tier: 'medium',
    axis: 'Compensation',
    systemPill: 'Rippling Comp',
    title: 'Cohort velocity: 14% of Eng IC band > 15% raise',
    sublabel: 'Cohort-relative anomaly. Your historical baseline is ~6%.',
    whatHappens: 'This is above the normal cohort velocity for this band. It may trigger a Total Rewards audit.',
    contextFields: [
      { label: 'Cohort baseline', value: '~6% historical' },
      { label: 'Current cohort', value: '14% with >15% raise' },
    ],
    ownsResolution: { kind: 'department', id: 'finance' },
    requiresApproval: false,
    evaluate({ employees, selectedFieldKeys, bulkValues, cellOverrides, uniformByField }) {
      const compKey = selectedFieldKeys.find((k) => ['baseCompensation', 'basePay', 'annualSalary'].includes(k))
      if (!compKey) return { triggered: false, count: 0, sampleEmployees: [] }
      const engEmps = inDept(employees, 'engineering')
      if (engEmps.length < 10) return { triggered: false, count: 0, sampleEmployees: [] }
      const above15 = engEmps.filter((emp) => {
        const resolved = resolveValue(emp, compKey, { bulkValues, cellOverrides, uniformByField })
        if (!resolved) return false
        const current = parseCompValue(emp.salary ?? emp.basePay ?? emp.compensation ?? '')
        const next = parseCompValue(resolved)
        return current > 0 && next > 0 && (next - current) / current > 0.15
      })
      if (above15.length === 0 || above15.length / engEmps.length < 0.1) {
        return { triggered: false, count: 0, sampleEmployees: [] }
      }
      return {
        triggered: true,
        count: above15.length,
        sampleEmployees: above15.slice(0, 5).map((e) => ({
          id: e.id, name: e.fullName, reason: `Eng IC > 15% raise`,
        })),
        contextFields: [
          { label: 'Affected band', value: 'Engineering IC' },
          { label: 'Historical baseline', value: '~6%' },
          { label: 'Current cohort rate', value: `${Math.round((above15.length / engEmps.length) * 100)}%` },
        ],
      }
    },
  },

  {
    id: 'event.hrbpRosterUpdates',
    tier: 'medium',
    axis: 'Access',
    systemPill: 'Rippling HRIS',
    title: 'HRBP roster changes for affected employees',
    sublabel: 'Employees switch HRBP as manager hierarchy updates.',
    whatHappens: 'HRBP assignments are re-routed automatically. HRBPs should verify their new roster is accurate post-submission.',
    contextFields: [],
    ownsResolution: { kind: 'department', id: 'hr' },
    requiresApproval: false,
    evaluate({ employees, selectedFieldKeys }) {
      if (!selectedFieldKeys.includes('manager') && !selectedFieldKeys.includes('jobsManager')) {
        return { triggered: false, count: 0, sampleEmployees: [] }
      }
      if (employees.length < 20) return { triggered: false, count: 0, sampleEmployees: [] }
      const affected = deterministicSubset(employees, 'hrbpRoster', 80)
      return {
        triggered: affected.length > 0,
        count: affected.length,
        sampleEmployees: affected.slice(0, 5).map((e) => ({ id: e.id, name: e.fullName, reason: 'HRBP reassignment' })),
      }
    },
  },

  {
    id: 'event.indiaPoshTraining',
    tier: 'medium',
    axis: 'Compliance',
    systemPill: 'LMS',
    title: 'India PoSH training required within 30 days',
    sublabel: 'Bangalore employees not yet enrolled.',
    whatHappens: 'Indian regulations require PoSH (Prevention of Sexual Harassment) training within 30 days of joining or relocating to India. These employees are not currently enrolled.',
    contextFields: [
      { label: 'Regulation', value: 'India PoSH Act' },
      { label: 'Deadline', value: '30 days post-effective date' },
    ],
    ownsResolution: { kind: 'department', id: 'compliance' },
    requiresApproval: false,
    evaluate({ employees, selectedFieldKeys }) {
      if (!hasIndiaRelocation(employees, selectedFieldKeys)) return { triggered: false, count: 0, sampleEmployees: [] }
      const indiaEmps = employees.filter((e) => {
        const loc = (e.location ?? e.workLocation ?? e.office ?? '').toLowerCase()
        return loc.includes('india') || loc.includes('bangalore') || loc.includes('bengaluru')
      })
      if (indiaEmps.length === 0) return { triggered: false, count: 0, sampleEmployees: [] }
      const notEnrolled = deterministicSubset(indiaEmps, 'poshTraining', 90)
      return {
        triggered: notEnrolled.length > 0,
        count: notEnrolled.length,
        sampleEmployees: notEnrolled.slice(0, 5).map((e) => ({ id: e.id, name: e.fullName, reason: 'Not enrolled in PoSH training' })),
      }
    },
  },

  {
    id: 'event.cartaLevelRefresh',
    tier: 'medium',
    axis: 'Equity',
    systemPill: 'Carta',
    title: 'Carta level updates for affected employees',
    sublabel: 'Job level changes will trigger Carta refresh grants per policy.',
    whatHappens: 'Carta will automatically create refresh grant events for each employee whose level changes. Finance must review before Carta processes them.',
    contextFields: [
      { label: 'Grant type', value: 'Refresh grant' },
      { label: 'Trigger', value: 'Level change' },
    ],
    ownsResolution: { kind: 'integration', key: 'carta' },
    requiresApproval: false,
    evaluate({ employees, selectedFieldKeys }) {
      if (!selectedFieldKeys.some((k) => ['level', 'jobFamily', 'title'].includes(k))) {
        return { triggered: false, count: 0, sampleEmployees: [] }
      }
      const affected = deterministicSubset(employees, 'cartaLevel', 35)
      return {
        triggered: affected.length > 0,
        count: affected.length,
        sampleEmployees: affected.slice(0, 5).map((e) => ({ id: e.id, name: e.fullName, reason: 'Carta refresh grant triggered' })),
        contextFields: [
          { label: 'Grant type', value: 'Refresh grant' },
          { label: 'Review required', value: 'Finance sign-off' },
          { label: 'Total employees', value: String(affected.length) },
        ],
      }
    },
  },

  {
    id: 'event.workdayHierarchyManual',
    tier: 'medium',
    axis: 'Workday',
    systemPill: 'Workday HCM',
    title: 'Workday hierarchy requires manual validation',
    sublabel: 'Manager tree update — Workday recommends review.',
    whatHappens: 'Large manager-chain updates in Workday may create position conflicts. The Workday admin team recommends a dry-run review before committing.',
    contextFields: [
      { label: 'Validation type', value: 'Position hierarchy' },
      { label: 'Recommended by', value: 'Workday admin' },
    ],
    ownsResolution: { kind: 'integration', key: 'workday' },
    requiresApproval: false,
    evaluate({ employees, selectedFieldKeys }) {
      if (!selectedFieldKeys.includes('manager') && !selectedFieldKeys.includes('jobsManager')) {
        return { triggered: false, count: 0, sampleEmployees: [] }
      }
      if (employees.length < 50) return { triggered: false, count: 0, sampleEmployees: [] }
      return {
        triggered: true,
        count: employees.length,
        sampleEmployees: [],
        contextFields: [
          { label: 'Node updates', value: `${employees.length}-node manager tree` },
          { label: 'Validation type', value: 'Position hierarchy' },
          { label: 'Recommended by', value: 'Workday admin' },
        ],
      }
    },
  },

  {
    id: 'event.indiaBenefitsWindow',
    tier: 'medium',
    axis: 'Compliance',
    systemPill: 'Benefits Admin',
    title: 'India benefits enrollment window opens',
    sublabel: 'Employees need to select India medical/dental plans.',
    whatHappens: 'Moving employees to India triggers a benefits enrollment window. Each employee must select a plan within 30 days or be auto-enrolled in the default plan.',
    contextFields: [
      { label: 'Enrollment window', value: '30 days post-effective' },
      { label: 'Default plan', value: 'National Health Insurance' },
    ],
    ownsResolution: { kind: 'department', id: 'benefits' },
    requiresApproval: false,
    evaluate({ employees, selectedFieldKeys }) {
      if (!hasIndiaRelocation(employees, selectedFieldKeys)) return { triggered: false, count: 0, sampleEmployees: [] }
      const indiaEmps = employees.filter((e) => {
        const loc = (e.location ?? e.workLocation ?? e.office ?? '').toLowerCase()
        return loc.includes('india') || loc.includes('bangalore') || loc.includes('bengaluru')
      })
      return {
        triggered: indiaEmps.length > 0,
        count: indiaEmps.length,
        sampleEmployees: indiaEmps.slice(0, 5).map((e) => ({ id: e.id, name: e.fullName, reason: 'India benefits enrollment required' })),
      }
    },
  },

  {
    id: 'event.managerTierPromotions',
    tier: 'medium',
    axis: 'Access',
    systemPill: 'Rippling HRIS, Okta',
    title: 'Manager-tier promotions: new EMs',
    sublabel: 'ICs promoted to Engineering Manager.',
    whatHappens: 'Employees crossing the IC→Manager boundary gain manager-level access to HRIS, comp visibility, and approval queues. Verify each promotion is intentional.',
    contextFields: [
      { label: 'Access gained', value: 'Manager HRIS permissions' },
      { label: 'Comp visibility', value: 'Enabled for direct reports' },
    ],
    ownsResolution: { kind: 'department', id: 'it' },
    requiresApproval: false,
    evaluate({ employees, selectedFieldKeys }) {
      if (!selectedFieldKeys.some((k) => ['level', 'title', 'jobFamily'].includes(k))) {
        return { triggered: false, count: 0, sampleEmployees: [] }
      }
      const affected = deterministicSubset(employees, 'managerTier', 8)
      if (affected.length === 0) return { triggered: false, count: 0, sampleEmployees: [] }
      return {
        triggered: true,
        count: affected.length,
        sampleEmployees: affected.slice(0, 5).map((e) => ({ id: e.id, name: e.fullName, reason: 'IC → Manager promotion' })),
        contextFields: [
          { label: 'New manager tier', value: String(affected.length) + ' employees' },
          { label: 'Access change', value: 'Manager HRIS + comp visibility' },
        ],
      }
    },
  },

  {
    id: 'event.gdprDataTransfer',
    tier: 'medium',
    axis: 'Compliance',
    systemPill: 'Rippling HRIS',
    title: 'GDPR data transfer: US → IN',
    sublabel: 'Employee records cross GDPR jurisdiction.',
    whatHappens: 'Moving employee data across GDPR jurisdictions requires a data transfer agreement (DTA) on file. Legal must confirm the DTA covers this cohort.',
    contextFields: [
      { label: 'Transfer type', value: 'Cross-jurisdiction' },
      { label: 'Required document', value: 'Data Transfer Agreement (DTA)' },
    ],
    ownsResolution: { kind: 'department', id: 'compliance' },
    requiresApproval: false,
    evaluate({ employees, selectedFieldKeys }) {
      if (!selectedFieldKeys.some((k) => ['legalEntity', 'workLocation', 'jobsWorkLocation'].includes(k))) {
        return { triggered: false, count: 0, sampleEmployees: [] }
      }
      const crossBorder = employees.filter((e) => {
        const loc = (e.location ?? e.workLocation ?? e.office ?? '').toLowerCase()
        return loc.includes('india') || loc.includes('bengaluru') || loc.includes('bangalore')
      })
      if (crossBorder.length === 0) return { triggered: false, count: 0, sampleEmployees: [] }
      return {
        triggered: true,
        count: crossBorder.length,
        sampleEmployees: crossBorder.slice(0, 5).map((e) => ({ id: e.id, name: e.fullName, reason: 'GDPR cross-jurisdiction' })),
      }
    },
  },

  {
    id: 'event.slackChannelSplits',
    tier: 'medium',
    axis: 'Access',
    systemPill: 'Slack',
    title: 'Slack channel splits for affected org',
    sublabel: 'Platform team split into sub-teams. Private channels affected.',
    whatHappens: 'Department restructuring will cause Slack channels to be split or renamed. Private channels may need manual admin action.',
    contextFields: [
      { label: 'Channel type', value: 'Private channels affected' },
      { label: 'Action', value: 'Slack admin review' },
    ],
    ownsResolution: { kind: 'integration', key: 'slack' },
    requiresApproval: false,
    evaluate({ employees, selectedFieldKeys }) {
      if (!selectedFieldKeys.some((k) => ['department', 'departmentPath', 'teams'].includes(k))) {
        return { triggered: false, count: 0, sampleEmployees: [] }
      }
      if (employees.length < 10) return { triggered: false, count: 0, sampleEmployees: [] }
      const privChannels = Math.max(1, Math.round(employees.length / 8))
      return {
        triggered: true,
        count: employees.length,
        sampleEmployees: [],
        contextFields: [
          { label: 'Private channels affected', value: String(privChannels) },
          { label: 'Action required', value: 'Slack admin review' },
        ],
      }
    },
  },

  {
    id: 'event.githubTeamUpdates',
    tier: 'medium',
    axis: 'Access',
    systemPill: 'GitHub',
    title: 'GitHub team membership updates',
    sublabel: 'Engineering team restructuring triggers GitHub team changes.',
    whatHappens: 'GitHub team memberships will be updated to reflect the new org structure. Repo access may change for affected employees.',
    contextFields: [
      { label: 'Risk', value: 'Repo access changes' },
      { label: 'Owner', value: 'Engineering IT' },
    ],
    ownsResolution: { kind: 'integration', key: 'github' },
    requiresApproval: false,
    evaluate({ employees, selectedFieldKeys }) {
      if (!selectedFieldKeys.some((k) => ['apps', 'teams', 'department', 'departmentPath'].includes(k))) {
        return { triggered: false, count: 0, sampleEmployees: [] }
      }
      const engEmps = inDept(employees, 'engineering')
      if (engEmps.length === 0) return { triggered: false, count: 0, sampleEmployees: [] }
      return {
        triggered: true,
        count: engEmps.length,
        sampleEmployees: engEmps.slice(0, 5).map((e) => ({ id: e.id, name: e.fullName, reason: 'Team membership change' })),
      }
    },
  },

  {
    id: 'event.worklistConflict',
    tier: 'medium',
    axis: 'HR',
    systemPill: 'Rippling HRIS',
    title: 'Worklist scheduling conflicts detected',
    sublabel: 'Fields already queued in another active worklist.',
    whatHappens: 'Some fields for these employees are already scheduled in another active worklist. Submitting may create a race condition. Coordinate with the owner of the conflicting worklist.',
    contextFields: [
      { label: 'Risk', value: 'Race condition on commit' },
      { label: 'Action', value: 'Coordinate with other worklist owner' },
    ],
    ownsResolution: { kind: 'department', id: 'hr' },
    requiresApproval: false,
    evaluate({ employees, selectedFieldKeys }) {
      const affected = []
      for (const emp of employees) {
        const conflicts = selectedFieldKeys.filter((k) => isScheduledElsewhere(emp.id, k))
        if (conflicts.length > 0) {
          const label = conflicts[0].replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
          affected.push({ id: emp.id, name: emp.fullName, reason: `"${label}" scheduled elsewhere` })
        }
      }
      return { triggered: affected.length > 0, count: affected.length, sampleEmployees: affected.slice(0, 5) }
    },
  },

  {
    id: 'event.employeeOnLeave',
    tier: 'medium',
    axis: 'HR',
    systemPill: 'Rippling HRIS',
    title: 'Some employees are currently on leave',
    sublabel: 'Changes may not take effect until the employee returns.',
    whatHappens: 'Changes for employees on leave will be queued and applied on their return date. Verify the effective date is set appropriately.',
    contextFields: [
      { label: 'Behavior', value: 'Changes queued until return' },
    ],
    ownsResolution: { kind: 'department', id: 'hr' },
    requiresApproval: false,
    evaluate({ employees }) {
      const affected = employees.filter((e) => stableHash(e.id + '|onLeave') % 5 === 0)
      return {
        triggered: affected.length > 0,
        count: affected.length,
        sampleEmployees: affected.slice(0, 5).map((e) => ({ id: e.id, name: e.fullName, reason: 'Currently on leave' })),
      }
    },
  },

  {
    id: 'event.pendingApprovalConflict',
    tier: 'medium',
    axis: 'HR',
    systemPill: 'Rippling HRIS',
    title: 'Pending approval on the same fields',
    sublabel: 'Another workflow is awaiting approval for one of the selected fields.',
    whatHappens: 'If both workflows are approved, the last one to complete wins. Coordinate with the other approver to avoid unintended overwrites.',
    contextFields: [
      { label: 'Risk', value: 'Last-write-wins on approval' },
    ],
    ownsResolution: { kind: 'department', id: 'hr' },
    requiresApproval: false,
    evaluate({ employees, selectedFieldKeys }) {
      const affected = []
      for (const emp of employees) {
        const pending = selectedFieldKeys.filter((k) => stableHash(emp.id + '|pendingApproval|' + k) % 5 === 0)
        if (pending.length > 0) {
          const label = pending[0].replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
          affected.push({ id: emp.id, name: emp.fullName, reason: `Pending approval for "${label}"` })
        }
      }
      return { triggered: affected.length > 0, count: affected.length, sampleEmployees: affected.slice(0, 5) }
    },
  },

  // ─────────────────────────── ROUTINE ──────────────────────────────────────

  {
    id: 'event.recordIntegrity',
    tier: 'routine',
    axis: 'System',
    systemPill: 'Rippling HRIS',
    title: 'Source-of-truth record integrity',
    sublabel: 'All employee records validated and consistent.',
    whatHappens: 'Auto-handled: records are clean.',
    contextFields: [],
    ownsResolution: { kind: 'department', id: 'hr' },
    requiresApproval: false,
    evaluate({ employees }) {
      return { triggered: employees.length > 0, count: employees.length, sampleEmployees: [] }
    },
  },

  {
    id: 'event.idpHealth',
    tier: 'routine',
    axis: 'System',
    systemPill: 'Okta',
    title: 'Identity provider health check',
    sublabel: 'Okta is accepting provisioning requests.',
    whatHappens: 'Auto-handled: IDP is healthy.',
    contextFields: [],
    ownsResolution: { kind: 'integration', key: 'okta' },
    requiresApproval: false,
    evaluate({ selectedFieldKeys }) {
      const needed = selectedFieldKeys.some((k) => ['apps', 'workEmailAccess', 'authentication', 'twoFactor', 'gsuite'].includes(k))
      return { triggered: needed, count: 0, sampleEmployees: [] }
    },
  },

  {
    id: 'event.recentChange',
    tier: 'routine',
    axis: 'HR',
    systemPill: 'Rippling HRIS',
    title: 'Recent field changes noted',
    sublabel: 'Some fields were updated for affected employees in the last 30 days.',
    whatHappens: 'Auto-handled: noted for audit trail. These employees have had recent changes, which is captured in the change history.',
    contextFields: [],
    ownsResolution: { kind: 'department', id: 'hr' },
    requiresApproval: false,
    evaluate({ employees, selectedFieldKeys }) {
      const affected = employees.filter((e) =>
        selectedFieldKeys.some((k) => stableHash(e.id + '|recentChange|' + k) % 4 === 0)
      )
      return { triggered: affected.length > 0, count: affected.length, sampleEmployees: [] }
    },
  },
]

/**
 * Returns PREVIEW_EVENT_SOURCES filtered to those triggered by selectedFieldKeys.
 * For the catalog itself (during plan build), we just return all sources —
 * the actual evaluate() call happens in usePreviewRunner at runtime.
 */
export function getPreviewEventSources() {
  return PREVIEW_EVENT_SOURCES
}

/**
 * Force-include integration keys referenced by triggered Preview events
 * so every event card's "Details" deep-link has a real destination substep.
 */
export function getRequiredIntegrationKeys(triggeredEventIds) {
  const keys = new Set()
  for (const src of PREVIEW_EVENT_SOURCES) {
    if (!triggeredEventIds.has(src.id)) continue
    if (src.ownsResolution?.kind === 'integration') {
      keys.add(src.ownsResolution.key)
    }
  }
  return [...keys]
}

export const TIER_ORDER = ['critical', 'high', 'medium', 'routine']

export const TIER_META = {
  critical: { label: 'Critical', sublabel: 'Reviewer required', color: 'red', expandedByDefault: true },
  high: { label: 'High', sublabel: 'Reviewer required', color: 'orange', expandedByDefault: true },
  medium: { label: 'Medium', sublabel: 'Review recommended', color: 'amber', expandedByDefault: false },
  routine: { label: 'Routine', sublabel: 'Auto-handled', color: 'gray', expandedByDefault: false },
}
