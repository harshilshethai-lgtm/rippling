import {
  DollarSign,
  Tag,
  UserCog,
  Briefcase,
  MapPin,
  Clock,
  Layers,
  Globe,
  Shield,
  Laptop,
  FileText,
  Users,
  Building2,
} from 'lucide-react'

/**
 * Every field that can be changed in a bulk edit operation.
 * riskTier drives UI cues and downstream step depth.
 */
export const CHANGE_FIELDS = [
  { key: 'compensation', label: 'Compensation', section: 'Compensation', Icon: DollarSign, riskTier: 'high' },
  { key: 'title', label: 'Title', section: 'Role', Icon: Tag, riskTier: 'medium' },
  { key: 'level', label: 'Level', section: 'Role', Icon: Layers, riskTier: 'medium' },
  { key: 'manager', label: 'Manager', section: 'Role', Icon: UserCog, riskTier: 'medium' },
  { key: 'department', label: 'Department', section: 'Role', Icon: Briefcase, riskTier: 'medium' },
  { key: 'workLocation', label: 'Work location', section: 'Role', Icon: MapPin, riskTier: 'medium' },
  { key: 'employmentType', label: 'Employment type', section: 'Job', Icon: Clock, riskTier: 'high' },
  { key: 'legalEntity', label: 'Legal entity', section: 'Job', Icon: Building2, riskTier: 'high' },
  { key: 'visaStatus', label: 'Visa / work authorization', section: 'Personal', Icon: Globe, riskTier: 'high' },
  { key: 'devices', label: 'Device assignment', section: 'IT', Icon: Laptop, riskTier: 'medium' },
  { key: 'appAccess', label: 'App access', section: 'IT', Icon: Shield, riskTier: 'medium' },
  { key: 'team', label: 'Team', section: 'Role', Icon: Users, riskTier: 'low' },
  { key: 'documents', label: 'Required documents', section: 'Documents', Icon: FileText, riskTier: 'low' },
]

/**
 * Admin-configured rules: which observers, approvers, and process steps
 * are automatically injected when a given field is included in the change.
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
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns the union of all auto-derived observers and approvers for the given
 * set of field keys. Deduped by person id so the same person isn't listed twice
 * even if they're in multiple rules.
 */
export function getDerivedPeople(fieldKeys) {
  const observerMap = new Map()
  const approverMap = new Map()

  for (const key of fieldKeys) {
    const rule = DERIVATION_RULES[key]
    if (!rule) continue
    for (const person of rule.observers ?? []) {
      if (!observerMap.has(person.id)) observerMap.set(person.id, person)
    }
    for (const person of rule.approvers ?? []) {
      if (!approverMap.has(person.id)) approverMap.set(person.id, person)
    }
  }

  return {
    observers: [...observerMap.values()],
    approvers: [...approverMap.values()],
  }
}

/**
 * Returns the union of all auto-derived process steps for the given field keys.
 * Steps are deduped by id; children are merged recursively.
 */
export function getDerivedSteps(fieldKeys) {
  const stepMap = new Map()

  for (const key of fieldKeys) {
    const rule = DERIVATION_RULES[key]
    if (!rule) continue
    for (const step of rule.steps ?? []) {
      if (!stepMap.has(step.id)) {
        stepMap.set(step.id, { ...step, children: [...(step.children ?? [])] })
      }
    }
  }

  return [...stepMap.values()]
}
