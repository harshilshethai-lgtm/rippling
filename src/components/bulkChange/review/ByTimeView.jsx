import {
  AlertCircle,
  RefreshCw,
  Bell,
  ExternalLink,
  SendHorizonal,
  UserRoundCog,
  FileText,
  Users,
  DollarSign,
  Landmark,
  Shield,
  FileCheck,
  Monitor,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Circle,
} from 'lucide-react'
import { classNames } from '../../../lib/utils'

// ── Attention banner (shared) ──────────────────────────────────────────────

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

// ── Domain definitions ─────────────────────────────────────────────────────

const DOMAINS = [
  { id: 'people', label: 'People & Org', icon: Users },
  { id: 'comp', label: 'Compensation & Equity', icon: DollarSign },
  { id: 'payroll', label: 'Payroll & Tax', icon: Landmark },
  { id: 'benefits', label: 'Benefits', icon: Shield },
  { id: 'docs', label: 'Documents & Compliance', icon: FileCheck },
  { id: 'it', label: 'IT / Access', icon: Monitor },
  { id: 'external', label: 'External Systems', icon: Share2 },
]

// ── Task status vocabulary ─────────────────────────────────────────────────
// 'success' | 'error' | 'drift' | 'awaiting' | 'running' | 'scheduled' | 'warning'

// ── Mock task data ─────────────────────────────────────────────────────────

const TASKS = [
  // ── People & Org ──
  {
    id: 'manager-updates',
    domain: 'people',
    phase: 'pre',
    name: 'Manager updates queued',
    progress: '12/12',
    date: 'Oct 7',
    status: 'success',
  },
  {
    id: 'title-validation',
    domain: 'people',
    phase: 'pre',
    name: 'Title & level pre-validation',
    progress: '20/20',
    date: 'Oct 7',
    status: 'success',
  },
  {
    id: 'org-chart-cutover',
    domain: 'people',
    phase: 'on',
    name: 'Org chart cutover',
    progress: '20/20',
    date: 'Oct 15 · Oct 15',
    status: 'success',
  },
  {
    id: 'reports-to-rebuild',
    domain: 'people',
    phase: 'on',
    name: 'Reports-to graph rebuild',
    progress: '0/1',
    date: 'Oct 15 · Oct 02',
    status: 'running',
  },
  {
    id: 'okta-provisioning',
    domain: 'people',
    phase: 'on',
    name: 'Okta access – provisioning',
    progress: '15/20',
    date: 'Oct 15 · Oct 15',
    status: 'error',
    note: '2 failed on rate limit 429 (auto-retried 3×) — Sara Goh, Tomas Vargas',
    driftNote: '2 applied-with-drift',
    highlight: 'error',
  },
  {
    id: 'direct-report-transitions',
    domain: 'people',
    phase: 'post',
    name: 'Direct-report transitions',
    progress: '4/4',
    date: 'Oct 16–17',
    status: 'scheduled',
  },

  // ── Compensation & Equity ──
  {
    id: 'comp-letters',
    domain: 'comp',
    phase: 'pre',
    name: 'Comp letters generated',
    progress: '20/20',
    date: 'Oct 7',
    status: 'success',
  },
  {
    id: 'equity-grants-prepared',
    domain: 'comp',
    phase: 'pre',
    name: 'Equity grants prepared (Carta)',
    progress: '8/8',
    date: 'Oct 9',
    status: 'success',
  },
  {
    id: 'base-salary-updates',
    domain: 'comp',
    phase: 'on',
    name: 'Base salary updates',
    progress: '20/20',
    date: 'Oct 15 · Oct 08',
    status: 'drift',
    note: '1 applied-with-drift · Marcus Lin',
    highlight: 'drift',
  },
  {
    id: 'equity-grants-finalized',
    domain: 'comp',
    phase: 'on',
    name: 'Equity grants finalized',
    progress: '8/8',
    date: 'Oct 15',
    status: 'success',
  },
  {
    id: 'stock-vest',
    domain: 'comp',
    phase: 'post',
    name: 'Stock vest reconciliation',
    progress: '1/1',
    date: 'Oct 20',
    status: 'scheduled',
  },

  // ── Payroll & Tax ──
  {
    id: 'payroll-freeze',
    domain: 'payroll',
    phase: 'pre',
    name: 'Pay-period freeze check',
    progress: '0/1',
    date: 'Oct 15',
    status: 'running',
  },
  {
    id: 'payroll-rerun',
    domain: 'payroll',
    phase: 'on',
    name: 'Payroll re-run · Oct 31 cycle',
    progress: '15/20',
    date: 'Oct 15 · Oct 08',
    status: 'running',
  },
  {
    id: 'ytd-trueup',
    domain: 'payroll',
    phase: 'post',
    name: 'Year-to-date true-up',
    progress: '1/1',
    date: 'Oct 31',
    status: 'scheduled',
    note: 'waits on T+8 payroll',
  },

  // ── Benefits ──
  {
    id: 'plan-eligibility',
    domain: 'benefits',
    phase: 'pre',
    name: 'Plan eligibility recomputed',
    progress: '20/20',
    date: 'Oct 6',
    status: 'success',
  },
  {
    id: 'benefit-plan-changes',
    domain: 'benefits',
    phase: 'on',
    name: 'Benefit plan changes posted',
    progress: '4/20',
    date: 'Oct 15 · Oct 08',
    status: 'running',
  },

  // ── Documents & Compliance ──
  {
    id: 'promo-letters-sent',
    domain: 'docs',
    phase: 'pre',
    name: 'Promotion letters sent',
    progress: '20/20',
    date: 'Oct 7',
    status: 'success',
  },
  {
    id: 'reminder-17-signed',
    domain: 'docs',
    phase: 'pre',
    name: 'Reminder · 17 signed',
    progress: '17/17',
    date: 'Oct 14',
    status: 'success',
  },
  {
    id: 'letters-awaiting',
    domain: 'docs',
    phase: 'on',
    name: 'Letters – awaiting signature',
    progress: '3/20',
    date: 'Past due 8d',
    status: 'warning',
    note: 'Marcus Lin, Sara Goh, Tomas Vargas',
    highlight: 'warning',
  },
  {
    id: 'signed-letters-vault',
    domain: 'docs',
    phase: 'post',
    name: 'Signed letters → HR vault',
    progress: '20/20',
    date: 'Auto on signature',
    status: 'scheduled',
    note: 'waits on T+5 signature',
  },

  // ── IT / Access ──
  {
    id: 'saas-pre-staging',
    domain: 'it',
    phase: 'pre',
    name: 'SaaS access pre-staging',
    progress: '20/20',
    date: 'Oct 12',
    status: 'success',
  },
  {
    id: 'github-teams',
    domain: 'it',
    phase: 'on',
    name: 'GitHub team assignments',
    progress: '16/20',
    date: 'Oct 15',
    status: 'running',
  },
  {
    id: 'slack-sync',
    domain: 'it',
    phase: 'on',
    name: 'Slack workspace sync',
    progress: '20/20',
    date: 'Oct 15',
    status: 'success',
  },
  {
    id: 'looker-access',
    domain: 'it',
    phase: 'post',
    name: 'Looker access refresh',
    progress: '20/20',
    date: 'Oct 16',
    status: 'scheduled',
  },

  // ── External Systems ──
  {
    id: 'carta-equity-sync',
    domain: 'external',
    phase: 'pre',
    name: 'Carta equity sync',
    progress: '8/8',
    date: 'Oct 9',
    status: 'success',
  },
  {
    id: 'salesforce-update',
    domain: 'external',
    phase: 'on',
    name: 'Salesforce contact update',
    progress: '20/20',
    date: 'Oct 15',
    status: 'success',
  },
  {
    id: 'carta-grant-cycle',
    domain: 'external',
    phase: 'on',
    name: 'Carta grant cycle',
    progress: '0/8',
    date: 'Oct 15',
    status: 'running',
    note: 'Grant cycle in progress',
    highlight: 'warning',
  },
  {
    id: 'carta-vesting',
    domain: 'external',
    phase: 'post',
    name: 'Carta vesting schedule',
    progress: '8/8',
    date: 'Oct 20',
    status: 'scheduled',
  },
]

// ── Sub-components ─────────────────────────────────────────────────────────

function taskDotIcon(status) {
  switch (status) {
    case 'success':
      return <CheckCircle2 size={12} strokeWidth={2.5} className="text-emerald-500" />
    case 'error':
      return <AlertCircle size={12} strokeWidth={2} className="text-red-500" />
    case 'warning':
      return <AlertTriangle size={11} strokeWidth={2} className="text-amber-500" />
    case 'drift':
      return (
        <div className="w-3 h-3 rounded-full bg-amber-400 flex items-center justify-center">
          <span className="text-white text-[7px] font-bold leading-none">~</span>
        </div>
      )
    case 'running':
      return <Clock size={11} strokeWidth={2} className="text-rippling-plum" />
    case 'awaiting':
      return <Circle size={11} strokeWidth={2} className="text-amber-400" />
    case 'scheduled':
      return <Circle size={11} strokeWidth={1.5} className="text-rippling-muted/40" />
    default:
      return <Circle size={11} strokeWidth={1.5} className="text-rippling-muted/40" />
  }
}

function TaskCard({ task, onNavigate }) {
  const hasIssue = task.highlight === 'error' || task.highlight === 'warning' || task.highlight === 'drift'

  return (
    <button
      type="button"
      onClick={() => onNavigate?.()}
      className={classNames(
        'w-full text-left rounded-md border px-3 py-2 mb-1.5 last:mb-0 transition-colors group',
        'hover:shadow-rippling-card',
        hasIssue && task.highlight === 'error'   && 'border-red-200 bg-red-50/40 hover:bg-red-50/70',
        hasIssue && task.highlight === 'warning' && 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/70',
        hasIssue && task.highlight === 'drift'   && 'border-amber-100 bg-amber-50/30 hover:bg-amber-50/60',
        !hasIssue && 'border-rippling-line bg-white hover:bg-rippling-surface',
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">{taskDotIcon(task.status)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11.5px] font-medium text-rippling-ink leading-snug group-hover:text-rippling-plum transition-colors">
            {task.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span
              className={classNames(
                'text-[11px] font-semibold tabular-nums',
                task.status === 'error'   && 'text-red-500',
                task.status === 'warning' && 'text-amber-600',
                task.status === 'drift'   && 'text-amber-600',
                task.status === 'running' && 'text-rippling-plum',
                task.status === 'success' && 'text-emerald-600',
                (task.status === 'scheduled' || task.status === 'awaiting') && 'text-rippling-muted',
              )}
            >
              {task.progress}
            </span>
            <span className="text-[10.5px] text-rippling-muted">{task.date}</span>
          </div>
          {task.note && (
            <p
              className={classNames(
                'text-[10.5px] mt-0.5 leading-snug',
                task.highlight === 'error'   && 'text-red-500',
                task.highlight === 'warning' && 'text-amber-600',
                task.highlight === 'drift'   && 'text-amber-600',
                !task.highlight && 'text-rippling-muted',
              )}
            >
              {task.note}
            </p>
          )}
          {task.driftNote && (
            <p className="text-[10.5px] text-amber-600 mt-0.5 leading-snug">
              {task.driftNote}
            </p>
          )}
        </div>
      </div>
    </button>
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

const PHASES = [
  {
    id: 'pre',
    label: 'Pre-effective',
    dateRange: 'Oct 1 – Oct 14',
    chip: 'FACT',
    chipClass: 'bg-rippling-chip text-rippling-ink-2',
    headerClass: 'bg-white border-rippling-line',
    colClass: 'bg-white',
  },
  {
    id: 'on',
    label: 'On-effective',
    dateRange: 'Oct 15',
    chip: 'NOW  16:33 PT',
    chipClass: 'bg-amber-100 text-amber-700 font-semibold',
    headerClass: 'bg-amber-50/60 border-amber-200',
    colClass: 'bg-amber-50/20',
    nowBorder: true,
  },
  {
    id: 'post',
    label: 'Post-effective',
    dateRange: 'Oct 16 →',
    chip: 'FORECAST',
    chipClass: 'bg-rippling-surface-2 text-rippling-muted',
    headerClass: 'bg-rippling-surface/50 border-rippling-line',
    colClass: 'bg-rippling-surface/40',
  },
]

export default function ByTimeView({ onNavigateToFollowups }) {
  return (
    <div className="flex flex-col gap-0">
      {/* Status summary bar */}
      <div className="bg-white border border-rippling-line rounded-lg px-4 py-2.5 mb-3 flex items-center gap-3 flex-wrap">
        <p className="text-[11.5px] text-rippling-ink-2 leading-snug">
          <span className="font-semibold">65% landed</span>
          {' '}— 28 of 43 tasks complete. 2 Okta provisioning tasks failed and 3 promotion letters are unsigned past effective date. The 2 drift items from the watch phase have executed.
        </p>
        <div className="flex items-center gap-1.5 flex-wrap ml-auto">
          {[
            { label: '+28 Succeeded', dot: 'bg-emerald-500' },
            { label: '+3 Running', dot: 'bg-rippling-plum' },
            { label: '+5 Scheduled', dot: 'border-2 border-rippling-line bg-white' },
            { label: '+4 Awaiting', dot: 'border-2 border-amber-400 bg-white' },
            { label: '+2 Failed', dot: 'bg-red-500' },
            { label: '+1 Skipped', dot: 'bg-rippling-muted/40' },
            { label: '+2 Needs re-review', dot: 'bg-amber-400' },
          ].map((p) => (
            <div
              key={p.label}
              className="h-6 pl-2 pr-2.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 border border-rippling-line bg-white text-rippling-ink-2"
            >
              <span className={classNames('w-1.5 h-1.5 rounded-full', p.dot)} />
              {p.label}
            </div>
          ))}
        </div>
      </div>

      {/* Needs attention */}
      <AttentionBanner />

      {/* Time grid */}
      <div className="bg-white rounded-lg border border-rippling-line overflow-hidden">
        {/* Phase column headers */}
        <div className="grid border-b border-rippling-line" style={{ gridTemplateColumns: '160px 1fr 1fr 1fr' }}>
          {/* Domain label header */}
          <div className="px-4 py-2.5 border-r border-rippling-line bg-rippling-surface/50">
            <p className="text-[10px] font-semibold text-rippling-muted uppercase tracking-wide">Domain</p>
          </div>
          {PHASES.map((phase) => (
            <div
              key={phase.id}
              className={classNames(
                'px-4 py-2.5 border-r border-rippling-line last:border-r-0',
                phase.headerClass,
                phase.nowBorder && 'border-t-2 border-t-amber-400',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11.5px] font-semibold text-rippling-ink-2 leading-none">{phase.label}</p>
                  <p className="text-[10.5px] text-rippling-muted mt-0.5">{phase.dateRange}</p>
                </div>
                <span
                  className={classNames(
                    'text-[9.5px] font-semibold px-1.5 py-0.5 rounded leading-none',
                    phase.chipClass,
                  )}
                >
                  {phase.chip}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Domain rows */}
        {DOMAINS.map((domain, domainIdx) => {
          const Icon = domain.icon
          return (
            <div
              key={domain.id}
              className={classNames(
                'grid border-b border-rippling-line last:border-b-0',
                domainIdx % 2 === 0 ? '' : 'bg-rippling-surface/20',
              )}
              style={{ gridTemplateColumns: '160px 1fr 1fr 1fr' }}
            >
              {/* Domain label */}
              <div className="px-4 py-3 border-r border-rippling-line flex items-start gap-2 sticky left-0 bg-inherit">
                <div className="w-5 h-5 rounded bg-rippling-chip flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={11} strokeWidth={1.75} className="text-rippling-plum" />
                </div>
                <p className="text-[11.5px] font-medium text-rippling-ink-2 leading-snug">{domain.label}</p>
              </div>

              {/* Phase cells */}
              {PHASES.map((phase) => {
                const phaseTasks = TASKS.filter(
                  (t) => t.domain === domain.id && t.phase === phase.id,
                )
                return (
                  <div
                    key={phase.id}
                    className={classNames(
                      'px-3 py-2.5 border-r border-rippling-line last:border-r-0 min-h-[64px]',
                      phase.colClass,
                    )}
                  >
                    {phaseTasks.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-[10px] text-rippling-muted/40">—</span>
                      </div>
                    ) : (
                      phaseTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onNavigate={onNavigateToFollowups}
                        />
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
