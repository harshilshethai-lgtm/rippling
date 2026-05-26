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

/** Communications definitions, each with a `condition` for inclusion */
export const COMMUNICATIONS_CONFIGS = [
  {
    id: 'comm.compLetter',
    label: 'Send compensation change letter',
    sublabel: 'Generated letter sent to each affected employee',
    kind: 'comm',
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
    id: 'comm.managerNotify',
    label: 'Notify previous and new manager',
    sublabel: 'Automated email to both managers',
    kind: 'comm',
    condition: (fieldKeys) =>
      fieldKeys.includes('manager') || fieldKeys.includes('jobsManager'),
    errorMessages: [
      'Manager notification email bounced for 1 recipient. Retry to re-send.',
      'Email service returned a 503. Retry in a moment.',
    ],
  },
  {
    id: 'comm.employmentAgreement',
    label: 'Send updated employment agreement',
    sublabel: 'DocuSign envelope sent for e-signature',
    kind: 'comm',
    condition: (fieldKeys) => fieldKeys.includes('employmentType'),
    errorMessages: [
      'DocuSign envelope creation failed — the template may be missing required fields. Retry.',
      'DocuSign API is temporarily unavailable. Retry in a moment.',
    ],
  },
  {
    id: 'comm.roleAnnouncement',
    label: 'Send role change announcement',
    sublabel: 'Internal announcement to the team',
    kind: 'comm',
    condition: (fieldKeys) =>
      fieldKeys.includes('title') || fieldKeys.includes('level'),
    errorMessages: [
      'Announcement could not be posted — Slack channel access may have changed. Retry.',
      'Announcement delivery failed for 1 employee. Retry.',
    ],
  },
  {
    id: 'comm.hrbpNotify',
    label: 'Notify HR Business Partner',
    sublabel: 'Summary email to the assigned HRBP',
    kind: 'comm',
    condition: () => true,
    errorMessages: [
      'HRBP notification email could not be delivered. Retry.',
      'Email service timed out. Retry in a moment.',
    ],
  },
]

// ── Integration catalog ──────────────────────────────────────────────────────

const INTEGRATION_DEFS = {
  carta: {
    id: 'int.carta',
    label: 'Update Carta equity grants',
    sublabel: 'Carta cap table integration',
    kind: 'write',
    errorMessages: [
      'Carta could not locate matching equity grants for 1 employee. Retry or resolve manually in Carta.',
      'Carta API is temporarily unavailable (503). Retry in a moment.',
    ],
  },
  adp: {
    id: 'int.adp',
    label: 'Push to ADP Workforce Now',
    sublabel: 'ADP Workforce Now integration',
    kind: 'write',
    errorMessages: [
      'ADP returned a 409 conflict — the record may have been modified externally. Retry to force-sync.',
      'ADP API rate limit reached. Wait 30 seconds, then retry.',
    ],
  },
  slack: {
    id: 'int.slack',
    label: 'Update Slack channels',
    sublabel: 'Slack integration',
    kind: 'write',
    errorMessages: [
      'Slack workspace returned 503 — try again in a moment.',
      'Slack channel update failed — the bot may have been removed from the channel. Retry after verifying.',
    ],
  },
  googleGroups: {
    id: 'int.googleGroups',
    label: 'Update Google Groups',
    sublabel: 'Google Workspace integration',
    kind: 'write',
    errorMessages: [
      'Google Admin SDK returned a quota exceeded error. Retry after a few minutes.',
      'Google Groups update failed for 1 user — the group may not exist. Retry after verifying.',
    ],
  },
  workday: {
    id: 'int.workday',
    label: 'Sync to Workday HCM',
    sublabel: 'Workday HCM integration',
    kind: 'write',
    errorMessages: [
      'Workday integration credentials have expired. Re-authenticate in Settings → Integrations, then retry.',
      'Workday returned a validation error on the position field. Retry after verifying job codes.',
    ],
  },
  bamboohr: {
    id: 'int.bamboohr',
    label: 'Sync to BambooHR',
    sublabel: 'BambooHR integration',
    kind: 'write',
    errorMessages: [
      'BambooHR returned a 404 — the employee record may not exist in BambooHR yet. Retry after syncing.',
      'BambooHR API is temporarily unavailable. Retry in a moment.',
    ],
  },
  okta: {
    id: 'int.okta',
    label: 'Update Okta group membership',
    sublabel: 'Okta integration',
    kind: 'write',
    errorMessages: [
      'Okta returned a 429 rate-limit error. Wait 60 seconds, then retry.',
      'Okta group assignment failed — the target group may have been deleted. Retry after verifying.',
    ],
  },
  gsuite: {
    id: 'int.gsuite',
    label: 'Provision Google Workspace account',
    sublabel: 'Google Workspace integration',
    kind: 'write',
    errorMessages: [
      'Google Admin SDK returned a quota exceeded error. Retry after a few minutes.',
      'Google Workspace provisioning failed for 1 user — the account may already exist. Retry.',
    ],
  },
  github: {
    id: 'int.github',
    label: 'Update GitHub teams',
    sublabel: 'GitHub integration',
    kind: 'write',
    errorMessages: [
      'GitHub returned a 422 — the team slug may have changed. Retry after verifying team names.',
      'GitHub API is temporarily unavailable. Retry in a moment.',
    ],
  },
  notion: {
    id: 'int.notion',
    label: 'Update Notion workspace access',
    sublabel: 'Notion integration',
    kind: 'write',
    errorMessages: [
      'Notion workspace invitation failed — the user may already be a member. Retry.',
      'Notion API returned an error. Retry in a moment.',
    ],
  },
  syncRecord: {
    id: 'int.syncRecord',
    label: 'Sync employee record',
    sublabel: 'Rippling HRIS — syncs remaining field changes to connected systems',
    kind: 'write',
    errorMessages: [
      'Record sync failed — a concurrent edit may have locked this employee. Retry.',
      'Rippling returned an unexpected error while syncing. Retry.',
    ],
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
