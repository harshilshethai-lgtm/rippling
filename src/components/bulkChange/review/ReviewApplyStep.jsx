import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Circle,
  DollarSign,
  GitBranch,
  Mail,
  Shield,
  TrendingUp,
} from 'lucide-react'
import { classNames } from '../../../lib/utils'
import { buildReviewApplyData, isTitleOnlyChange } from './buildReviewApplyData'
import {
  AllSystemsGoBanner,
  AttentionSection,
  LEGEND_ITEMS,
  StatusSummaryBar,
} from './reviewUi'
import ByEmployeeView from './ByEmployeeView'
import ByTimeView from './ByTimeView'

const IMPLICATION_ICONS = {
  trending: TrendingUp,
  dollar: DollarSign,
  award: Award,
  branch: GitBranch,
  shield: Shield,
  mail: Mail,
}

function StatusDot({ status }) {
  return (
    <span
      className={classNames(
        'w-2 h-2 rounded-full shrink-0',
        status === 'success' && 'bg-emerald-500',
        status === 'error' && 'bg-red-500',
        status === 'running' && 'bg-amber-400',
        status === 'warning' && 'bg-amber-400',
      )}
    />
  )
}

function StatTile({ tile }) {
  return (
    <div
      className={classNames(
        'flex-1 min-w-[140px] bg-white rounded-lg border px-4 py-3.5 flex flex-col gap-0.5 shadow-rippling-card',
        tile.tone === 'red' && 'border-red-200 bg-red-50/30',
        tile.tone === 'yellow' && 'border-amber-200 bg-amber-50/30',
        tile.tone === 'green' && 'border-emerald-200 bg-emerald-50/20',
        !tile.tone && 'border-rippling-line',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={classNames(
            'text-[22px] font-semibold leading-none tabular-nums',
            tile.tone === 'red' && 'text-red-600',
            tile.tone === 'yellow' && 'text-amber-600',
            tile.tone === 'green' && 'text-emerald-600',
            !tile.tone && 'text-rippling-ink',
          )}
        >
          {tile.value}
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
  const Icon = IMPLICATION_ICONS[item.iconKey] ?? TrendingUp
  return (
    <div className="flex items-start gap-3 py-3 border-b border-rippling-line last:border-0">
      <div className="w-7 h-7 rounded-md bg-rippling-chip flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} strokeWidth={1.75} className="text-rippling-plum" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1">
          <span className="text-[14px] font-semibold text-rippling-ink tabular-nums">{item.value}</span>
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

function ExecutionTimeline({ milestones }) {
  return (
    <div className="bg-white rounded-lg border border-rippling-line p-5 shadow-rippling-card">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-semibold text-rippling-ink uppercase tracking-wide">
          Execution timeline
        </p>
        <p className="text-[11px] text-rippling-muted">Past milestones solid · Forecast hollow</p>
      </div>
      <div className="relative">
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

function SummaryView({ data }) {
  const { statTiles, implications, integrationHealth, timeline, attentionItems, scenario } = data
  const tiles = [
    {
      id: 'landed',
      value: `${statTiles.landedPct}%`,
      label: 'Tasks landed',
      sub: `${statTiles.complete} of ${statTiles.total} complete`,
      tone: scenario === 'happy' ? 'green' : null,
    },
    {
      id: 'attention',
      value: String(statTiles.needAttention),
      label: 'Need attention',
      sub:
        scenario === 'happy'
          ? 'Nothing blocked'
          : attentionItems.map((a) => a.title.split('–')[0].trim()).join(' · '),
      tone: statTiles.needAttention > 0 ? 'red' : 'green',
    },
    {
      id: 'drift',
      value: String(statTiles.driftCount),
      label: 'Applied with drift',
      sub: statTiles.driftCount > 0 ? 'See employee matrix' : 'None detected',
      tone: statTiles.driftCount > 0 ? 'yellow' : 'green',
      badge: statTiles.driftCount > 0,
    },
    {
      id: 'employees',
      value: String(statTiles.employeeCount),
      label: statTiles.changeLabel,
      sub: isTitleOnlyChange(data.selectedFieldKeys)
        ? 'Title field only · HR + Finance follow-ups'
        : `${data.selectedFieldKeys.length} fields in change set`,
      tone: null,
    },
    ...(implications.find((i) => i.id === 'uplift')
      ? [
          {
            id: 'uplift',
            value: implications.find((i) => i.id === 'uplift').value,
            label: 'Annual uplift',
            sub: implications.find((i) => i.id === 'uplift').detail,
            tone: scenario === 'happy' ? 'green' : null,
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-4">
      {scenario === 'happy' ? <AllSystemsGoBanner /> : <AttentionSection items={attentionItems} />}

      <div className="flex gap-3 flex-wrap">
        {tiles.map((tile) => (
          <StatTile key={tile.id} tile={tile} />
        ))}
      </div>

      <div className="flex gap-4 items-start flex-col lg:flex-row">
        <div className="flex-[2] min-w-0 w-full bg-white rounded-lg border border-rippling-line overflow-hidden shadow-rippling-card">
          <div className="px-4 py-2.5 border-b border-rippling-line flex items-center gap-2">
            <span className="text-[12px] font-semibold text-rippling-ink uppercase tracking-wide">
              Implications
            </span>
            <span className="text-rippling-muted text-[12px]">|</span>
            <span className="text-[12px] text-rippling-muted">What this change is doing for the org</span>
          </div>
          <div className="px-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {implications.length === 0 ? (
              <p className="py-6 text-[12px] text-rippling-muted col-span-2">
                No org-wide implications modeled for the selected fields.
              </p>
            ) : (
              implications.map((item) => <ImplicationCard key={item.id} item={item} />)
            )}
          </div>
        </div>

        <div className="flex-[1] min-w-0 w-full bg-white rounded-lg border border-rippling-line overflow-hidden shadow-rippling-card">
          <div className="px-4 py-2.5 border-b border-rippling-line flex items-center gap-2">
            <span className="text-[12px] font-semibold text-rippling-ink uppercase tracking-wide">
              Integration health
            </span>
            <span className="text-rippling-muted text-[12px]">|</span>
            <span className="text-[11.5px] text-rippling-muted">Per-system roll-up</span>
          </div>
          <div className="px-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            {integrationHealth.map((item) => (
              <IntegrationRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>

      <ExecutionTimeline milestones={timeline} />
    </div>
  )
}

const SUBVIEWS = [
  { id: 'summary', label: 'Summary' },
  { id: 'byEmployee', label: 'By employee' },
  { id: 'byTime', label: 'By time' },
]

export default function ReviewApplyStep({
  selectedFieldKeys = [],
  selectedEmployeeIds = [],
  bulkValues = {},
  cellOverrides = {},
  uniformByField = {},
  tasksByDepartment = {},
  effectiveDateTime,
  worklistName,
  onNavigateToFollowups,
}) {
  const [activeSubview, setActiveSubview] = useState('summary')

  const reviewData = useMemo(
    () =>
      buildReviewApplyData({
        selectedEmployeeIds,
        selectedFieldKeys,
        bulkValues,
        cellOverrides,
        uniformByField,
        tasksByDepartment,
        effectiveDateTime,
        worklistName,
      }),
    [
      selectedEmployeeIds,
      selectedFieldKeys,
      bulkValues,
      cellOverrides,
      uniformByField,
      tasksByDepartment,
      effectiveDateTime,
      worklistName,
    ],
  )

  if (reviewData.employees.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-rippling-surface px-6">
        <div className="text-center max-w-md">
          <p className="text-[15px] font-semibold text-rippling-ink">No employees in this worklist</p>
          <p className="text-[13px] text-rippling-muted mt-2 leading-relaxed">
            Go back to Select people and add employees, then complete Make changes and Follow ups before
            reviewing execution status.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-rippling-surface">
      <div className="shrink-0 bg-white border-b border-rippling-line px-5 flex items-center justify-between h-10">
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
        <div className="hidden md:flex items-center gap-3">
          {LEGEND_ITEMS.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={classNames('w-2 h-2 rounded-full', l.color)} />
              <span className="text-[11px] text-rippling-muted">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1280px] mx-auto px-6 py-5">
          <StatusSummaryBar data={reviewData} />

          {activeSubview === 'summary' && <SummaryView data={reviewData} />}
          {activeSubview === 'byEmployee' && <ByEmployeeView data={reviewData} />}
          {activeSubview === 'byTime' && (
            <ByTimeView data={reviewData} onNavigateToFollowups={onNavigateToFollowups} />
          )}
        </div>
      </div>
    </div>
  )
}
