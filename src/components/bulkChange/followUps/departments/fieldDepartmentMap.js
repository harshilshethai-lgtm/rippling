import { DEPARTMENT_ORDER } from './DEPARTMENTS'

/**
 * Dummy showing rules: maps a changed field's key to the list of
 * department IDs that have follow-up work as a result.
 *
 * Anchored to real keys in `defineChanges/fieldSchema.js`. Fields not present
 * here trigger no department (the Follow-ups sub-tracker then collapses to
 * just System checks → Communications → Integrations).
 *
 * The canonical example — changing Work location triggers all seven
 * departments — is the `workLocation` / `jobsWorkLocation` / `state`
 * / `region` row.
 */
export const FIELD_DEPARTMENT_MAP = {
  // ── Location / region — the canonical 7-department case ───────────────
  workLocation:        ['hr', 'payroll', 'it', 'finance', 'global', 'benefits', 'compliance'],
  jobsWorkLocation:    ['hr', 'payroll', 'it', 'finance', 'global', 'benefits', 'compliance'],
  state:               ['hr', 'payroll', 'it', 'finance', 'global', 'benefits', 'compliance'],
  region:              ['hr', 'payroll', 'it', 'finance', 'global', 'benefits', 'compliance'],

  // ── Legal entity ──────────────────────────────────────────────────────
  legalEntity:         ['hr', 'payroll', 'finance', 'global', 'benefits', 'compliance'],

  // ── Compensation ──────────────────────────────────────────────────────
  currency:            ['payroll', 'finance'],
  baseCompensation:    ['payroll', 'finance'],
  compBand:            ['payroll', 'finance'],
  compaRatio:          ['payroll', 'finance'],
  ttc:                 ['payroll', 'finance'],
  equityEligibility:   ['finance'],
  bonusTarget:         ['payroll', 'finance'],
  meritCycle:          ['payroll', 'finance'],
  lastIncreaseAmount:  ['payroll', 'finance'],

  // ── Employment classification ─────────────────────────────────────────
  employmentType:      ['hr', 'payroll', 'benefits', 'compliance'],
  workerType:          ['hr', 'payroll', 'benefits', 'compliance'],
  fte:                 ['payroll', 'benefits'],

  // ── Org / role ────────────────────────────────────────────────────────
  manager:             ['hr'],
  jobsManager:         ['hr'],
  department:          ['hr', 'it', 'finance'],
  departmentPath:      ['hr', 'it', 'finance'],
  title:               ['hr', 'finance'],
  level:               ['hr', 'finance'],
  jobFamily:           ['hr', 'finance'],

  // ── Insurance / benefits ──────────────────────────────────────────────
  medicalPlan:         ['benefits'],
  dentalPlan:          ['benefits'],
  visionPlan:          ['benefits'],
  retirement:          ['benefits'],
  hsaFsa:              ['benefits'],
  lifeInsurance:       ['benefits'],

  // ── Documents ─────────────────────────────────────────────────────────
  i9:                  ['hr', 'compliance'],
  w4:                  ['hr', 'payroll', 'compliance'],
  nda:                 ['hr', 'compliance'],
  handbookAck:         ['hr', 'compliance'],
  directDepositAuth:   ['payroll'],

  // ── Identity / global ─────────────────────────────────────────────────
  visaStatus:          ['hr', 'global', 'compliance'],
  countryOfCitizenship:['hr', 'global', 'compliance'],

  // ── Apps / IT / security ──────────────────────────────────────────────
  apps:                ['it'],
  gsuite:              ['it'],
  slack:               ['it'],
  notion:              ['it'],
  githubAccess:        ['it'],
  jira:                ['it'],
  zoom:                ['it'],
  ssoProvider:         ['it'],
  mfaEnforcement:      ['it'],
  ipRestrictions:      ['it'],
  sessionTimeout:      ['it'],
  accountStatus:       ['it'],
  primary2fa:          ['it', 'compliance'],
  backup2fa:           ['it', 'compliance'],
  securityKeys:        ['it'],

  // ── Devices ───────────────────────────────────────────────────────────
  primaryDevice:       ['it'],
  serialNumber:        ['it'],
  mdmProfile:          ['it'],
  diskEncryption:      ['it'],

  // ── Learning / training ───────────────────────────────────────────────
  requiredTrainings:   ['compliance'],
  certificationStatus: ['compliance'],
  nextDueDate:         ['compliance'],
  learningPath:        ['compliance'],

  // ── Expenses ──────────────────────────────────────────────────────────
  expensePolicy:       ['finance'],
  corporateCard:       ['finance'],
  cardLimit:           ['finance'],
  travelTier:          ['finance'],

  // ── Payroll-specific ──────────────────────────────────────────────────
  paySchedule:         ['payroll'],
  payGroup:            ['payroll'],
  overtimeExemption:   ['payroll'],
  federalWithholding:  ['payroll', 'global'],
  stateWithholding:    ['payroll', 'global'],
}

/**
 * Resolve which departments are active for the current field selection,
 * along with which selected fields triggered each.
 *
 * Returns an ordered Map (canonical DEPARTMENT_ORDER) of:
 *   Map<deptId, fieldKey[]>  — fieldKey[] preserves selectedFieldKeys order
 *
 * Used by buildFollowUpsPlan to know which department panels to render
 * and by DepartmentPanel to group tasks by triggering field.
 */
export function getDepartmentsForFieldKeys(selectedFieldKeys) {
  const byDept = new Map()
  for (const fk of selectedFieldKeys ?? []) {
    const depts = FIELD_DEPARTMENT_MAP[fk]
    if (!depts || depts.length === 0) continue
    for (const dept of depts) {
      if (!byDept.has(dept)) byDept.set(dept, [])
      const list = byDept.get(dept)
      if (!list.includes(fk)) list.push(fk)
    }
  }

  // Re-order by canonical sequence so HR is always first, etc.
  const ordered = new Map()
  for (const dept of DEPARTMENT_ORDER) {
    if (byDept.has(dept)) ordered.set(dept, byDept.get(dept))
  }
  return ordered
}
