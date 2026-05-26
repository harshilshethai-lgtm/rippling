import { useState } from 'react'
import {
  AlertCircle,
  RefreshCw,
  Bell,
  ExternalLink,
  SendHorizonal,
  UserRoundCog,
  FileText,
  CheckCircle2,
  Circle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Award,
  GitBranch,
  Shield,
  Mail,
} from 'lucide-react'
import { classNames } from '../../../lib/utils'
import ByEmployeeView from './ByEmployeeView'
import ByTimeView from './ByTimeView'

// ── Mock data ──────────────────────────────────────────────────────────────

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

const STAT_TILES = [
  {
    id: 'tasks-landed',
    value: '65%',
    label: 'Tasks landed',
    sub: '28 of 43 complete',
    color: null,
  },
  {
    id: 'need-attention',
    value: '6',
    label: 'Need attention',
    sub: '2 failed Okta · 3 letters unsigned',
    color: 'red',
  },
  {
    id: 'applied-with-drift',
    value: '2',
    label: 'Applied with drift',
    sub: 'Marcus Lin · Sara Goh · audit fact',
    color: 'yellow',
    badge: true,
  },
  {
    id: 'employees-promoted',
    value: null, // derived from props
    label: 'Employees promoted',
    sub: 'From 5 levels — M2 → SVP',
    color: null,
  },
  {
    id: 'annual-uplift',
    value: '$342K',
    label: 'Annual uplift',
    sub: '+12.8% on cohort base',
    color: null,
  },
]

const IMPLICATION_ITEMS = [
  {
    id: 'promotions',
    icon: TrendingUp,
    value: '20',
    label: 'promotions',
    detail: 'Across 5 levels: M2 → SVP',
  },
  {
    id: 'uplift',
    icon: DollarSign,
    value: '$342K',
    label: 'annual uplift',
    detail: '+12.8% on cohort base · 1 over policy band',
    detailColor: 'warning',
  },
  {
    id: 'grants',
    icon: Award,
    value: '8',
    label: 'new grants',
    detail: 'Via Carta · grant cycle in progress',
    detailColor: 'warning',
  },
  {
    id: 'reporting',
    icon: GitBranch,
    value: '4',
    label: 'reporting changes',
    detail: '3 new managers · 1 new direct chain',
  },
  {
    id: 'access',
    icon: Shield,
    value: '15',
    label: 'access updates',
    detail: 'Okta scope · Salesforce · GitHub · Looker',
  },
  {
    id: 'letters',
    icon: Mail,
    value: '20',
    label: 'letters',
    detail: '17 signed · 3 unsigned past due',
    detailColor: 'error',
  },
]

const INTEGRATION_HEALTH = [
  { id: 'hris', name: 'HRIS', status: 'success', detail: '20/20 succeeded' },
  { id: 'payroll', name: 'Payroll', status: 'running', detail: '16/20 · 1 running' },
  { id: 'okta', name: 'Okta', status: 'error', detail: 'rate limit 429' },
  { id: 'slack', name: 'Slack', status: 'success', detail: '20/20 succeeded' },
  { id: 'salesforce', name: 'Salesforce', status: 'success', detail: '20/20 succeeded' },
  { id: 'github', name: 'GitHub', status: 'success', detail: '16/16 succeeded' },
  { id: 'looker', name: 'Looker', status: 'success', detail: '20/20 succeeded' },
  { id: 'carta', name: 'Carta', status: 'running', detail: 'Grant cycle in progress' },
]

// Past milestones (index < 2) are solid/completed; index 2 is warning; rest are future
const TIMELINE_MILESTONES = [
  {
    id: 'committed',
    label: 'Committed',
    date: 'Oct 3',
    sub: '20 employees · 4 fields',
    state: 'done',
  },
  {
    id: 'effective',
    label: 'Effective date',
    date: 'Oct 15',
    sub: 'All calls placed',
    state: 'done',
    derived: true, // will be overridden by effectiveDateTime
  },
  {
    id: 'letters-due',
    label: 'Letters due',
    date: 'Oct 19',
    sub: '3 still unsigned',
    state: 'warning',
  },
  {
    id: 'payroll-cutoff',
    label: 'Payroll cutoff',
    date: 'Oct 30',
    sub: 'YTD roll-up queued',
    state: 'future',
  },
  {
    id: 'day-30',
    label: 'Day-30 check-in',
    date: 'Nov 14',
    sub: '25 monitoring tasks',
    state: 'future',
  },
  {
    id: 'day-60',
    label: 'Day-60 retention',
    date: 'Dec 14',
    sub: '20 monitoring tasks',
    state: 'future',
  },
]

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusDot({ status, size = 'sm' }) {
  const base = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'
  return (
    <span
      className={classNames(
        base,
        'rounded-full shrink-0',
        status === 'success' && 'bg-emerald-500',
        status === 'error' && 'bg-red-500',
        status === 'running' && 'bg-amber-400',
        status === 'warning' && 'bg-amber-400',
      )}
    />
  )
}

function AttentionRow({ item }) {
  const isError = item.severity === 'error'
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2.5">
        <span
          className={classNames(
            'w-2.5 h-2.5 rounded-full shrink-0 mt-[3px]',
            isError ? 'bg-red-500' : 'bg-amber-400',
          )}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-medium text-rippling-ink leading-snug">{item.title}</p>
          <p className="text-[11.5px] text-rippling-muted mt-0.5 leading-snug">{item.description}</p>
          <div className="flex items-center gap-2 mt-2">
            {item.actions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  type="button"
                  className="h-6 pl-2 pr-2.5 rounded text-[11.5px] font-medium flex items-center gap-1.5 border border-rippling-line bg-white text-rippling-ink-2 hover:bg-rippling-surface-2 transition-colors"
                >
                  <Icon size={11} strokeWidth={1.75} className="text-rippling-muted" />
                  {action.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatTile({ tile, employeeCount }) {
  const value = tile.id === 'employees-promoted' ? employeeCount : tile.value

  return (
    <div
      className={classNames(
        'flex-1 min-w-0 bg-white rounded-lg border px-4 py-3.5 flex flex-col gap-0.5',
        tile.color === 'red'
          ? 'border-red-200 bg-red-50/30'
          : tile.color === 'yellow'
            ? 'border-amber-200 bg-amber-50/30'
            : 'border-rippling-line',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={classNames(
            'text-[22px] font-semibold leading-none tabular-nums',
            tile.color === 'red' && 'text-red-600',
            tile.color === 'yellow' && 'text-amber-600',
            !tile.color && 'text-rippling-ink',
          )}
        >
          {value}
        </span>
        {tile.badge && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 leading-none">
            drift
          </span>
        )}
      </div>
      <p className="text-[12px] font-medium text-rippling-ink-2 leading-snug">{tile.label}</p>
      <p className="text-[11px] text-rippling-muted leading-snug">{tile.sub}</p>
    </div>
  )
}

function ImplicationCard({ item }) {
  const Icon = item.icon
  return (
    <div className="flex items-start gap-3 py-3 border-b border-rippling-line last:border-0">
      <div className="w-7 h-7 rounded-md bg-rippling-chip flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} strokeWidth={1.75} className="text-rippling-plum" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1">
          <span className="text-[14px] font-semibold text-rippling-ink tabular-nums">
            {item.value}
          </span>
          <span className="text-[12.5px] text-rippling-ink-2">{item.label}</span>
        </div>
        <p
          className={classNames(
            'text-[11.5px] mt-0.5 leading-snug',
            item.detailColor === 'warning' && 'text-amber-600',
            item.detailColor === 'error' && 'text-red-500',
            !item.detailColor && 'text-rippling-muted',
          )}
        >
          {item.detail}
        </p>
      </div>
    </div>
  )
}

function IntegrationRow({ item }) {
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-rippling-line last:border-0">
      <StatusDot status={item.status} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-rippling-ink leading-none">{item.name}</p>
        <p
          className={classNames(
            'text-[11px] mt-0.5 leading-snug',
            item.status === 'error' && 'text-red-500',
            item.status === 'running' && 'text-amber-600',
            item.status === 'success' && 'text-rippling-muted',
          )}
        >
          {item.detail}
        </p>
      </div>
    </div>
  )
}

function TimelineDot({ state }) {
  if (state === 'done') {
    return (
      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
        <CheckCircle2 size={14} strokeWidth={2.5} className="text-white" />
      </div>
    )
  }
  if (state === 'warning') {
    return (
      <div className="w-7 h-7 rounded-full bg-white border-2 border-amber-400 flex items-center justify-center shrink-0">
        <AlertTriangle size={12} strokeWidth={2} className="text-amber-500" />
      </div>
    )
  }
  return (
    <div className="w-7 h-7 rounded-full bg-white border-2 border-rippling-line flex items-center justify-center shrink-0">
      <Circle size={10} strokeWidth={1.5} className="text-rippling-muted/50" />
    </div>
  )
}

function ExecutionTimeline({ effectiveDateTime }) {
  const milestones = TIMELINE_MILESTONES.map((m) => {
    if (m.derived && effectiveDateTime?.date) {
      const d = new Date(effectiveDateTime.date + 'T00:00:00')
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return { ...m, date: label }
    }
    return m
  })

  return (
    <div className="bg-white rounded-lg border border-rippling-line p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-semibold text-rippling-ink uppercase tracking-wide">
          Execution timeline
        </p>
        <p className="text-[11px] text-rippling-muted">
          Past milestones solid · Forecast hollow
        </p>
      </div>

      {/* Track */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute top-3.5 left-3.5 right-3.5 h-px bg-rippling-line" aria-hidden />

        <ol className="relative flex items-start justify-between gap-2">
          {milestones.map((m) => (
            <li key={m.id} className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <TimelineDot state={m.state} />
              <div className="flex flex-col items-center text-center gap-0.5 min-w-0 w-full">
                <p
                  className={classNames(
                    'text-[11.5px] font-medium leading-snug',
                    m.state === 'done' && 'text-rippling-ink-2',
                    m.state === 'warning' && 'text-amber-600',
                    m.state === 'future' && 'text-rippling-muted',
                  )}
                >
                  {m.label}
                </p>
                <p
                  className={classNames(
                    'text-[11px] font-semibold tabular-nums',
                    m.state === 'done' && 'text-rippling-ink',
                    m.state === 'warning' && 'text-amber-600',
                    m.state === 'future' && 'text-rippling-muted',
                  )}
                >
                  {m.date}
                </p>
                <p className="text-[10.5px] text-rippling-muted leading-snug px-1">{m.sub}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function SummaryView({ selectedEmployeeIds, effectiveDateTime }) {
  const employeeCount = selectedEmployeeIds?.length ?? 20

  return (
    <div className="flex flex-col gap-4">
      {/* Needs attention now */}
      <div className="bg-white rounded-lg border border-rippling-line overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-b border-red-100">
          <AlertCircle size={13} strokeWidth={2} className="text-red-500 shrink-0" />
          <span className="text-[12px] font-semibold text-red-700 uppercase tracking-wide">
            Needs attention now
          </span>
          <span className="ml-1 text-[10.5px] text-red-500 font-normal">
            Pinned to the top until resolved.
          </span>
        </div>
        <div className="divide-y divide-rippling-line">
          {ATTENTION_ITEMS.map((item) => (
            <div key={item.id} className="px-4 py-3">
              <AttentionRow item={item} />
            </div>
          ))}
        </div>
      </div>

      {/* Stats tiles */}
      <div className="flex gap-3">
        {STAT_TILES.map((tile) => (
          <StatTile key={tile.id} tile={tile} employeeCount={employeeCount} />
        ))}
      </div>

      {/* Implications + Integration health */}
      <div className="flex gap-4 items-start">
        {/* Implications */}
        <div className="flex-[2] min-w-0 bg-white rounded-lg border border-rippling-line overflow-hidden">
          <div className="px-4 py-2.5 border-b border-rippling-line flex items-center gap-2">
            <span className="text-[12px] font-semibold text-rippling-ink uppercase tracking-wide">
              Implications
            </span>
            <span className="text-rippling-muted text-[12px]">|</span>
            <span className="text-[12px] text-rippling-muted">
              What this change is doing for the org
            </span>
          </div>
          <div className="px-4 grid grid-cols-2 gap-x-6">
            {IMPLICATION_ITEMS.map((item) => (
              <ImplicationCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Integration health */}
        <div className="flex-[1] min-w-0 bg-white rounded-lg border border-rippling-line overflow-hidden">
          <div className="px-4 py-2.5 border-b border-rippling-line flex items-center gap-2">
            <span className="text-[12px] font-semibold text-rippling-ink uppercase tracking-wide">
              Integration health
            </span>
            <span className="text-rippling-muted text-[12px]">|</span>
            <span className="text-[11.5px] text-rippling-muted">
              Per-system roll-up of the employee matrix
            </span>
          </div>
          <div className="px-4 grid grid-cols-2 gap-x-4">
            {INTEGRATION_HEALTH.map((item) => (
              <IntegrationRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Execution timeline */}
      <ExecutionTimeline effectiveDateTime={effectiveDateTime} />
    </div>
  )
}


// ── Legend ─────────────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { color: 'bg-emerald-500', label: 'Executed' },
  { color: 'bg-rippling-plum', label: 'Running' },
  { color: 'border-2 border-rippling-line bg-white', label: 'Scheduled' },
  { color: 'border-2 border-amber-400 bg-white', label: 'Awaiting human' },
  { color: 'bg-red-500', label: 'Failed' },
  { color: 'bg-amber-400', label: 'Applied-with-drift' },
]

// ── Main export ────────────────────────────────────────────────────────────

const SUBVIEWS = [
  { id: 'summary', label: 'Summary' },
  { id: 'byEmployee', label: 'By employee' },
  { id: 'byTime', label: 'By time' },
]

export default function ReviewApplyStep({
  selectedFieldKeys = [],
  selectedEmployeeIds = [],
  bulkValues = {},
  effectiveDateTime,
  worklistName,
  manualPeople,
  onNavigateToFollowups,
}) {
  const [activeSubview, setActiveSubview] = useState('summary')

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-rippling-surface">
      {/* Sub-nav bar */}
      <div className="shrink-0 bg-white border-b border-rippling-line px-5 flex items-center justify-between h-10">
        {/* Toggle tabs */}
        <div className="flex items-center gap-0.5">
          {SUBVIEWS.map((sv) => (
            <button
              key={sv.id}
              type="button"
              onClick={() => setActiveSubview(sv.id)}
              className={classNames(
                'h-7 px-3 rounded-md text-[12.5px] font-medium transition-colors',
                activeSubview === sv.id
                  ? 'bg-rippling-chip text-rippling-plum'
                  : 'text-rippling-muted hover:text-rippling-ink-2 hover:bg-rippling-surface-2',
              )}
            >
              {sv.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3">
          {LEGEND_ITEMS.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={classNames('w-2 h-2 rounded-full', l.color)} />
              <span className="text-[11px] text-rippling-muted">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-6 py-5">
          {activeSubview === 'summary' && (
            <SummaryView
              selectedEmployeeIds={selectedEmployeeIds}
              effectiveDateTime={effectiveDateTime}
            />
          )}
          {activeSubview === 'byEmployee' && <ByEmployeeView />}
          {activeSubview === 'byTime' && (
            <ByTimeView onNavigateToFollowups={onNavigateToFollowups} />
          )}
        </div>
      </div>
    </div>
  )
}
