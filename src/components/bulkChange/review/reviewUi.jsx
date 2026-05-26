import {
  AlertCircle,
  RefreshCw,
  Bell,
  ExternalLink,
  SendHorizonal,
  UserRoundCog,
  FileText,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { classNames } from '../../../lib/utils'

const ATTENTION_ACTIONS = {
  'integration-failure': [
    { id: 'retry', label: 'Retry', icon: RefreshCw },
    { id: 'notify-it', label: 'Notify IT', icon: Bell },
    { id: 'open-okta', label: 'Open integration', icon: ExternalLink },
  ],
  'okta-rate-limit': [
    { id: 'retry', label: 'Retry', icon: RefreshCw },
    { id: 'notify-it', label: 'Notify IT', icon: Bell },
    { id: 'open-okta', label: 'Open Okta', icon: ExternalLink },
  ],
  'letters-unsigned': [
    { id: 'send-reminder', label: 'Send reminder', icon: SendHorizonal },
    { id: 'reassign', label: 'Reassign', icon: UserRoundCog },
    { id: 'open-letter', label: 'Open letter', icon: FileText },
  ],
}

export const LEGEND_ITEMS = [
  { color: 'bg-emerald-500', label: 'Executed' },
  { color: 'bg-rippling-plum', label: 'Running' },
  { color: 'border-2 border-rippling-line bg-white', label: 'Scheduled' },
  { color: 'border-2 border-amber-400 bg-white', label: 'Awaiting human' },
  { color: 'bg-red-500', label: 'Failed' },
  { color: 'bg-amber-400', label: 'Applied-with-drift' },
]

export function StatusSummaryBar({ data, onFilterPill }) {
  const { progress, statusCounts, scenario } = data
  const pills = [
    { id: 'success', count: statusCounts.success, label: 'Succeeded', dotClass: 'bg-emerald-500' },
    { id: 'running', count: statusCounts.running, label: 'Running', dotClass: 'bg-rippling-plum' },
    { id: 'scheduled', count: statusCounts.scheduled, label: 'Scheduled', dotClass: 'border-2 border-rippling-line bg-white' },
    { id: 'awaiting', count: statusCounts.awaiting, label: 'Awaiting', dotClass: 'border-2 border-amber-400 bg-white' },
    { id: 'failed', count: statusCounts.failed, label: 'Failed', dotClass: 'bg-red-500' },
    { id: 'rereview', count: statusCounts.rereview, label: 'Needs re-review', dotClass: 'bg-amber-400' },
  ].filter((p) => p.count > 0 || scenario === 'happy')

  return (
    <div className="bg-white border border-rippling-line rounded-lg px-4 py-3 mb-4 shadow-rippling-card">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <span className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-md bg-rippling-chip shrink-0">
            <Sparkles size={13} strokeWidth={2} className="text-rippling-plum" />
          </span>
          <p className="text-[12.5px] text-rippling-ink-2 leading-relaxed">
            <span className="font-semibold text-rippling-ink">AI · </span>
            {data.aiSummary}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <span
            className={classNames(
              'h-7 px-2.5 rounded-full text-[11px] font-semibold tabular-nums flex items-center',
              scenario === 'happy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rippling-chip text-rippling-plum border border-rippling-plum/20',
            )}
          >
            {progress.landedPct}% landed
          </span>
          {pills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => onFilterPill?.(pill.id)}
              className="h-7 pl-2 pr-2.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 border border-rippling-line bg-white text-rippling-ink-2 hover:bg-rippling-surface-2 transition-colors"
            >
              <span className={classNames('w-1.5 h-1.5 rounded-full shrink-0', pill.dotClass)} />
              <span className="font-semibold tabular-nums">{pill.count}</span>
              <span className="text-rippling-muted">{pill.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AllSystemsGoBanner() {
  return (
    <div className="bg-white rounded-lg border border-emerald-200 overflow-hidden mb-4">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50">
        <CheckCircle2 size={15} strokeWidth={2} className="text-emerald-600 shrink-0" />
        <div>
          <p className="text-[12px] font-semibold text-emerald-800">All systems go</p>
          <p className="text-[11.5px] text-emerald-700/90 mt-0.5 leading-snug">
            Every task executed cleanly. No blockers, drift, or follow-ups need you right now.
          </p>
        </div>
      </div>
    </div>
  )
}

export function AttentionSection({ items, compact = false }) {
  if (!items?.length) return null

  return (
    <div className="bg-white rounded-lg border border-rippling-line overflow-hidden mb-4">
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
        {items.map((item) => {
          const isError = item.severity === 'error'
          const actions = ATTENTION_ACTIONS[item.id] ?? []
          return (
            <div key={item.id} className={classNames('px-4', compact ? 'py-2.5' : 'py-3')}>
              <div className="flex items-start gap-2.5">
                <span
                  className={classNames(
                    'w-2.5 h-2.5 rounded-full shrink-0 mt-1',
                    isError ? 'bg-red-500' : 'bg-amber-400',
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-medium text-rippling-ink leading-snug">{item.title}</p>
                  <p className="text-[11.5px] text-rippling-muted mt-0.5 leading-snug">{item.description}</p>
                  {actions.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {actions.map((action) => {
                        const Icon = action.icon
                        return (
                          <button
                            key={action.id}
                            type="button"
                            className={classNames(
                              'rounded text-[11.5px] font-medium flex items-center gap-1.5 border border-rippling-line bg-white text-rippling-ink-2 hover:bg-rippling-surface-2 transition-colors',
                              compact ? 'h-5 pl-1.5 pr-2' : 'h-6 pl-2 pr-2.5',
                            )}
                          >
                            <Icon size={11} strokeWidth={1.75} className="text-rippling-muted" />
                            {action.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function dotColorClass(status) {
  switch (status) {
    case 'success':
      return 'bg-emerald-500'
    case 'error':
      return 'bg-red-500'
    case 'drift':
      return 'bg-amber-400'
    case 'awaiting':
      return 'border-2 border-amber-400 bg-white'
    case 'running':
      return 'bg-rippling-plum'
    case 'scheduled':
      return 'border-2 border-rippling-line bg-white'
    default:
      return 'bg-rippling-muted/40'
  }
}
