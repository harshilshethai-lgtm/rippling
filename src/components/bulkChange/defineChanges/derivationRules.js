import { FIELDS_BY_KEY } from './fieldSchema'

/**
 * Admin-configured rules: which observers, approvers, and process steps
 * are automatically injected when a given derivation key is included in
 * the change. Field keys map onto these derivation keys via
 * fieldSchema.js (each field carries an optional `derivationRuleKey`).
 *
 * In production these would be pulled from the Rippling Approvals/Workflow
 * config. For the prototype they are hard-coded.
 */
export const DERIVATION_RULES = {
  compensation: {
    observers: [
      { id: 'auto-obs-cfo', name: 'Rachel Kim', role: 'CFO' },
      { id: 'auto-obs-chro', name: 'Emily Walker', role: 'CHRO' },
    ],
    approvers: [
      { id: 'auto-apr-vp-payroll', name: 'Noah Thompson', role: 'VP of Payroll' },
    ],
    steps: [
      {
        id: 'payroll-run',
        label: 'Payroll run',
        kind: 'system',
        children: [
          { id: 'payroll-recalc', label: 'Recalculate affected paychecks', kind: 'system' },
          { id: 'payroll-lock', label: 'Check payroll lock date', kind: 'validation' },
          { id: 'payroll-notify', label: 'Notify payroll administrator', kind: 'notification' },
        ],
      },
      {
        id: 'comp-letter',
        label: 'Send compensation change letter',
        kind: 'document',
        children: [],
      },
      {
        id: 'equity-review',
        label: 'Equity refresh eligibility check',
        kind: 'validation',
        children: [],
      },
    ],
  },

  manager: {
    observers: [
      { id: 'auto-obs-hrbp', name: 'Celeste Stephens', role: 'HR Business Partner' },
    ],
    approvers: [
      { id: 'auto-apr-vp-people', name: 'Sarah Johnson', role: 'VP of People' },
    ],
    steps: [
      {
        id: 'manager-reassign',
        label: 'Reassign direct reports',
        kind: 'system',
        children: [
          { id: 'manager-notify-old', label: 'Notify previous manager', kind: 'notification' },
          { id: 'manager-notify-new', label: 'Notify new manager', kind: 'notification' },
        ],
      },
      {
        id: 'org-chart-update',
        label: 'Update org chart',
        kind: 'system',
        children: [],
      },
    ],
  },

  department: {
    observers: [
      { id: 'auto-obs-fin', name: 'Rachel Kim', role: 'Finance Partner' },
    ],
    approvers: [
      { id: 'auto-apr-vp-people', name: 'Sarah Johnson', role: 'VP of People' },
    ],
    steps: [
      {
        id: 'dept-budget',
        label: 'Update headcount budget allocation',
        kind: 'system',
        children: [],
      },
      {
        id: 'dept-apps',
        label: 'Adjust app provisioning groups',
        kind: 'system',
        children: [
          { id: 'dept-slack', label: 'Update Slack channels', kind: 'integration' },
          { id: 'dept-google', label: 'Update Google Groups', kind: 'integration' },
        ],
      },
    ],
  },

  employmentType: {
    observers: [
      { id: 'auto-obs-legal', name: 'Aditi Brown', role: 'General Counsel' },
      { id: 'auto-obs-cfo', name: 'Rachel Kim', role: 'CFO' },
    ],
    approvers: [
      { id: 'auto-apr-vp-people', name: 'Sarah Johnson', role: 'VP of People' },
      { id: 'auto-apr-vp-payroll', name: 'Noah Thompson', role: 'VP of Payroll' },
    ],
    steps: [
      {
        id: 'emptype-insurance',
        label: 'Insurance eligibility change',
        kind: 'system',
        children: [
          { id: 'emptype-benefits', label: 'Recalculate benefits enrollment', kind: 'system' },
          { id: 'emptype-cobra', label: 'Evaluate COBRA eligibility', kind: 'validation' },
        ],
      },
      {
        id: 'emptype-payroll',
        label: 'Payroll classification update',
        kind: 'system',
        children: [],
      },
      {
        id: 'emptype-docs',
        label: 'Send new employment agreement',
        kind: 'document',
        children: [],
      },
    ],
  },

  workLocation: {
    observers: [
      { id: 'auto-obs-it', name: 'Diego Reyes', role: 'IT Partner' },
    ],
    approvers: [],
    steps: [
      {
        id: 'location-tax',
        label: 'Update state/local tax withholding',
        kind: 'system',
        children: [],
      },
      {
        id: 'location-devices',
        label: 'Verify device compliance for new region',
        kind: 'validation',
        children: [],
      },
    ],
  },

  legalEntity: {
    observers: [
      { id: 'auto-obs-legal', name: 'Aditi Brown', role: 'General Counsel' },
      { id: 'auto-obs-cfo', name: 'Rachel Kim', role: 'CFO' },
    ],
    approvers: [
      { id: 'auto-apr-vp-people', name: 'Sarah Johnson', role: 'VP of People' },
    ],
    steps: [
      {
        id: 'entity-payroll',
        label: 'Transfer payroll entity',
        kind: 'system',
        children: [],
      },
      {
        id: 'entity-benefits',
        label: 'Re-enroll in entity benefits plan',
        kind: 'system',
        children: [],
      },
    ],
  },

  appAccess: {
    observers: [],
    approvers: [
      { id: 'auto-apr-it', name: 'Diego Reyes', role: 'IT Director' },
    ],
    steps: [
      {
        id: 'apps-provision',
        label: 'Third-party app access update',
        kind: 'integration',
        children: [
          { id: 'apps-google', label: 'Google Workspace', kind: 'integration' },
          { id: 'apps-slack', label: 'Slack', kind: 'integration' },
          { id: 'apps-github', label: 'GitHub', kind: 'integration' },
        ],
      },
    ],
  },

  devices: {
    observers: [],
    approvers: [
      { id: 'auto-apr-it', name: 'Diego Reyes', role: 'IT Director' },
    ],
    steps: [
      {
        id: 'devices-mdm',
        label: 'Update MDM device assignment',
        kind: 'system',
        children: [],
      },
    ],
  },

  visaStatus: {
    observers: [
      { id: 'auto-obs-legal', name: 'Aditi Brown', role: 'General Counsel' },
    ],
    approvers: [],
    steps: [
      {
        id: 'visa-docs',
        label: 'Request updated visa documentation',
        kind: 'document',
        children: [],
      },
    ],
  },
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns the union of all auto-derived observers and approvers for the given
 * *field keys* (not rule keys). Each returned person carries a `sources` array
 * of the field keys that triggered their inclusion — used to render
 * "via {Field Label}" chips in the sidebar.
 *
 * Deduped by person id; sources are accumulated across multiple fields.
 */
export function getDerivedPeople(fieldKeys) {
  const observerMap = new Map()
  const approverMap = new Map()

  for (const fieldKey of fieldKeys) {
    const fieldMeta = FIELDS_BY_KEY.get(fieldKey)
    if (!fieldMeta?.derivationRuleKey) continue
    const rule = DERIVATION_RULES[fieldMeta.derivationRuleKey]
    if (!rule) continue

    for (const person of rule.observers ?? []) {
      if (!observerMap.has(person.id)) {
        observerMap.set(person.id, { ...person, sources: [] })
      }
      observerMap.get(person.id).sources.push(fieldKey)
    }
    for (const person of rule.approvers ?? []) {
      if (!approverMap.has(person.id)) {
        approverMap.set(person.id, { ...person, sources: [] })
      }
      approverMap.get(person.id).sources.push(fieldKey)
    }
  }

  return {
    observers: [...observerMap.values()],
    approvers: [...approverMap.values()],
  }
}

/**
 * Returns the union of all auto-derived process steps for the given *field
 * keys*. Steps are deduped by id; children are merged recursively.
 */
export function getDerivedSteps(fieldKeys) {
  const stepMap = new Map()

  for (const fieldKey of fieldKeys) {
    const fieldMeta = FIELDS_BY_KEY.get(fieldKey)
    if (!fieldMeta?.derivationRuleKey) continue
    const rule = DERIVATION_RULES[fieldMeta.derivationRuleKey]
    if (!rule) continue
    for (const step of rule.steps ?? []) {
      if (!stepMap.has(step.id)) {
        stepMap.set(step.id, { ...step, children: [...(step.children ?? [])] })
      }
    }
  }

  return [...stepMap.values()]
}
