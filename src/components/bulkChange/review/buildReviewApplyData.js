import { EMPLOYEES } from '../../../data/employees'
import { FIELDS_BY_KEY } from '../defineChanges/fieldSchema'
import { getCurrentValue } from '../defineChanges/currentValues'
import { getDepartmentsForFieldKeys } from '../followUps/departments/fieldDepartmentMap'
import { DEPARTMENTS_BY_ID } from '../followUps/departments/DEPARTMENTS'
import { initials, avatarClass } from '../../../lib/utils'

// ── Scenario detection ─────────────────────────────────────────────────────

/** Title-only changes use the clean “happy path” demo (no failures). */
export function isTitleOnlyChange(selectedFieldKeys = []) {
  const keys = selectedFieldKeys.filter(Boolean)
  return keys.length === 1 && keys[0] === 'title'
}

export function isHappyPathScenario(selectedFieldKeys) {
  return isTitleOnlyChange(selectedFieldKeys)
}

// ── Value resolution (matches Make Changes / preview) ─────────────────────

export function resolveValue(emp, fieldKey, { bulkValues, cellOverrides, uniformByField }) {
  const mode = uniformByField?.[fieldKey] ?? 'uniform'
  const bulk = bulkValues?.[fieldKey]
  const hasBulk = bulk !== undefined && bulk !== ''
  const override = cellOverrides?.[emp.id]?.[fieldKey]
  const hasOverride = override !== undefined && override !== ''
  if (mode === 'unique') return hasOverride ? override : hasBulk ? bulk : ''
  return hasBulk ? bulk : ''
}

function getEmployees(selectedEmployeeIds) {
  const idSet = new Set(selectedEmployeeIds ?? [])
  if (idSet.size === 0) return []
  return EMPLOYEES.filter((e) => idSet.has(e.id))
}

function hashSeed(...parts) {
  const s = parts.join('|')
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

// ── Dept / domain / integration mapping ───────────────────────────────────

const DEPT_TO_DOMAIN = {
  hr: 'org',
  finance: 'comp',
  payroll: 'payroll',
  benefits: 'benefits',
  it: 'it',
  global: 'external',
  compliance: 'docs',
}

const INTEGRATION_TO_DOMAIN = {
  okta: 'it',
  github: 'it',
  gsuite: 'it',
  slack: 'external',
  googleGroups: 'external',
  workday: 'org',
  bamboohr: 'org',
  carta: 'external',
  adp: 'payroll',
  notion: 'it',
  syncRecord: 'org',
}

const DOMAIN_COLUMN_META = {
  org: { label: 'ORG', subLabels: ['HRIS', 'title', 'role'] },
  comp: { label: 'COMP', subLabels: ['Base', 'equity'] },
  benefits: { label: 'BENEFITS', subLabels: ['Eligibility'] },
  payroll: { label: 'PAYROLL', subLabels: ['Pay update'] },
  it: { label: 'IT', subLabels: ['Okta', 'GitHub', 'SaaS'] },
  docs: { label: 'DOCS', subLabels: ['Letter', 'e-sign'] },
  external: { label: 'EXTERNAL', subLabels: ['Carta', 'SaaS', 'sync'] },
  monitor: { label: 'MONITOR', subLabels: ['Day 30', 'Day 60'] },
}

const DOMAIN_ORDER = ['org', 'comp', 'benefits', 'payroll', 'it', 'docs', 'external', 'monitor']

const INTEGRATION_DISPLAY = {
  syncRecord: { name: 'HRIS', key: 'hris' },
  adp: { name: 'Payroll', key: 'payroll' },
  okta: { name: 'Okta', key: 'okta' },
  slack: { name: 'Slack', key: 'slack' },
  workday: { name: 'Workday', key: 'workday' },
  bamboohr: { name: 'BambooHR', key: 'bamboohr' },
  carta: { name: 'Carta', key: 'carta' },
  github: { name: 'GitHub', key: 'github' },
  gsuite: { name: 'Google', key: 'gsuite' },
  googleGroups: { name: 'Google Groups', key: 'googleGroups' },
  notion: { name: 'Notion', key: 'notion' },
}

function integrationKeysForFields(selectedFieldKeys) {
  const keys = new Set(['syncRecord'])
  for (const fk of selectedFieldKeys ?? []) {
    const map = {
      baseCompensation: ['carta', 'adp'],
      basePay: ['carta', 'adp'],
      title: ['slack', 'googleGroups', 'workday'],
      level: ['slack', 'googleGroups', 'workday'],
      manager: ['slack', 'googleGroups', 'workday'],
      apps: ['okta', 'github'],
      workLocation: ['workday', 'bamboohr'],
    }
    const list = map[fk] ?? []
    list.forEach((k) => keys.add(k))
  }
  return [...keys]
}

// ── Simulated execution status ─────────────────────────────────────────────

const FAIL_IT_NAMES = new Set(['sara goh', 'tomas vargas'])
const DRIFT_COMP_NAMES = new Set(['marcus lin'])
const UNSIGNED_LETTER_NAMES = new Set(['marcus lin', 'sara goh', 'tomas vargas'])

function simulateStatus({
  emp,
  taskKind,
  taskName,
  scenario,
  selectedFieldKeys,
  deptId,
  integrationKey,
  employeeIndex,
  employeeCount,
  failIntegrationKey,
}) {
  if (scenario === 'happy') {
    if (taskKind === 'monitor') return 'scheduled'
    return 'success'
  }

  const name = (emp.fullName ?? '').toLowerCase()
  const hasComp = selectedFieldKeys.some((k) =>
    ['baseCompensation', 'basePay', 'bonusTarget', 'equityEligibility'].includes(k),
  )
  const hasLetter =
    hasComp || selectedFieldKeys.includes('level') || selectedFieldKeys.includes('title')

  if (
    taskKind === 'integration' &&
    integrationKey === failIntegrationKey &&
    (FAIL_IT_NAMES.has(name) || (employeeIndex < 2 && employeeCount >= 2))
  ) {
    return 'error'
  }
  if (taskKind === 'dept' && deptId === 'it' && (FAIL_IT_NAMES.has(name) || employeeIndex < 2)) return 'error'

  if (taskKind === 'dept' && deptId === 'finance' && hasComp) {
    if (DRIFT_COMP_NAMES.has(name) || employeeIndex === 2) return 'drift'
  }
  if (taskKind === 'letter' && hasLetter) {
    if (UNSIGNED_LETTER_NAMES.has(name) || employeeIndex < 3) return 'awaiting'
  }
  if (taskKind === 'monitor') return 'scheduled'

  const h = hashSeed(emp.id, taskName, integrationKey ?? deptId)
  if (h % 17 === 0) return 'running'
  if (h % 23 === 0) return 'awaiting'
  return 'success'
}

const STATUS_PRIORITY = {
  error: 5,
  drift: 4,
  awaiting: 3,
  running: 2,
  scheduled: 1,
  success: 0,
}

function worstStatus(statuses) {
  return statuses.reduce((acc, s) => {
    return (STATUS_PRIORITY[s] ?? 0) > (STATUS_PRIORITY[acc] ?? 0) ? s : acc
  }, 'success')
}

function overallEmployeeStatus(domainStatuses) {
  const w = worstStatus(domainStatuses)
  if (w === 'error') return 'failed'
  if (w === 'drift') return 'drift'
  if (w === 'awaiting') return 'awaiting'
  if (w === 'running') return 'running'
  return 'clean'
}

// ── Employee change labels ─────────────────────────────────────────────────

function buildRoleTransition(emp, selectedFieldKeys, state) {
  const parts = []
  for (const fk of ['title', 'level', 'department', 'manager']) {
    if (!selectedFieldKeys.includes(fk)) continue
    const from = getCurrentValue(emp, fk)
    const to = resolveValue(emp, fk, state)
    if (to && to !== from) {
      const label = FIELDS_BY_KEY.get(fk)?.label ?? fk
      parts.push({ fk, label, from, to })
    }
  }
  if (parts.length === 0) {
    const primary = selectedFieldKeys[0]
    const from = getCurrentValue(emp, primary)
    const to = resolveValue(emp, primary, state)
    const label = FIELDS_BY_KEY.get(primary)?.label ?? primary
    return {
      fromRole: from || emp.title || '—',
      toRole: to || from || emp.title || '—',
      primaryField: primary,
      changes: [{ fk: primary, label, from, to }],
    }
  }
  const primary = parts[0]
  const fromBits = parts.map((p) => p.from).filter(Boolean)
  const toBits = parts.map((p) => p.to).filter(Boolean)
  return {
    fromRole: fromBits.join(' · ') || emp.title,
    toRole: toBits.join(' · ') || emp.title,
    primaryField: primary.fk,
    changes: parts,
  }
}

function formatPctChange(emp, selectedFieldKeys, state) {
  if (!selectedFieldKeys.includes('baseCompensation')) return null
  const from = getCurrentValue(emp, 'baseCompensation')
  const to = resolveValue(emp, 'baseCompensation', state)
  if (!to || to === from) return '+0%'
  const parse = (v) => Number(String(v).replace(/[^0-9.]/g, '')) || 0
  const a = parse(from)
  const b = parse(to)
  if (a <= 0) return null
  const pct = Math.round(((b - a) / a) * 100)
  return `${pct >= 0 ? '+' : ''}${pct}%`
}

// ── Flatten follow-up tasks ────────────────────────────────────────────────

function flattenFollowUpTasks(tasksByDepartment) {
  const out = []
  for (const [deptId, tasks] of Object.entries(tasksByDepartment ?? {})) {
    for (const task of tasks ?? []) {
      out.push({
        id: task.id,
        name: task.title,
        deptId,
        domainId: DEPT_TO_DOMAIN[deptId] ?? 'org',
        sourceFieldKey: task.sourceFieldKey,
        kind: 'dept',
      })
    }
  }
  return out
}

function syntheticLetterTasks(selectedFieldKeys) {
  if (isTitleOnlyChange(selectedFieldKeys)) return []
  if (!selectedFieldKeys.some((k) => ['title', 'level', 'baseCompensation'].includes(k))) {
    return []
  }
  return [
    {
      id: 'syn.letter.generate',
      name: 'Promotion letter generated',
      domainId: 'docs',
      kind: 'letter',
      phase: 'pre',
    },
    {
      id: 'syn.letter.sign',
      name: 'Letter e-signature',
      domainId: 'docs',
      kind: 'letter',
      phase: 'on',
    },
  ]
}

function syntheticMonitorTasks() {
  return [
    { id: 'syn.mon.d30', name: 'Day-30 check-in', domainId: 'monitor', kind: 'monitor', phase: 'post' },
    { id: 'syn.mon.d60', name: 'Day-60 retention', domainId: 'monitor', kind: 'monitor', phase: 'post' },
  ]
}

// ── Build per-employee execution matrix ────────────────────────────────────

function buildEmployeeRows({
  employees,
  selectedFieldKeys,
  state,
  scenario,
  followUpTasks,
  integrationKeys,
}) {
  const letterTasks = syntheticLetterTasks(selectedFieldKeys)
  const monitorTasks = syntheticMonitorTasks()
  const failIntegrationKey =
    integrationKeys.find((k) => ['okta', 'workday', 'slack'].includes(k)) ?? integrationKeys[0]

  const integrationTasks = integrationKeys.map((key) => ({
    id: `int.${key}`,
    name: INTEGRATION_DISPLAY[key]?.name ?? key,
    domainId: INTEGRATION_TO_DOMAIN[key] ?? 'external',
    kind: 'integration',
    integrationKey: key,
    phase: 'on',
  }))

  const allTaskDefs = [...followUpTasks, ...letterTasks, ...monitorTasks, ...integrationTasks]

  return employees.map((emp, employeeIndex) => {
    const transition = buildRoleTransition(emp, selectedFieldKeys, state)
    const domains = {}
    const domainStatuses = []

    for (const domainId of DOMAIN_ORDER) {
      const defs = allTaskDefs.filter((t) => t.domainId === domainId)
      if (defs.length === 0) continue
      const dots = defs.map((def) => {
        const status = simulateStatus({
          emp,
          taskKind: def.kind,
          taskName: def.name,
          scenario,
          selectedFieldKeys,
          deptId: def.deptId,
          integrationKey: def.integrationKey,
          employeeIndex,
          employeeCount: employees.length,
          failIntegrationKey,
        })
        let detail = null
        if (status === 'error' && def.integrationKey === 'okta') {
          detail = 'Rate limit 429 — access not granted'
        }
        if (status === 'awaiting' && def.kind === 'letter') {
          detail = 'Unsigned — past due'
        }
        if (status === 'drift') detail = 'Applied with drift'
        return { id: `${emp.id}-${def.id}`, name: def.name, status, detail }
      })
      domains[domainId] = dots
      domainStatuses.push(worstStatus(dots.map((d) => d.status)))
    }

    const overall = overallEmployeeStatus(domainStatuses)
    const notes = []
    if (overall === 'failed') {
      const failed = Object.values(domains)
        .flat()
        .find((d) => d.status === 'error')
      if (failed?.detail) notes.push(failed.detail)
    }
    if (overall === 'drift') notes.push('Applied with drift — audit fact')
    if (domains.docs?.some((d) => d.status === 'awaiting')) {
      notes.push('Letter unsigned · past due')
    }

    return {
      id: emp.id,
      name: emp.fullName,
      initials: initials(emp.fullName),
      avatarClass: avatarClass(emp.fullName),
      pctChange: formatPctChange(emp, selectedFieldKeys, state) ?? '',
      overallStatus: overall,
      fromRole: transition.fromRole,
      toRole: transition.toRole,
      notes,
      domains,
      changes: transition.changes,
    }
  })
}

// ── Domain column health ───────────────────────────────────────────────────

function buildDomainGroups(employeeRows) {
  const activeIds = DOMAIN_ORDER.filter((id) =>
    employeeRows.some((row) => (row.domains[id] ?? []).length > 0),
  )
  return activeIds.map((id) => {
    const meta = DOMAIN_COLUMN_META[id]
    const allDots = employeeRows.flatMap((row) => row.domains[id] ?? [])
    const total = allDots.length
    const failed = allDots.filter((d) => d.status === 'error').length
    const awaiting = allDots.filter((d) => d.status === 'awaiting').length
    const running = allDots.filter((d) => d.status === 'running').length
    const ok = allDots.filter((d) => d.status === 'success').length
    const worst = worstStatus(allDots.map((d) => d.status))

    let label = `${ok}/${total} done`
    let healthStatus = 'success'
    if (failed > 0) {
      label = `${failed} failed · ${ok} ok`
      healthStatus = 'error'
    } else if (awaiting > 0) {
      label = `${awaiting} await · ${ok} ok`
      healthStatus = 'awaiting'
    } else if (running > 0) {
      label = `${ok}/${total} · ${running} running`
      healthStatus = 'running'
    } else if (allDots.every((d) => d.status === 'scheduled')) {
      label = `0/${total} queued`
      healthStatus = 'scheduled'
    }

    const dotCount = Math.min(3, Math.max(1, Math.ceil(allDots.length / Math.max(employeeRows.length, 1))))

    return {
      id,
      label: meta.label,
      subLabels: meta.subLabels.slice(0, dotCount),
      dotCount,
      health: { label, status: healthStatus },
    }
  })
}

// ── Aggregates ─────────────────────────────────────────────────────────────

function countStatuses(employeeRows) {
  const counts = {
    success: 0,
    running: 0,
    scheduled: 0,
    awaiting: 0,
    failed: 0,
    skipped: 0,
    rereview: 0,
  }
  for (const row of employeeRows) {
    for (const dots of Object.values(row.domains)) {
      for (const dot of dots) {
        if (dot.status === 'success') counts.success += 1
        else if (dot.status === 'running') counts.running += 1
        else if (dot.status === 'scheduled') counts.scheduled += 1
        else if (dot.status === 'awaiting') counts.awaiting += 1
        else if (dot.status === 'error') counts.failed += 1
        else if (dot.status === 'drift') counts.rereview += 1
      }
    }
  }
  return counts
}

function buildAttentionItems({ scenario, employeeRows, integrationKeys, failIntegrationKey }) {
  if (scenario === 'happy') return []

  const items = []
  const failedIt = employeeRows.filter((e) => e.overallStatus === 'failed')
  if (failedIt.length > 0) {
    const failSystem =
      INTEGRATION_DISPLAY[failIntegrationKey]?.name ??
      (failIntegrationKey === 'okta' ? 'Okta' : failIntegrationKey === 'workday' ? 'Workday' : 'Slack')
    const names = failedIt.map((e) => e.name).join(' and ')
    items.push({
      id: 'integration-failure',
      severity: 'error',
      title: `${failedIt.length} ${failSystem} provisioning task${failedIt.length > 1 ? 's' : ''} failed – rate limit 429`,
      description: `Auto-retried 3× with exponential backoff. Affects ${names} — changes not fully applied in ${failSystem}.`,
      employeeNames: failedIt.map((e) => e.name),
    })
  }

  const unsigned = employeeRows.filter((row) =>
    (row.domains.docs ?? []).some((d) => d.status === 'awaiting'),
  )
  if (unsigned.length > 0) {
    items.push({
      id: 'letters-unsigned',
      severity: 'warning',
      title: `${unsigned.length} promotion letter${unsigned.length > 1 ? 's' : ''} unsigned – effective date passed`,
      description: `${unsigned.map((e) => e.name).join(', ')}. Letters sent before effective date; reminders already sent.`,
      employeeNames: unsigned.map((e) => e.name),
    })
  }

  return items
}

function buildIntegrationHealth({ scenario, employeeRows, integrationKeys, employeeCount }) {
  const n = employeeCount
  return integrationKeys.map((key) => {
    const display = INTEGRATION_DISPLAY[key] ?? { name: key, key }
    const domain = INTEGRATION_TO_DOMAIN[key] ?? 'external'
    const dots = employeeRows.flatMap((row) =>
      (row.domains[domain] ?? []).filter((d) => d.name.includes(display.name) || d.id.includes(key)),
    )
    const failed = dots.filter((d) => d.status === 'error').length
    const ok = dots.filter((d) => d.status === 'success').length
    const running = dots.filter((d) => d.status === 'running').length

    if (scenario === 'happy') {
      return { id: display.key, name: display.name, status: 'success', detail: `${n}/${n} succeeded` }
    }
    if (failed > 0 && key === 'okta') {
      return { id: display.key, name: display.name, status: 'error', detail: 'rate limit 429' }
    }
    if (running > 0 || (ok > 0 && ok < n)) {
      return {
        id: display.key,
        name: display.name,
        status: 'running',
        detail: `${ok}/${n} · ${running || n - ok} running`,
      }
    }
    return { id: display.key, name: display.name, status: 'success', detail: `${n}/${n} succeeded` }
  })
}

function buildImplications({ scenario, employees, selectedFieldKeys, state, employeeRows }) {
  const n = employees.length
  const titleCount = selectedFieldKeys.includes('title')
    ? employees.filter((emp) => {
        const to = resolveValue(emp, 'title', state)
        const from = getCurrentValue(emp, 'title')
        return to && to !== from
      }).length
    : 0

  const items = []

  if (titleCount > 0 || selectedFieldKeys.includes('title')) {
    items.push({
      id: 'title-changes',
      iconKey: 'trending',
      value: String(titleCount || n),
      label: titleCount === 1 ? 'title change' : 'title changes',
      detail:
        scenario === 'happy'
          ? `Across ${n} employee${n === 1 ? '' : 's'} — HRIS synced`
          : `Across ${n} employee${n === 1 ? '' : 's'}`,
    })
  }

  if (selectedFieldKeys.some((k) => ['baseCompensation', 'basePay'].includes(k))) {
    items.push({
      id: 'uplift',
      iconKey: 'dollar',
      value: scenario === 'happy' ? '$0' : '$342K',
      label: 'annual uplift',
      detail: scenario === 'happy' ? 'No compensation fields in this change' : '+12.8% on cohort base · 1 over policy band',
      detailColor: scenario === 'happy' ? null : 'warning',
    })
  }

  if (selectedFieldKeys.includes('equityEligibility')) {
    items.push({
      id: 'grants',
      iconKey: 'award',
      value: scenario === 'happy' ? '0' : '8',
      label: 'new grants',
      detail: scenario === 'happy' ? 'Not in scope' : 'Via Carta · grant cycle in progress',
      detailColor: scenario === 'happy' ? null : 'warning',
    })
  }

  if (selectedFieldKeys.includes('manager')) {
    items.push({
      id: 'reporting',
      iconKey: 'branch',
      value: String(Math.min(4, n)),
      label: 'reporting changes',
      detail: 'Manager updates from this worklist',
    })
  }

  if (selectedFieldKeys.some((k) => ['apps', 'title', 'level'].includes(k))) {
    const accessN = scenario === 'happy' ? n : Math.min(15, n)
    items.push({
      id: 'access',
      iconKey: 'shield',
      value: String(accessN),
      label: 'access updates',
      detail: scenario === 'happy' ? 'Workday · Slack · Google Groups' : 'Okta scope · Salesforce · GitHub · Looker',
    })
  }

  if (selectedFieldKeys.some((k) => ['title', 'level', 'baseCompensation'].includes(k))) {
    const signed = employeeRows.filter((row) =>
      (row.domains.docs ?? []).every((d) => d.status === 'success'),
    ).length
    items.push({
      id: 'letters',
      iconKey: 'mail',
      value: String(n),
      label: 'letters',
      detail:
        scenario === 'happy'
          ? `${n} signed · 0 unsigned`
          : `${signed} signed · ${n - signed} unsigned past due`,
      detailColor: scenario === 'happy' ? null : n - signed > 0 ? 'error' : null,
    })
  }

  return items
}

function formatShortDate(isoDate) {
  if (!isoDate) return '—'
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function buildTimeline({ effectiveDateTime, scenario, employees, selectedFieldKeys, attentionItems }) {
  const eff = formatShortDate(effectiveDateTime?.date)
  const n = employees.length
  const fieldCount = selectedFieldKeys.length
  const unsigned = attentionItems.find((a) => a.id === 'letters-unsigned')

  return [
    {
      id: 'committed',
      label: 'Committed',
      date: formatShortDate(new Date().toISOString().slice(0, 10)),
      sub: `${n} employee${n === 1 ? '' : 's'} · ${fieldCount} field${fieldCount === 1 ? '' : 's'}`,
      state: 'done',
    },
    {
      id: 'effective',
      label: 'Effective date',
      date: eff,
      sub: scenario === 'happy' ? 'All calls placed' : 'Most calls placed',
      state: 'done',
    },
    {
      id: 'letters-due',
      label: 'Letters due',
      date: eff,
      sub: unsigned ? `${unsigned.employeeNames.length} still unsigned` : 'All signed',
      state: unsigned ? 'warning' : 'done',
    },
    {
      id: 'payroll-cutoff',
      label: 'Payroll cutoff',
      date: '—',
      sub: selectedFieldKeys.some((k) => ['baseCompensation', 'basePay'].includes(k))
        ? 'YTD roll-up queued'
        : 'Not applicable',
      state: selectedFieldKeys.some((k) => ['baseCompensation', 'basePay'].includes(k)) ? 'future' : 'done',
    },
    {
      id: 'day-30',
      label: 'Day-30 check-in',
      date: '—',
      sub: `${n} monitoring tasks`,
      state: 'future',
    },
    {
      id: 'day-60',
      label: 'Day-60 retention',
      date: '—',
      sub: `${n} monitoring tasks`,
      state: 'future',
    },
  ]
}

function buildByTimeTasks({ followUpTasks, integrationKeys, selectedFieldKeys, employeeRows, scenario }) {
  const n = employeeRows.length
  const tasks = []

  for (const ft of followUpTasks) {
    const dept = DEPARTMENTS_BY_ID.get(ft.deptId)
    const ok = employeeRows.reduce((acc, row) => {
      const dots = row.domains[ft.domainId] ?? []
      const match = dots.find((d) => d.name === ft.name)
      return acc + (match?.status === 'success' ? 1 : 0)
    }, 0)
    const failed = employeeRows.filter((row) => {
      const match = (row.domains[ft.domainId] ?? []).find((d) => d.name === ft.name)
      return match?.status === 'error'
    })

    let status = ok === n ? 'success' : failed.length > 0 ? 'error' : 'running'
    if (scenario === 'happy') status = 'success'

    tasks.push({
      id: ft.id,
      domain: ft.deptId === 'finance' || ft.deptId === 'payroll' ? 'comp' : ft.deptId === 'it' ? 'it' : ft.deptId === 'benefits' ? 'benefits' : 'people',
      phase: ft.deptId === 'hr' ? 'pre' : 'on',
      name: ft.name,
      progress: `${ok}/${n}`,
      date: 'Effective',
      status,
      note: failed.length > 0 ? failed.map((e) => e.name).join(', ') : undefined,
      highlight: status === 'error' ? 'error' : status === 'warning' ? 'warning' : null,
    })
  }

  for (const key of integrationKeys) {
    const label = INTEGRATION_DISPLAY[key]?.name ?? key
    tasks.push({
      id: `time.${key}`,
      domain: key === 'okta' || key === 'github' ? 'it' : key === 'carta' || key === 'slack' ? 'external' : 'people',
      phase: 'on',
      name: label,
      progress: scenario === 'happy' ? `${n}/${n}` : key === 'okta' ? `${Math.max(0, n - 2)}/${n}` : `${n}/${n}`,
      date: 'Oct 15',
      status: scenario === 'happy' ? 'success' : key === 'okta' && n >= 2 ? 'error' : 'success',
      note: key === 'okta' && scenario !== 'happy' ? '2 failed on rate limit 429' : undefined,
      highlight: key === 'okta' && scenario !== 'happy' ? 'error' : null,
    })
  }

  return tasks
}

function buildAiSummary({ scenario, landedPct, complete, total, attentionItems, selectedFieldKeys, worklistName }) {
  if (scenario === 'happy') {
    return `All ${complete} of ${total} tasks landed for this ${worklistName?.toLowerCase().includes('title') ? 'title change' : 'change'}. HRIS and connected systems show green — nothing needs you right now.`
  }
  const parts = []
  parts.push(`${landedPct}% landed — ${complete} of ${total} tasks complete.`)
  if (attentionItems.length > 0) {
    parts.push(
      `${attentionItems.length} thing${attentionItems.length > 1 ? 's' : ''} need you: ${attentionItems.map((a) => a.title.split('–')[0].trim()).join('; ')}.`,
    )
  }
  if (selectedFieldKeys.includes('level')) {
    parts.push('Promotion letters and comp updates are in flight for this cohort.')
  }
  return parts.join(' ')
}

// ── Main export ────────────────────────────────────────────────────────────

/**
 * Builds all Review & Apply view models from live wizard state.
 */
export function buildReviewApplyData({
  selectedEmployeeIds = [],
  selectedFieldKeys = [],
  bulkValues = {},
  cellOverrides = {},
  uniformByField = {},
  tasksByDepartment = {},
  effectiveDateTime,
  worklistName = 'Bulk change',
}) {
  const employees = getEmployees(selectedEmployeeIds)
  const state = { bulkValues, cellOverrides, uniformByField }
  const scenario = isHappyPathScenario(selectedFieldKeys) ? 'happy' : 'complex'
  const followUpTasks = flattenFollowUpTasks(tasksByDepartment)
  const integrationKeys = integrationKeysForFields(selectedFieldKeys)
  const employeeRows = buildEmployeeRows({
    employees,
    selectedFieldKeys,
    state,
    scenario,
    followUpTasks,
    integrationKeys,
  })
  const domainGroups = buildDomainGroups(employeeRows)
  const statusCounts = countStatuses(employeeRows)
  const total =
    statusCounts.success +
    statusCounts.running +
    statusCounts.scheduled +
    statusCounts.awaiting +
    statusCounts.failed +
    statusCounts.rereview
  const complete = statusCounts.success
  const landedPct = total > 0 ? Math.round((complete / total) * 100) : 100
  const failIntegrationKey =
    integrationKeys.find((k) => ['okta', 'workday', 'slack'].includes(k)) ?? 'workday'
  const attentionItems = buildAttentionItems({ scenario, employeeRows, integrationKeys, failIntegrationKey })
  const driftCount = employeeRows.filter((e) => e.overallStatus === 'drift').length
  const needAttention = attentionItems.length > 0
    ? attentionItems.reduce((acc, item) => {
        if (item.id === 'integration-failure') return acc + (item.employeeNames?.length ?? 2)
        if (item.id === 'letters-unsigned') return acc + (item.employeeNames?.length ?? 0)
        return acc + 1
      }, 0)
    : 0

  const progress = {
    landedPct: scenario === 'happy' ? 100 : landedPct,
    complete: scenario === 'happy' ? total || complete : complete,
    total: total || (followUpTasks.length + integrationKeys.length) * Math.max(employees.length, 1),
    summary: buildAiSummary({
      scenario,
      landedPct: scenario === 'happy' ? 100 : landedPct,
      complete: scenario === 'happy' ? (total || complete) : complete,
      total,
      attentionItems,
      selectedFieldKeys,
      worklistName,
    }),
  }
  if (scenario === 'happy' && progress.total === 0) {
    progress.total = employees.length * Math.max(integrationKeys.length, 1)
    progress.complete = progress.total
  }

  const activeDepts = getDepartmentsForFieldKeys(selectedFieldKeys)

  return {
    scenario,
    employees,
    employeeRows,
    domainGroups,
    statusCounts,
    progress,
    attentionItems,
    statTiles: {
      landedPct: progress.landedPct,
      complete: progress.complete,
      total: progress.total,
      needAttention,
      driftCount,
      employeeCount: employees.length,
      changeLabel: isTitleOnlyChange(selectedFieldKeys) ? 'Title updates' : 'Employees changed',
    },
    implications: buildImplications({ scenario, employees, selectedFieldKeys, state, employeeRows }),
    integrationHealth: buildIntegrationHealth({
      scenario,
      employeeRows,
      integrationKeys: ['syncRecord', ...integrationKeys.filter((k) => k !== 'syncRecord')].slice(0, 8),
      employeeCount: employees.length,
    }),
    timeline: buildTimeline({
      effectiveDateTime,
      scenario,
      employees,
      selectedFieldKeys,
      attentionItems,
    }),
    byTimeTasks: buildByTimeTasks({
      followUpTasks,
      integrationKeys,
      selectedFieldKeys,
      employeeRows,
      scenario,
    }),
    selectedFieldKeys,
    activeDepartmentCount: activeDepts.size,
    worklistName,
    aiSummary: progress.summary,
  }
}
