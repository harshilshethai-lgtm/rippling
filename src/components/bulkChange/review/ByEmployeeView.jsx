import { useState } from 'react'
import { AlertCircle, RefreshCw, Bell, ExternalLink, SendHorizonal, UserRoundCog, FileText, ChevronUp, ChevronDown, Minus } from 'lucide-react'
import { classNames } from '../../../lib/utils'

// ── Shared attention data (mirrors ReviewApplyStep) ────────────────────────

const ATTENTION_ITEMS = [
  {
    id: 'okta-rate-limit',
    severity: 'error',
    title: '2 Okta provisioning tasks failed – rate limit 429',
    description:
      'Auto-retried 3× with exponential backoff. Affects Sara Goh and Tomas Vargas — Okta access not granted. These rows also carry applied-with-drift from Sept 18 Supergroup rule change.',
    actions: [
      { id: 'retry', label: 'Retry', icon: RefreshCw },
      { id: 'notify-it', label: 'Notify IT', icon: Bell },
      { id: 'open-okta', label: 'Open Okta', icon: ExternalLink },
    ],
  },
  {
    id: 'letters-unsigned',
    severity: 'warning',
    title: '3 promotion letters unsigned – effective date passed',
    description:
      'Marcus Lin (M6), Sara Goh (M6), Tomas Vargas (M6d). Letters sent Oct 7; reminders sent Oct 14. Letters are required for HR records but do not block payroll.',
    actions: [
      { id: 'send-reminder', label: 'Send reminder', icon: SendHorizonal },
      { id: 'reassign', label: 'Reassign', icon: UserRoundCog },
      { id: 'open-letter', label: 'Open letter', icon: FileText },
    ],
  },
]

// ── Domain column definitions ──────────────────────────────────────────────

const DOMAIN_GROUPS = [
  {
    id: 'org',
    label: 'ORG',
    subLabels: ['Manager', 'title', 'new'],
    dotCount: 3,
    health: { label: '20/20 done', status: 'success' },
  },
  {
    id: 'comp',
    label: 'COMP',
    subLabels: ['Base bonus', 'equity'],
    dotCount: 2,
    health: { label: '20/20 done', status: 'success' },
  },
  {
    id: 'benefits',
    label: 'BENEFITS',
    subLabels: ['Plan eligibility'],
    dotCount: 1,
    health: { label: '20/20 done', status: 'success' },
  },
  {
    id: 'payroll',
    label: 'PAYROLL',
    subLabels: ['Effective pay update'],
    dotCount: 1,
    health: { label: '19/20 1 queued', status: 'running' },
  },
  {
    id: 'it',
    label: 'IT',
    subLabels: ['Okta', 'GitHub', 'SaaS access'],
    dotCount: 3,
    health: { label: '2 Failed · 15 ok', status: 'error' },
  },
  {
    id: 'docs',
    label: 'DOCS',
    subLabels: ['Letter', 'e-sign'],
    dotCount: 2,
    health: { label: '5 await · 15 ok', status: 'awaiting' },
  },
  {
    id: 'external',
    label: 'EXTERNAL',
    subLabels: ['Carta', 'SaaS', 'IT'],
    dotCount: 3,
    health: { label: '19/20 1 queued', status: 'running' },
  },
  {
    id: 'monitor',
    label: 'MONITOR',
    subLabels: ['Day 30', 'Day 60'],
    dotCount: 2,
    health: { label: '0/20 20 queued', status: 'scheduled' },
  },
]

// ── Status vocabulary ──────────────────────────────────────────────────────
// success | error | drift | awaiting | running | scheduled

const STATUS_PRIORITY = { error: 5, drift: 4, awaiting: 3, running: 2, scheduled: 1, success: 0 }

function worstStatus(dots) {
  return dots.reduce((acc, d) => {
    return (STATUS_PRIORITY[d.status] ?? 0) > (STATUS_PRIORITY[acc] ?? 0) ? d.status : acc
  }, 'success')
}

// ── Mock employee data ─────────────────────────────────────────────────────

function d(id, name, status, detail) {
  return { id, name, status, detail: detail ?? null }
}

const EMPLOYEES_DATA = [
  {
    id: 'sg',
    name: 'Sara Goh',
    initials: 'SG',
    colorClass: 'bg-sky-500',
    pctChange: '+0%',
    overallStatus: 'failed',
    fromRole: 'CS Specialist · M2',
    toRole: 'Sr CS Specialist · M2',
    notes: [],
    domains: {
      org:      [d('org-1','Manager update','success'), d('org-2','Title change','success'), d('org-3','New role seeded','success')],
      comp:     [d('comp-1','Base salary update','success'), d('comp-2','Equity grant','success')],
      benefits: [d('ben-1','Plan eligibility','success')],
      payroll:  [d('pay-1','Payroll update','success')],
      it:       [d('it-1','Okta provisioning','error','Rate limit 429 — access not granted'), d('it-2','GitHub access','success'), d('it-3','SaaS access','success')],
      docs:     [d('doc-1','Promotion letter','awaiting','Unsigned — past due'), d('doc-2','e-Signature','awaiting','Awaiting signature')],
      external: [d('ext-1','Carta sync','success'), d('ext-2','SaaS external','success'), d('ext-3','IT external','success')],
      monitor:  [d('mon-1','Day-30 check-in','scheduled'), d('mon-2','Day-60 retention','scheduled')],
    },
  },
  {
    id: 'tv',
    name: 'Tomas Vargas',
    initials: 'TV',
    colorClass: 'bg-teal-600',
    pctChange: '+0%',
    overallStatus: 'failed',
    fromRole: 'CSM · IC3',
    toRole: 'Sr CSM · IC4',
    notes: [],
    domains: {
      org:      [d('org-1','Manager update','success'), d('org-2','Title change','success'), d('org-3','New role seeded','success')],
      comp:     [d('comp-1','Base salary update','success'), d('comp-2','Equity grant','success')],
      benefits: [d('ben-1','Plan eligibility','success')],
      payroll:  [d('pay-1','Payroll update','success')],
      it:       [d('it-1','Okta provisioning','error','Rate limit 429 — access not granted'), d('it-2','GitHub access','success'), d('it-3','SaaS access','success')],
      docs:     [d('doc-1','Promotion letter','awaiting','Unsigned — past due'), d('doc-2','e-Signature','awaiting')],
      external: [d('ext-1','Carta sync','success'), d('ext-2','SaaS external','success'), d('ext-3','IT external','success')],
      monitor:  [d('mon-1','Day-30 check-in','scheduled'), d('mon-2','Day-60 retention','scheduled')],
    },
  },
  {
    id: 'ml',
    name: 'Marcus Lin',
    initials: 'ML',
    colorClass: 'bg-violet-500',
    pctChange: '+28%',
    overallStatus: 'drift',
    fromRole: 'Sr CS Lead · M3',
    toRole: 'CS Manager · M4',
    notes: ['Letter unsigned · 84 overdue'],
    domains: {
      org:      [d('org-1','Manager update','success'), d('org-2','Title change','success'), d('org-3','New role seeded','success')],
      comp:     [d('comp-1','Base salary update','drift','Applied with drift — rounding applied'), d('comp-2','Equity grant','success')],
      benefits: [d('ben-1','Plan eligibility','success')],
      payroll:  [d('pay-1','Payroll update','running')],
      it:       [d('it-1','Okta provisioning','drift','Applied with drift — Supergroup rule applied'), d('it-2','GitHub access','success'), d('it-3','SaaS access','success')],
      docs:     [d('doc-1','Promotion letter','awaiting','Unsigned — 84 days overdue'), d('doc-2','e-Signature','awaiting')],
      external: [d('ext-1','Carta sync','success'), d('ext-2','SaaS external','success'), d('ext-3','IT external','success')],
      monitor:  [d('mon-1','Day-30 check-in','scheduled'), d('mon-2','Day-60 retention','scheduled')],
    },
  },
  {
    id: 'rb',
    name: 'Ruth Bakele',
    initials: 'RB',
    colorClass: 'bg-blue-700',
    pctChange: '+8%',
    overallStatus: 'clean',
    fromRole: 'CS Specialist · M2',
    toRole: 'Sr CS Specialist · M2',
    notes: [],
    domains: {
      org:      [d('org-1','Manager update','success'), d('org-2','Title change','success'), d('org-3','New role seeded','success')],
      comp:     [d('comp-1','Base salary update','success'), d('comp-2','Equity grant','success')],
      benefits: [d('ben-1','Plan eligibility','success')],
      payroll:  [d('pay-1','Payroll update','running')],
      it:       [d('it-1','Okta provisioning','success'), d('it-2','GitHub access','success'), d('it-3','SaaS access','success')],
      docs:     [d('doc-1','Promotion letter','success'), d('doc-2','e-Signature','success')],
      external: [d('ext-1','Carta sync','success'), d('ext-2','SaaS external','success'), d('ext-3','IT external','success')],
      monitor:  [d('mon-1','Day-30 check-in','scheduled'), d('mon-2','Day-60 retention','scheduled')],
    },
  },
  {
    id: 'nb',
    name: 'Noah Bergeron',
    initials: 'NB',
    colorClass: 'bg-orange-500',
    pctChange: '+18%',
    overallStatus: 'clean',
    fromRole: 'Sr CSM · IC4',
    toRole: 'CS Manager · M4',
    notes: [],
    domains: {
      org:      [d('org-1','Manager update','success'), d('org-2','Title change','success'), d('org-3','New role seeded','success')],
      comp:     [d('comp-1','Base salary update','success'), d('comp-2','Equity grant','success')],
      benefits: [d('ben-1','Plan eligibility','success')],
      payroll:  [d('pay-1','Payroll update','running')],
      it:       [d('it-1','Okta provisioning','success'), d('it-2','GitHub access','success'), d('it-3','SaaS access','success')],
      docs:     [d('doc-1','Promotion letter','success'), d('doc-2','e-Signature','success')],
      external: [d('ext-1','Carta sync','success'), d('ext-2','SaaS external','success'), d('ext-3','IT external','success')],
      monitor:  [d('mon-1','Day-30 check-in','scheduled'), d('mon-2','Day-60 retention','scheduled')],
    },
  },
  {
    id: 'ap',
    name: 'Ananya Phirke',
    initials: 'AP',
    colorClass: 'bg-sky-400',
    pctChange: '+43%',
    overallStatus: 'clean',
    fromRole: 'VP · M3',
    toRole: 'SVP · M6',
    notes: [],
    domains: {
      org:      [d('org-1','Manager update','success'), d('org-2','Title change','success'), d('org-3','New role seeded','success')],
      comp:     [d('comp-1','Base salary update','success'), d('comp-2','Equity grant','success')],
      benefits: [d('ben-1','Plan eligibility','success')],
      payroll:  [d('pay-1','Payroll update','success')],
      it:       [d('it-1','Okta provisioning','success'), d('it-2','GitHub access','success'), d('it-3','SaaS access','awaiting','Awaiting manager confirmation')],
      docs:     [d('doc-1','Promotion letter','success'), d('doc-2','e-Signature','success')],
      external: [d('ext-1','Carta sync','success'), d('ext-2','SaaS external','success'), d('ext-3','IT external','success')],
      monitor:  [d('mon-1','Day-30 check-in','scheduled'), d('mon-2','Day-60 retention','scheduled')],
    },
  },
  {
    id: 'ag',
    name: 'Andrew Gibson',
    initials: 'AG',
    colorClass: 'bg-cyan-700',
    pctChange: '+29%',
    overallStatus: 'clean',
    fromRole: 'Director · M4',
    toRole: 'VP · M5',
    notes: [],
    domains: {
      org:      [d('org-1','Manager update','success'), d('org-2','Title change','success'), d('org-3','New role seeded','success')],
      comp:     [d('comp-1','Base salary update','success'), d('comp-2','Equity grant','success')],
      benefits: [d('ben-1','Plan eligibility','success')],
      payroll:  [d('pay-1','Payroll update','success')],
      it:       [d('it-1','Okta provisioning','success'), d('it-2','GitHub access','success'), d('it-3','SaaS access','success')],
      docs:     [d('doc-1','Promotion letter','success'), d('doc-2','e-Signature','success')],
      external: [d('ext-1','Carta sync','success'), d('ext-2','SaaS external','success'), d('ext-3','IT external','success')],
      monitor:  [d('mon-1','Day-30 check-in','scheduled'), d('mon-2','Day-60 retention','scheduled')],
    },
  },
  {
    id: 'jh',
    name: 'Jasmine Hernandez',
    initials: 'JH',
    colorClass: 'bg-indigo-800',
    pctChange: '+9%',
    overallStatus: 'clean',
    fromRole: 'CSM · IC3',
    toRole: 'Sr CSM · IC4',
    notes: [],
    domains: {
      org:      [d('org-1','Manager update','success'), d('org-2','Title change','success'), d('org-3','New role seeded','success')],
      comp:     [d('comp-1','Base salary update','success'), d('comp-2','Equity grant','success')],
      benefits: [d('ben-1','Plan eligibility','success')],
      payroll:  [d('pay-1','Payroll update','awaiting','Awaiting payroll freeze confirmation')],
      it:       [d('it-1','Okta provisioning','success'), d('it-2','GitHub access','success'), d('it-3','SaaS access','success')],
      docs:     [d('doc-1','Promotion letter','success'), d('doc-2','e-Signature','awaiting','Pending final review')],
      external: [d('ext-1','Carta sync','success'), d('ext-2','SaaS external','success'), d('ext-3','IT external','success')],
      monitor:  [d('mon-1','Day-30 check-in','scheduled'), d('mon-2','Day-60 retention','scheduled')],
    },
  },
  {
    id: 'lo',
    name: 'Lev Okonkwo',
    initials: 'LO',
    colorClass: 'bg-teal-700',
    pctChange: '+4%',
    overallStatus: 'clean',
    fromRole: 'CSM',
    toRole: 'CSM · IC3',
    notes: [],
    domains: {
      org:      [d('org-1','Manager update','success'), d('org-2','Title change','success'), d('org-3','New role seeded','success')],
      comp:     [d('comp-1','Base salary update','success'), d('comp-2','Equity grant','success')],
      benefits: [d('ben-1','Plan eligibility','success')],
      payroll:  [d('pay-1','Payroll update','success')],
      it:       [d('it-1','Okta provisioning','success'), d('it-2','GitHub access','success'), d('it-3','SaaS access','success')],
      docs:     [d('doc-1','Promotion letter','success'), d('doc-2','e-Signature','success')],
      external: [d('ext-1','Carta sync','success'), d('ext-2','SaaS external','success'), d('ext-3','IT external','success')],
      monitor:  [d('mon-1','Day-30 check-in','scheduled'), d('mon-2','Day-60 retention','scheduled')],
    },
  },
  {
    id: 'pv',
    name: 'Priya Vembu',
    initials: 'PV',
    colorClass: 'bg-purple-600',
    pctChange: '+6%',
    overallStatus: 'clean',
    fromRole: 'CS Analyst · IC3',
    toRole: 'CS Analyst · IC4',
    notes: [],
    domains: {
      org:      [d('org-1','Manager update','success'), d('org-2','Title change','success'), d('org-3','New role seeded','success')],
      comp:     [d('comp-1','Base salary update','success'), d('comp-2','Equity grant','success')],
      benefits: [d('ben-1','Plan eligibility','success')],
      payroll:  [d('pay-1','Payroll update','success')],
      it:       [d('it-1','Okta provisioning','success'), d('it-2','GitHub access','success'), d('it-3','SaaS access','success')],
      docs:     [d('doc-1','Promotion letter','success'), d('doc-2','e-Signature','success')],
      external: [d('ext-1','Carta sync','success'), d('ext-2','SaaS external','success'), d('ext-3','IT external','success')],
      monitor:  [d('mon-1','Day-30 check-in','scheduled'), d('mon-2','Day-60 retention','scheduled')],
    },
  },
]

// ── Status pill definitions ────────────────────────────────────────────────

const STATUS_PILLS = [
  { id: 'success',   label: 'Succeeded',      count: 28, dotClass: 'bg-emerald-500', filterStatus: 'clean' },
  { id: 'running',   label: 'Running',         count: 3,  dotClass: 'bg-rippling-plum', filterStatus: null },
  { id: 'scheduled', label: 'Scheduled',       count: 5,  dotClass: 'border-2 border-rippling-line bg-white', filterStatus: null },
  { id: 'awaiting',  label: 'Awaiting',        count: 4,  dotClass: 'border-2 border-amber-400 bg-white', filterStatus: null },
  { id: 'failed',    label: 'Failed',          count: 2,  dotClass: 'bg-red-500', filterStatus: 'failed' },
  { id: 'skipped',   label: 'Skipped',         count: 1,  dotClass: 'bg-rippling-muted/40', filterStatus: null },
  { id: 'rereview',  label: 'Needs re-review', count: 2,  dotClass: 'bg-amber-400', filterStatus: 'drift' },
]

// ── Sub-components ─────────────────────────────────────────────────────────

function dotColorClass(status) {
  switch (status) {
    case 'success':   return 'bg-emerald-500'
    case 'error':     return 'bg-red-500'
    case 'drift':     return 'bg-amber-400'
    case 'awaiting':  return 'border-2 border-amber-400 bg-white'
    case 'running':   return 'bg-rippling-plum'
    case 'scheduled': return 'border-2 border-rippling-line bg-white'
    default:          return 'bg-rippling-muted/40'
  }
}

function TaskDot({ task }) {
  return (
    <div className="relative group/dot flex items-center justify-center">
      <div
        className={classNames(
          'w-2.5 h-2.5 rounded-full cursor-default',
          dotColorClass(task.status),
        )}
      />
      {/* Tooltip */}
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/dot:block z-50 pointer-events-none"
        style={{ minWidth: 160 }}
      >
        <div className="bg-[#1a1a1a] text-white text-[10.5px] rounded-md px-2.5 py-1.5 shadow-lg">
          <p className="font-medium leading-snug">{task.name}</p>
          {task.detail && (
            <p className="text-white/60 mt-0.5 leading-snug">{task.detail}</p>
          )}
          <p className="text-white/40 mt-0.5 capitalize">{task.status}</p>
        </div>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#1a1a1a]" />
      </div>
    </div>
  )
}

function DomainCell({ dots, groupWidth }) {
  return (
    <div
      className={classNames('flex items-center justify-around shrink-0', groupWidth)}
      style={{ paddingLeft: 8, paddingRight: 8 }}
    >
      {dots.map((dot) => (
        <TaskDot key={dot.id} task={dot} />
      ))}
    </div>
  )
}

function HealthStatusText({ status, label }) {
  return (
    <span
      className={classNames(
        'text-[10.5px] font-medium leading-none',
        status === 'success'   && 'text-emerald-600',
        status === 'error'     && 'text-red-500 font-semibold',
        status === 'awaiting'  && 'text-amber-600',
        status === 'running'   && 'text-rippling-plum',
        status === 'scheduled' && 'text-rippling-muted',
      )}
    >
      {label}
    </span>
  )
}

function EmployeeRow({ employee, sortKey }) {
  const isWorst = employee.overallStatus === 'failed'
  const isDrift  = employee.overallStatus === 'drift'

  return (
    <div
      className={classNames(
        'flex items-center border-b border-rippling-line hover:bg-rippling-surface transition-colors',
        isWorst && 'bg-red-50/20',
        isDrift && 'bg-amber-50/20',
      )}
    >
      {/* Sticky employee cell */}
      <div className="w-[240px] shrink-0 px-4 py-2.5 flex items-start gap-2.5 sticky left-0 bg-inherit z-10 border-r border-rippling-line">
        {/* Avatar */}
        <div
          className={classNames(
            'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0 mt-0.5',
            employee.colorClass,
          )}
        >
          {employee.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12px] font-medium text-rippling-ink leading-none">
              {employee.name}
            </span>
            <span className="text-[10.5px] text-rippling-muted font-medium">
              {employee.pctChange}
            </span>
            {isWorst && (
              <span className="px-1 py-px text-[9.5px] font-semibold rounded bg-red-100 text-red-600 uppercase tracking-wide leading-none">
                Failed
              </span>
            )}
            {isDrift && (
              <span className="px-1 py-px text-[9.5px] font-semibold rounded bg-amber-100 text-amber-700 uppercase tracking-wide leading-none">
                Applied drift
              </span>
            )}
          </div>
          <p className="text-[10.5px] text-rippling-muted mt-0.5 leading-snug">
            {employee.fromRole}
            <span className="mx-1 text-rippling-line">→</span>
            {employee.toRole}
          </p>
          {employee.notes.map((note, i) => (
            <p key={i} className="text-[10.5px] text-amber-600 mt-0.5 leading-snug">
              {note}
            </p>
          ))}
        </div>
      </div>

      {/* Domain cells */}
      {DOMAIN_GROUPS.map((group) => {
        const dots = employee.domains[group.id] ?? []
        const groupWorst = worstStatus(dots)
        const isSortHighlight = sortKey === group.id

        let dotCount = group.dotCount
        // pad or trim to match dotCount
        const paddedDots = [
          ...dots.slice(0, dotCount),
          ...Array.from({ length: Math.max(0, dotCount - dots.length) }, (_, i) => ({
            id: `pad-${i}`,
            name: '—',
            status: 'scheduled',
            detail: null,
          })),
        ]

        return (
          <div
            key={group.id}
            className={classNames(
              'shrink-0 flex items-center justify-around py-2.5 border-r border-rippling-line/50',
              isSortHighlight && 'bg-rippling-chip/40',
            )}
            style={{ width: group.dotCount === 1 ? 64 : group.dotCount === 2 ? 88 : 112, padding: '10px 8px' }}
          >
            {paddedDots.map((dot) => (
              <TaskDot key={dot.id} task={dot} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

function AttentionBanner() {
  return (
    <div className="bg-white rounded-lg border border-rippling-line overflow-hidden mb-3">
      <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-100">
        <AlertCircle size={12} strokeWidth={2} className="text-red-500 shrink-0" />
        <span className="text-[11.5px] font-semibold text-red-700 uppercase tracking-wide">
          Needs attention now
        </span>
        <span className="ml-1 text-[10.5px] text-red-500">Pinned to the top until resolved.</span>
      </div>
      <div className="divide-y divide-rippling-line">
        {ATTENTION_ITEMS.map((item) => {
          const isError = item.severity === 'error'
          return (
            <div key={item.id} className="px-4 py-2.5 flex items-start gap-2.5">
              <span
                className={classNames(
                  'w-2 h-2 rounded-full shrink-0 mt-1',
                  isError ? 'bg-red-500' : 'bg-amber-400',
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-rippling-ink leading-snug">{item.title}</p>
                <p className="text-[11px] text-rippling-muted mt-0.5 leading-snug">{item.description}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {item.actions.map((action) => {
                    const Icon = action.icon
                    return (
                      <button
                        key={action.id}
                        type="button"
                        className="h-5 pl-1.5 pr-2 rounded text-[11px] font-medium flex items-center gap-1 border border-rippling-line bg-white text-rippling-ink-2 hover:bg-rippling-surface-2 transition-colors"
                      >
                        <Icon size={10} strokeWidth={1.75} className="text-rippling-muted" />
                        {action.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ByEmployeeView() {
  const [activePill, setActivePill] = useState(null)
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('desc') // desc = worst first

  function handlePillClick(pillId) {
    setActivePill((prev) => (prev === pillId ? null : pillId))
  }

  function handleHeaderClick(domainId) {
    if (sortKey === domainId) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(domainId)
      setSortDir('desc')
    }
  }

  // Filter employees by active pill
  const filterStatus = activePill ? STATUS_PILLS.find((p) => p.id === activePill)?.filterStatus : null
  let visibleEmployees = filterStatus
    ? EMPLOYEES_DATA.filter((e) => e.overallStatus === filterStatus)
    : [...EMPLOYEES_DATA]

  // Sort by domain column if selected, otherwise by overall status priority
  if (sortKey) {
    visibleEmployees.sort((a, b) => {
      const aDots = a.domains[sortKey] ?? []
      const bDots = b.domains[sortKey] ?? []
      const aWorst = STATUS_PRIORITY[worstStatus(aDots)] ?? 0
      const bWorst = STATUS_PRIORITY[worstStatus(bDots)] ?? 0
      const diff = sortDir === 'desc' ? bWorst - aWorst : aWorst - bWorst
      if (diff !== 0) return diff
      return a.name.localeCompare(b.name)
    })
  } else {
    // Default: failed → drift → awaiting → running → clean
    const ORDER = { failed: 0, drift: 1, awaiting: 2, running: 3, clean: 4 }
    visibleEmployees.sort((a, b) => (ORDER[a.overallStatus] ?? 5) - (ORDER[b.overallStatus] ?? 5))
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Status summary bar */}
      <div className="bg-white border border-rippling-line rounded-lg px-4 py-2.5 mb-3 flex items-center gap-3 flex-wrap">
        <p className="text-[11.5px] text-rippling-ink-2 leading-snug shrink-0">
          <span className="font-semibold">65% landed</span>
          {' '}— 28 of 43 tasks complete. 2 Okta provisioning tasks failed and 3 promotion letters are unsigned past effective date.
        </p>
        <div className="flex items-center gap-1.5 flex-wrap ml-auto">
          {STATUS_PILLS.map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => handlePillClick(pill.id)}
              className={classNames(
                'h-6 pl-2 pr-2.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 border transition-colors',
                activePill === pill.id
                  ? 'bg-rippling-chip border-rippling-plum/30 text-rippling-plum'
                  : 'bg-white border-rippling-line text-rippling-ink-2 hover:bg-rippling-surface-2',
              )}
            >
              <span className={classNames('w-1.5 h-1.5 rounded-full', pill.dotClass)} />
              <span className="font-semibold">+{pill.count}</span>
              <span className="text-rippling-muted">{pill.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Needs attention */}
      <AttentionBanner />

      {/* Table */}
      <div className="bg-white rounded-lg border border-rippling-line overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: 240 + 112 * 4 + 88 * 2 + 64 * 2 }}>
            {/* Column group headers */}
            <div className="flex items-stretch border-b border-rippling-line bg-rippling-surface sticky top-0 z-20">
              {/* Employee header */}
              <div className="w-[240px] shrink-0 px-4 py-2 sticky left-0 bg-rippling-surface z-30 border-r border-rippling-line">
                <p className="text-[10px] font-semibold text-rippling-muted uppercase tracking-wide">
                  Employee · Promotion
                </p>
              </div>
              {DOMAIN_GROUPS.map((group) => {
                const colWidth = group.dotCount === 1 ? 64 : group.dotCount === 2 ? 88 : 112
                const isActive = sortKey === group.id
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleHeaderClick(group.id)}
                    style={{ width: colWidth }}
                    className={classNames(
                      'shrink-0 px-2 py-1.5 flex flex-col items-center gap-0.5 border-r border-rippling-line/50 hover:bg-rippling-chip/50 transition-colors',
                      isActive && 'bg-rippling-chip',
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-semibold text-rippling-muted uppercase tracking-wide">
                        {group.label}
                      </span>
                      {isActive ? (
                        sortDir === 'desc' ? (
                          <ChevronDown size={10} className="text-rippling-plum" />
                        ) : (
                          <ChevronUp size={10} className="text-rippling-plum" />
                        )
                      ) : (
                        <Minus size={8} className="text-rippling-muted/30" />
                      )}
                    </div>
                    {/* Sub-labels */}
                    <div className="flex items-center justify-around w-full gap-0.5">
                      {group.subLabels.map((sub) => (
                        <span
                          key={sub}
                          className="text-[9px] text-rippling-muted/70 leading-none truncate text-center"
                          style={{ maxWidth: colWidth / group.dotCount - 2 }}
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Integration health row */}
            <div className="flex items-center border-b border-rippling-line bg-rippling-surface/60">
              <div className="w-[240px] shrink-0 px-4 py-1.5 sticky left-0 bg-rippling-surface/60 z-10 border-r border-rippling-line">
                <p className="text-[9.5px] font-semibold text-rippling-muted uppercase tracking-wide">
                  Integration health
                </p>
                <p className="text-[9px] text-rippling-muted/70">Same data, aggregated · click any to filter ↓</p>
              </div>
              {DOMAIN_GROUPS.map((group) => {
                const colWidth = group.dotCount === 1 ? 64 : group.dotCount === 2 ? 88 : 112
                return (
                  <div
                    key={group.id}
                    style={{ width: colWidth }}
                    className="shrink-0 px-2 py-1.5 flex items-center justify-center border-r border-rippling-line/50"
                  >
                    <HealthStatusText status={group.health.status} label={group.health.label} />
                  </div>
                )
              })}
            </div>

            {/* Employee rows */}
            {visibleEmployees.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-[12.5px] text-rippling-muted">No employees match this filter.</p>
              </div>
            ) : (
              visibleEmployees.map((emp) => (
                <EmployeeRow key={emp.id} employee={emp} sortKey={sortKey} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
