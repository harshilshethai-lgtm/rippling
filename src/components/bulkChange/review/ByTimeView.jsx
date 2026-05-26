import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Circle,
  Users,
  DollarSign,
  Landmark,
  Shield,
  FileCheck,
  Monitor,
  Share2,
} from 'lucide-react'
import { classNames } from '../../../lib/utils'
import { AttentionSection } from './reviewUi'

const DOMAINS = [
  { id: 'people', label: 'People & Org', icon: Users },
  { id: 'comp', label: 'Compensation & Equity', icon: DollarSign },
  { id: 'payroll', label: 'Payroll & Tax', icon: Landmark },
  { id: 'benefits', label: 'Benefits', icon: Shield },
  { id: 'docs', label: 'Documents & Compliance', icon: FileCheck },
  { id: 'it', label: 'IT / Access', icon: Monitor },
  { id: 'external', label: 'External Systems', icon: Share2 },
]

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
        hasIssue && task.highlight === 'error' && 'border-red-200 bg-red-50/40 hover:bg-red-50/70',
        hasIssue && task.highlight === 'warning' && 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/70',
        hasIssue && task.highlight === 'drift' && 'border-amber-100 bg-amber-50/30 hover:bg-amber-50/60',
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
                task.status === 'error' && 'text-red-500',
                task.status === 'warning' && 'text-amber-600',
                task.status === 'drift' && 'text-amber-600',
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
                task.highlight === 'error' && 'text-red-500',
                task.highlight === 'warning' && 'text-amber-600',
                task.highlight === 'drift' && 'text-amber-600',
                !task.highlight && 'text-rippling-muted',
              )}
            >
              {task.note}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

const PHASES = [
  {
    id: 'pre',
    label: 'Pre-effective',
    dateRange: 'Before effective',
    chip: 'FACT',
    chipClass: 'bg-rippling-chip text-rippling-ink-2',
    headerClass: 'bg-white border-rippling-line',
    colClass: 'bg-white',
  },
  {
    id: 'on',
    label: 'On-effective',
    dateRange: 'Effective day',
    chip: 'NOW',
    chipClass: 'bg-amber-100 text-amber-700 font-semibold',
    headerClass: 'bg-amber-50/60 border-amber-200',
    colClass: 'bg-amber-50/20',
    nowBorder: true,
  },
  {
    id: 'post',
    label: 'Post-effective',
    dateRange: 'After effective',
    chip: 'FORECAST',
    chipClass: 'bg-rippling-surface-2 text-rippling-muted',
    headerClass: 'bg-rippling-surface/50 border-rippling-line',
    colClass: 'bg-rippling-surface/40',
  },
]

function activeDomains(tasks) {
  const ids = new Set(tasks.map((t) => t.domain))
  return DOMAINS.filter((d) => ids.has(d.id))
}

export default function ByTimeView({ data, onNavigateToFollowups }) {
  const { byTimeTasks, attentionItems, scenario } = data
  const domains = activeDomains(byTimeTasks)

  if (domains.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-rippling-line px-6 py-12 text-center">
        <p className="text-[13px] text-rippling-muted">
          No timed tasks yet — complete Follow ups to seed department work, then return here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {scenario !== 'happy' && <AttentionSection items={attentionItems} compact />}

      <div className="bg-white rounded-lg border border-rippling-line overflow-hidden shadow-rippling-card">
        <div className="grid border-b border-rippling-line" style={{ gridTemplateColumns: '160px 1fr 1fr 1fr' }}>
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
                <span className={classNames('text-[9.5px] font-semibold px-1.5 py-0.5 rounded leading-none', phase.chipClass)}>
                  {phase.chip}
                </span>
              </div>
            </div>
          ))}
        </div>

        {domains.map((domain, domainIdx) => {
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
              <div className="px-4 py-3 border-r border-rippling-line flex items-start gap-2">
                <div className="w-5 h-5 rounded bg-rippling-chip flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={11} strokeWidth={1.75} className="text-rippling-plum" />
                </div>
                <p className="text-[11.5px] font-medium text-rippling-ink-2 leading-snug">{domain.label}</p>
              </div>
              {PHASES.map((phase) => {
                const phaseTasks = byTimeTasks.filter(
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
                        <TaskCard key={task.id} task={task} onNavigate={onNavigateToFollowups} />
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
