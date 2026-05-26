import { FIELDS_BY_KEY } from '../defineChanges/fieldSchema'
import { DEPARTMENTS_BY_ID } from './departments/DEPARTMENTS'
import { getDepartmentsForFieldKeys } from './departments/fieldDepartmentMap'
import { getPreviewEventSources, getRequiredIntegrationKeys } from './preview/previewEventsCatalog'

/** Fixed items that are always shown in System Checks (kept for reference; replaced by Preview) */
export const SYSTEM_CHECK_ITEMS = [
  // ── Hard blockers ──────────────────────────────────────────────────────
  {
    id: 'check.cyclicManager',
    label: 'Cyclic manager dependency check',
    sublabel: 'Verifies no employee would end up reporting to themselves',
    kind: 'validation',
    ruleTag: 'cyclic',
  },
  {
    id: 'check.compIncrease',
    label: 'Compensation increase guardrail',
    sublabel: 'Flags increases above the 20% policy limit',
    kind: 'validation',
    ruleTag: 'comp',
  },
  {
    id: 'check.payrollLock',
    label: 'Payroll lock window',
    sublabel: 'Confirms no payroll run is currently in a locked period',
    kind: 'probe',
    errorMessages: [
      'The payroll period closes in 2 hours — changes cannot be pushed until the next cycle opens.',
      'A payroll run is currently locked for reconciliation. Retry after the lock lifts.',
    ],
  },
  {
    id: 'check.idpHealth',
    label: 'Identity provider reachable',
    sublabel: 'Checks that Okta is accepting provisioning requests',
    kind: 'probe',
    errorMessages: [
      'Okta returned a 503 during the health probe — provisioning may be degraded. Retry in a moment.',
      'Identity provider handshake timed out. Verify your Okta tenant is healthy before continuing.',
    ],
  },
  {
    id: 'check.recordIntegrity',
    label: 'Source-of-truth record integrity',
    sublabel: 'Validates employee records are consistent before writes',
    kind: 'probe',
    errorMessages: [],
  },

  // ── Warnings (warningOnly: true — do not block Continue) ───────────────
  {
    id: 'check.worklistConflict',
    label: 'Worklist scheduling conflicts',
    sublabel: 'Detects fields already queued in another active worklist',
    kind: 'validation',
    ruleTag: 'conflict',
    warningOnly: true,
  },
  {
    id: 'check.compThreshold',
    label: 'Compensation increase threshold',
    sublabel: 'Flags increases between 10–20% for review',
    kind: 'validation',
    ruleTag: 'compWarning',
    warningOnly: true,
  },
  {
    id: 'check.recentChange',
    label: 'Recent field change detected',
    sublabel: 'One or more fields were updated for this employee in the last 30 days',
    kind: 'validation',
    ruleTag: 'recentChange',
    warningOnly: true,
  },
  {
    id: 'check.employeeOnLeave',
    label: 'Employee currently on leave',
    sublabel: 'Changes may not take effect until the employee returns',
    kind: 'validation',
    ruleTag: 'onLeave',
    warningOnly: true,
  },
  {
    id: 'check.pendingApproval',
    label: 'Pending approval on same field',
    sublabel: 'Another workflow is awaiting approval for one of the selected fields',
    kind: 'validation',
    ruleTag: 'pendingApproval',
    warningOnly: true,
  },
]

/**
 * Communications definitions, each with a `condition` for inclusion.
 *
 * commType: 'email' | 'notification' | 'document'
 * recipients: array of recipient role strings shown as chips
 * channel: default channel
 * send: default send timing
 * signature: null (email/notification) | 'Requires signature' | 'Acknowledgment only' | 'Informational' (document)
 * templateOptions: list of selectable template names for the dropdown
 */
export const COMMUNICATIONS_CONFIGS = [
  {
    id: 'comm.compLetter',
    label: 'Manager comp summary for direct reports',
    sublabel: 'Generated letter sent to each affected employee',
    kind: 'comm',
    commType: 'email',
    recipients: ['New Manager'],
    channel: 'Email',
    send: 'On commit',
    signature: null,
    templateOptions: [
      'Manager comp summary for direct reports',
      'Compensation change summary',
      'Pay adjustment notice',
      'Annual review letter',
    ],
    condition: (fieldKeys) =>
      fieldKeys.some((k) => {
        const f = FIELDS_BY_KEY.get(k)
        return f && (f.sectionId === 'pay' || f.sectionId === 'compensation')
      }),
    errorMessages: [
      'Letter generation failed for 2 employees — template variables could not be resolved. Retry.',
      'Email delivery failed — one or more employee work emails may be invalid. Retry.',
    ],
  },
  {
    id: 'comm.hrbpNotify',
    label: 'HRBP cycle close-out',
    sublabel: 'Summary email to the assigned HRBP',
    kind: 'comm',
    commType: 'email',
    recipients: ['HRBP'],
    channel: 'Email',
    send: 'On commit',
    signature: null,
    templateOptions: [
      'HRBP cycle close-out',
      'HRBP summary notification',
      'HR partner update',
    ],
    condition: () => true,
    errorMessages: [
      'HRBP notification email could not be delivered. Retry.',
      'Email service timed out. Retry in a moment.',
    ],
  },
  {
    id: 'comm.fyLetter',
    label: 'Your FY26 letter is ready',
    sublabel: 'In-product notification to each affected employee',
    kind: 'comm',
    commType: 'notification',
    recipients: ['Employee'],
    channel: 'Rippling inbox',
    send: 'On effective date',
    signature: null,
    templateOptions: [
      'Your FY26 letter is ready',
      'Compensation letter available',
      'New letter in your inbox',
    ],
    condition: (fieldKeys) =>
      fieldKeys.some((k) => {
        const f = FIELDS_BY_KEY.get(k)
        return f && (f.sectionId === 'pay' || f.sectionId === 'compensation')
      }),
    errorMessages: [
      'Notification delivery failed for 1 employee. Retry.',
      'Rippling inbox service timed out. Retry in a moment.',
    ],
  },
  {
    id: 'comm.managerNotify',
    label: 'You have a new direct report',
    sublabel: 'Slack notification to the new manager',
    kind: 'comm',
    commType: 'notification',
    recipients: ['New Manager'],
    channel: 'Slack',
    send: 'On effective date',
    signature: null,
    templateOptions: [
      'You have a new direct report',
      'Team change notification',
      'New report joining your team',
    ],
    condition: (fieldKeys) =>
      fieldKeys.includes('manager') || fieldKeys.includes('jobsManager'),
    errorMessages: [
      'Slack notification failed for 1 recipient. Retry to re-send.',
      'Slack API returned a 503. Retry in a moment.',
    ],
  },
  {
    id: 'comm.totalCompStatement',
    label: 'Total Compensation Statement — FY26',
    sublabel: 'DocuSign envelope requiring employee e-signature',
    kind: 'comm',
    commType: 'document',
    recipients: ['Employee'],
    channel: 'Email',
    send: 'On effective date',
    signature: 'Requires signature',
    templateOptions: [
      'Total Compensation Statement — FY26',
      'Total Compensation Statement — FY25',
      'Total Rewards overview',
    ],
    condition: (fieldKeys) =>
      fieldKeys.some((k) => {
        const f = FIELDS_BY_KEY.get(k)
        return f && (f.sectionId === 'pay' || f.sectionId === 'compensation')
      }),
    errorMessages: [
      'DocuSign envelope creation failed — the template may be missing required fields. Retry.',
      'DocuSign API is temporarily unavailable. Retry in a moment.',
    ],
  },
  {
    id: 'comm.promotionLetter',
    label: 'Promotion letter',
    sublabel: 'Promotion confirmation requiring employee signature',
    kind: 'comm',
    commType: 'document',
    recipients: ['Employee'],
    channel: 'Email',
    send: 'On effective date',
    signature: 'Requires signature',
    templateOptions: [
      'Promotion letter',
      'Level change confirmation',
      'Role promotion acknowledgment',
    ],
    condition: (fieldKeys) =>
      fieldKeys.includes('title') || fieldKeys.includes('level'),
    errorMessages: [
      'DocuSign envelope creation failed — the template may be missing required fields. Retry.',
      'DocuSign API is temporarily unavailable. Retry in a moment.',
    ],
  },
  {
    id: 'comm.compBandAck',
    label: 'Compensation band acknowledgment',
    sublabel: 'Employee acknowledges new compensation band',
    kind: 'comm',
    commType: 'document',
    recipients: ['Employee'],
    channel: 'Email',
    send: 'On commit',
    signature: 'Acknowledgment only',
    templateOptions: [
      'Compensation band acknowledgment',
      'Pay range acknowledgment',
      'Salary band confirmation',
    ],
    condition: (fieldKeys) =>
      fieldKeys.some((k) => {
        const f = FIELDS_BY_KEY.get(k)
        return f && (f.sectionId === 'pay' || f.sectionId === 'compensation')
      }),
    errorMessages: [
      'Document delivery failed for 1 employee. Retry.',
      'Email service timed out. Retry in a moment.',
    ],
  },
  {
    id: 'comm.totalRewardsOverview',
    label: 'FY26 Total Rewards overview',
    sublabel: 'Informational overview sent to employee and manager',
    kind: 'comm',
    commType: 'document',
    recipients: ['Employee', 'New Manager'],
    channel: 'Email',
    send: 'On commit',
    signature: 'Informational',
    templateOptions: [
      'FY26 Total Rewards overview',
      'FY25 Total Rewards overview',
      'Benefits and compensation summary',
    ],
    condition: (fieldKeys) =>
      fieldKeys.some((k) => {
        const f = FIELDS_BY_KEY.get(k)
        return f && (f.sectionId === 'pay' || f.sectionId === 'compensation')
      }),
    errorMessages: [
      'Document delivery failed for 1 employee. Retry.',
      'Email service timed out. Retry in a moment.',
    ],
  },
  {
    id: 'comm.employmentAgreement',
    label: 'Updated employment agreement',
    sublabel: 'DocuSign envelope sent for e-signature',
    kind: 'comm',
    commType: 'document',
    recipients: ['Employee'],
    channel: 'Email',
    send: 'On effective date',
    signature: 'Requires signature',
    templateOptions: [
      'Updated employment agreement',
      'Employment contract amendment',
      'New employment terms',
    ],
    condition: (fieldKeys) => fieldKeys.includes('employmentType'),
    errorMessages: [
      'DocuSign envelope creation failed — the template may be missing required fields. Retry.',
      'DocuSign API is temporarily unavailable. Retry in a moment.',
    ],
  },
]

// ── Integration catalog ──────────────────────────────────────────────────────

const INTEGRATION_DEFS = {
  carta: {
    id: 'int.carta',
    label: 'Carta',
    sublabel: 'Cap table & equity integration',
    kind: 'write',
    errorMessages: [
      'Carta could not locate matching equity grants for 1 employee. Retry or resolve manually in Carta.',
      'Carta API is temporarily unavailable (503). Retry in a moment.',
    ],
    mockImpact: {
      users: 12,
      confidence: 'High',
      grants: [
        { name: 'Priya Sharma', role: 'equity-admin', via: 'eng-leads-global' },
        { name: '11 others', role: 'view', repos: null, via: 'equity-participants group' },
      ],
      loses: [],
      undefined: [],
    },
  },
  adp: {
    id: 'int.adp',
    label: 'ADP Workforce Now',
    sublabel: 'Payroll & benefits integration',
    kind: 'write',
    errorMessages: [
      'ADP returned a 409 conflict — the record may have been modified externally. Retry to force-sync.',
      'ADP API rate limit reached. Wait 30 seconds, then retry.',
    ],
    mockImpact: {
      users: 14,
      confidence: 'Medium',
      grants: [
        { name: 'Connor Hall', role: 'payroll-admin', via: 'finance-leads-amer' },
        { name: '9 others', role: 'standard', via: 'adp-employees group' },
      ],
      loses: [
        { name: '4 others', role: 'standard', system: 'payroll', via: 'left adp-employees group' },
      ],
      undefined: [
        { name: 'Marcus Lee', reason: 'ADP record ID mismatch — employee may have been merged.', action: 'Reconcile manually' },
      ],
    },
  },
  slack: {
    id: 'int.slack',
    label: 'Slack',
    sublabel: 'Channels & workspace access',
    kind: 'write',
    errorMessages: [
      'Slack workspace returned 503 — try again in a moment.',
      'Slack channel update failed — the bot may have been removed from the channel. Retry after verifying.',
    ],
    mockImpact: {
      users: 87,
      confidence: 'High',
      grants: [
        { name: 'Wei Zhang', role: 'channel-manager', via: 'eng-leads-emea' },
        { name: 'Elena Martinez', role: 'channel-manager', via: 'eng-leads-amer' },
        { name: '76 others', role: 'member', via: 'eng-all-hands channel' },
      ],
      loses: [
        { name: '14 contractors', role: 'member', system: 'eng-internal', via: 'left contractor-eng group' },
      ],
      undefined: [],
    },
  },
  googleGroups: {
    id: 'int.googleGroups',
    label: 'Google Workspace',
    sublabel: 'Groups & directory integration',
    kind: 'write',
    errorMessages: [
      'Google Admin SDK returned a quota exceeded error. Retry after a few minutes.',
      'Google Groups update failed for 1 user — the group may not exist. Retry after verifying.',
    ],
    mockImpact: {
      users: 111,
      confidence: 'High',
      grants: [
        { name: 'Raj Patel', role: 'group-owner', via: 'eng-leads-amer' },
        { name: '91 others', role: 'member', via: 'google-workspace-users group' },
      ],
      loses: [
        { name: '12 others', role: 'member', system: 'workspace', via: 'left team-workspace group' },
      ],
      undefined: [],
    },
  },
  workday: {
    id: 'int.workday',
    label: 'Workday HCM',
    sublabel: 'HR system of record',
    kind: 'write',
    errorMessages: [
      'Workday integration credentials have expired. Re-authenticate in Settings → Integrations, then retry.',
      'Workday returned a validation error on the position field. Retry after verifying job codes.',
    ],
    mockImpact: {
      users: 89,
      confidence: 'High',
      grants: [
        { name: '52 others', role: 'hcm-user', via: 'workday-employees group' },
      ],
      loses: [
        { name: '28 others', role: 'hcm-user', system: 'workday', via: 'left workday-employees group' },
      ],
      undefined: [
        { name: 'Diane Foster', reason: 'Position code not found in Workday job catalog.', action: 'Map position code' },
        { name: 'James Wu', reason: 'Workday org unit ID mismatch for new department.', action: 'Update org unit' },
        { name: '2 others', reason: 'Workday record ID could not be resolved.', action: 'Reconcile manually' },
      ],
    },
  },
  bamboohr: {
    id: 'int.bamboohr',
    label: 'BambooHR',
    sublabel: 'HR data sync',
    kind: 'write',
    errorMessages: [
      'BambooHR returned a 404 — the employee record may not exist in BambooHR yet. Retry after syncing.',
      'BambooHR API is temporarily unavailable. Retry in a moment.',
    ],
    mockImpact: {
      users: 23,
      confidence: 'Medium',
      grants: [
        { name: '18 others', role: 'employee', via: 'bamboohr-users group' },
      ],
      loses: [
        { name: '5 others', role: 'employee', system: 'bamboohr', via: 'left bamboohr-users group' },
      ],
      undefined: [
        { name: 'Ana Ruiz', reason: 'BambooHR employee ID not found.', action: 'Link account' },
      ],
    },
  },
  okta: {
    id: 'int.okta',
    label: 'Okta',
    sublabel: 'Identity & SSO provisioning',
    kind: 'write',
    errorMessages: [
      'Okta returned a 429 rate-limit error. Wait 60 seconds, then retry.',
      'Okta group assignment failed — the target group may have been deleted. Retry after verifying.',
    ],
    mockImpact: {
      users: 89,
      confidence: 'High',
      grants: [
        { name: 'Wei Zhang', role: 'admin', via: 'billing-svc group' },
        { name: '51 others', role: 'standard', via: 'okta-employees group' },
      ],
      loses: [
        { name: 'Noah Williams', role: 'admin', system: 'billing-svc', via: 'left billing-team group' },
        { name: '27 others', role: 'standard', system: 'okta', via: 'left okta-employees group' },
      ],
      undefined: [
        { name: 'Sara Cohen', reason: 'Account exists in Okta but not linked in Rippling SCIM.', action: 'Map manually' },
        { name: 'Liu Wang', reason: 'Account exists in Okta but not linked in Rippling SCIM.', action: 'Map manually' },
        { name: '2 others', reason: 'SCIM provisioning returned ambiguous match.', action: 'Retry at commit' },
      ],
    },
  },
  gsuite: {
    id: 'int.gsuite',
    label: 'Google Workspace',
    sublabel: 'Account provisioning',
    kind: 'write',
    errorMessages: [
      'Google Admin SDK returned a quota exceeded error. Retry after a few minutes.',
      'Google Workspace provisioning failed for 1 user — the account may already exist. Retry.',
    ],
    mockImpact: {
      users: 34,
      confidence: 'High',
      grants: [
        { name: '28 others', role: 'workspace-user', via: 'gsuite-employees group' },
      ],
      loses: [
        { name: '6 others', role: 'workspace-user', system: 'gsuite', via: 'left gsuite-employees group' },
      ],
      undefined: [],
    },
  },
  github: {
    id: 'int.github',
    label: 'GitHub',
    sublabel: 'Teams & repository access',
    kind: 'write',
    errorMessages: [
      'GitHub returned a 422 — the team slug may have changed. Retry after verifying team names.',
      'GitHub API is temporarily unavailable. Retry in a moment.',
    ],
    mockImpact: {
      users: 58,
      confidence: 'High',
      grants: [
        { name: 'Wei Zhang', role: 'org-admin', via: 'eng-leads-emea' },
        { name: 'Raj Patel', role: 'org-admin', via: 'eng-leads-amer' },
        { name: 'Connor Hall', role: 'org-admin', via: 'eng-leads-amer' },
        { name: 'Elena Martinez', role: 'org-admin', via: 'eng-leads-amer' },
        { name: '37 others', role: 'write', repos: 'eng-* repos', via: 'eng-ic-amer' },
      ],
      loses: [
        { name: '11 contractors', role: 'read', system: 'eng-internal', via: 'left contractor-eng group' },
        { name: 'Noah Williams', role: 'admin', system: 'billing-svc', via: 'left billing-team group' },
        { name: '2 others', role: 'admin', system: 'payments-svc', via: 'left payments-team group' },
      ],
      undefined: [
        { name: 'Tom Reyes', reason: 'External webhook for org membership returned 503 at preview.', action: 'Retry at commit' },
        { name: 'Sara Cohen', reason: 'Account exists in GitHub but not linked in Rippling SCIM.', action: 'Map manually' },
        { name: 'Liu Wang', reason: 'Account exists in GitHub but not linked in Rippling SCIM.', action: 'Map manually' },
      ],
    },
  },
  notion: {
    id: 'int.notion',
    label: 'Notion',
    sublabel: 'Workspace access',
    kind: 'write',
    errorMessages: [
      'Notion workspace invitation failed — the user may already be a member. Retry.',
      'Notion API returned an error. Retry in a moment.',
    ],
    mockImpact: {
      users: 18,
      confidence: 'Medium',
      grants: [
        { name: '14 others', role: 'member', via: 'notion-workspace group' },
      ],
      loses: [
        { name: '4 others', role: 'member', system: 'notion', via: 'left notion-workspace group' },
      ],
      undefined: [
        { name: 'Priya Sharma', reason: 'Notion account email does not match Rippling work email.', action: 'Update email' },
      ],
    },
  },
  syncRecord: {
    id: 'int.syncRecord',
    label: 'Rippling HRIS',
    sublabel: 'Syncs remaining field changes to connected systems',
    kind: 'write',
    errorMessages: [
      'Record sync failed — a concurrent edit may have locked this employee. Retry.',
      'Rippling returned an unexpected error while syncing. Retry.',
    ],
    mockImpact: {
      users: 89,
      confidence: 'High',
      grants: [
        { name: '89 others', role: 'hris-user', via: 'rippling-employees group' },
      ],
      loses: [],
      undefined: [],
    },
  },
}

/**
 * Maps each field key to a list of integration keys from INTEGRATION_DEFS.
 * Fields not listed here fall back to the catch-all syncRecord integration.
 */
const FIELD_INTEGRATION_KEYS = {
  // $ / compensation → Carta, ADP
  baseCompensation: ['carta', 'adp'],
  basePay: ['carta', 'adp'],
  annualSalary: ['carta', 'adp'],
  hourlyRate: ['carta', 'adp'],
  bonus: ['carta', 'adp'],
  equity: ['carta'],
  stockOptions: ['carta'],
  vestingSchedule: ['carta'],
  // Org / people → Slack, Google Groups, Workday
  title: ['slack', 'googleGroups', 'workday'],
  level: ['slack', 'googleGroups', 'workday'],
  jobFamily: ['workday', 'bamboohr'],
  manager: ['slack', 'googleGroups', 'workday'],
  jobsManager: ['slack', 'googleGroups', 'workday'],
  department: ['slack', 'googleGroups', 'workday'],
  departmentPath: ['slack', 'googleGroups', 'workday'],
  teams: ['slack', 'googleGroups'],
  // Location / entity
  legalEntity: ['workday', 'bamboohr'],
  workLocation: ['workday', 'bamboohr'],
  jobsWorkLocation: ['workday', 'bamboohr'],
  state: ['workday', 'bamboohr'],
  // Personal / identity
  preferredFirstName: ['slack', 'googleGroups'],
  personalEmail: ['gsuite'],
  workEmailAccess: ['gsuite', 'okta'],
  // Apps / auth / security
  authentication: ['okta', 'gsuite'],
  twoFactor: ['okta'],
  apps: ['okta', 'gsuite', 'github', 'notion'],
  gsuite: ['gsuite', 'okta'],
  slack: ['slack'],
  // Employment
  employmentType: ['workday', 'adp', 'bamboohr'],
  startDate: ['workday', 'adp', 'bamboohr'],
  endDate: ['workday', 'adp'],
}

/**
 * Build the integration substep items for the given field selection.
 * Always returns at least the syncRecord catch-all.
 */
function buildIntegrationItems(selectedFieldKeys) {
  const keySet = new Set()
  let anyFieldMapped = false

  for (const fieldKey of selectedFieldKeys) {
    const keys = FIELD_INTEGRATION_KEYS[fieldKey]
    if (keys && keys.length > 0) {
      anyFieldMapped = true
      for (const k of keys) keySet.add(k)
    }
  }

  if (!anyFieldMapped) {
    keySet.add('syncRecord')
  }

  return [...keySet].map((k) => INTEGRATION_DEFS[k]).filter(Boolean)
}

/**
 * Build the full ordered substep plan for the given field selection.
 *
 * Returns an array of substep descriptors:
 *   { id, label, description, items[], kind: 'preview'|'department'|'comms'|'integrations',
 *     departmentId?, triggeringFieldKeys? }
 *
 * Order:
 *   Preview → [active departments in canonical order]
 *           → Communications → Integrations
 *
 * Active departments are determined by FIELD_DEPARTMENT_MAP — only those
 * triggered by at least one selected field appear. If no field triggers any
 * department, the sub-tracker collapses to just preview/comms/integrations.
 *
 * Integration substep is force-augmented with any integration keys referenced
 * by Preview event sources, so every "Go to Integrations" deep-link works.
 */
export function buildFollowUpsPlan(selectedFieldKeys) {
  const plan = []

  // 1. Preview — always first (replaces System Checks)
  const previewEventSources = getPreviewEventSources()
  plan.push({
    id: 'systemChecks',          // keep id stable so completedIds persists across re-renders
    label: 'Preview',
    description: 'A risk-shaped read-out of every event your change will trigger across people, systems, and compliance.',
    kind: 'preview',
    items: previewEventSources,  // EventSource[] — evaluated lazily by usePreviewRunner
  })

  // 2. Department panels — one substep per triggered department, in canonical order
  const activeDeptMap = getDepartmentsForFieldKeys(selectedFieldKeys)
  for (const [deptId, triggeringFieldKeys] of activeDeptMap) {
    const dept = DEPARTMENTS_BY_ID.get(deptId)
    if (!dept) continue
    plan.push({
      id: `dept.${deptId}`,
      label: dept.label,
      description: dept.blurb,
      kind: 'department',
      departmentId: deptId,
      triggeringFieldKeys,
      items: [],
    })
  }

  // 3. Communications
  const commItems = COMMUNICATIONS_CONFIGS.filter((c) => c.condition(selectedFieldKeys))
  plan.push({
    id: 'communications',
    label: 'Communications',
    description: 'Sends notifications, documents, and announcements to affected parties.',
    kind: 'comms',
    items: commItems,
  })

  // 4. Integrations — always last, always present.
  // Force-include any integration keys that Preview events reference so that
  // every "Go to Integrations" deep-link has a real destination row.
  const allPreviewIds = new Set(previewEventSources.map((s) => s.id))
  const requiredIntKeys = getRequiredIntegrationKeys(allPreviewIds)
  const baseIntegrationItems = buildIntegrationItems(selectedFieldKeys)
  const baseKeySet = new Set(baseIntegrationItems.map((i) => {
    // extract key from id pattern 'int.{key}'
    return i.id.replace(/^int\./, '')
  }))
  const extraItems = requiredIntKeys
    .filter((k) => !baseKeySet.has(k))
    .map((k) => INTEGRATION_DEFS[k])
    .filter(Boolean)
  plan.push({
    id: 'integrations',
    label: 'Integrations',
    description: 'Syncs changes to connected third-party systems.',
    kind: 'integrations',
    items: [...baseIntegrationItems, ...extraItems],
  })

  return plan
}
