import { useState } from 'react'
import { ChevronDown, ChevronUp, Minus } from 'lucide-react'
import { classNames } from '../../../lib/utils'
import { isTitleOnlyChange } from './buildReviewApplyData'
import { AttentionSection, dotColorClass } from './reviewUi'

const STATUS_PRIORITY = { error: 5, drift: 4, awaiting: 3, running: 2, scheduled: 1, success: 0 }

function worstStatus(dots) {
  return dots.reduce((acc, d) => {
    return (STATUS_PRIORITY[d.status] ?? 0) > (STATUS_PRIORITY[acc] ?? 0) ? d.status : acc
  }, 'success')
}

function TaskDot({ task }) {
  return (
    <div className="relative group/dot flex items-center justify-center">
      <div
        className={classNames('w-2.5 h-2.5 rounded-full cursor-default', dotColorClass(task.status))}
      />
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/dot:block z-50 pointer-events-none"
        style={{ minWidth: 160 }}
      >
        <div className="bg-[#1a1a1a] text-white text-[10.5px] rounded-md px-2.5 py-1.5 shadow-lg">
          <p className="font-medium leading-snug">{task.name}</p>
          {task.detail && <p className="text-white/60 mt-0.5 leading-snug">{task.detail}</p>}
          <p className="text-white/40 mt-0.5 capitalize">{task.status}</p>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#1a1a1a]" />
      </div>
    </div>
  )
}

function HealthStatusText({ status, label }) {
  return (
    <span
      className={classNames(
        'text-[10.5px] font-medium leading-none',
        status === 'success' && 'text-emerald-600',
        status === 'error' && 'text-red-500 font-semibold',
        status === 'awaiting' && 'text-amber-600',
        status === 'running' && 'text-rippling-plum',
        status === 'scheduled' && 'text-rippling-muted',
      )}
    >
      {label}
    </span>
  )
}

function EmployeeRow({ employee, domainGroups, sortKey }) {
  const isWorst = employee.overallStatus === 'failed'
  const isDrift = employee.overallStatus === 'drift'

  return (
    <div
      className={classNames(
        'flex items-center border-b border-rippling-line hover:bg-rippling-surface transition-colors',
        isWorst && 'bg-red-50/20',
        isDrift && 'bg-amber-50/20',
      )}
    >
      <div className="w-[260px] shrink-0 px-4 py-2.5 flex items-start gap-2.5 sticky left-0 bg-inherit z-10 border-r border-rippling-line">
        <div
          className={classNames(
            'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0 mt-0.5',
            employee.avatarClass,
          )}
        >
          {employee.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12px] font-medium text-rippling-ink leading-none">{employee.name}</span>
            {employee.pctChange && (
              <span className="text-[10.5px] text-rippling-muted font-medium">{employee.pctChange}</span>
            )}
            {isWorst && (
              <span className="px-1 py-px text-[9.5px] font-semibold rounded bg-red-100 text-red-600 uppercase tracking-wide leading-none">
                Failed
              </span>
            )}
            {isDrift && (
              <span className="px-1 py-px text-[9.5px] font-semibold rounded bg-amber-100 text-amber-700 uppercase tracking-wide leading-none">
                Applied w/ drift
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

      {domainGroups.map((group) => {
        const dots = employee.domains[group.id] ?? []
        const colWidth = group.dotCount === 1 ? 72 : group.dotCount === 2 ? 96 : 120
        const isSortHighlight = sortKey === group.id
        const paddedDots = [
          ...dots.slice(0, group.dotCount),
          ...Array.from({ length: Math.max(0, group.dotCount - dots.length) }, (_, i) => ({
            id: `pad-${i}`,
            name: '—',
            status: 'scheduled',
            detail: null,
          })),
        ]

        return (
          <div
            key={group.id}
            style={{ width: colWidth }}
            className={classNames(
              'shrink-0 flex items-center justify-around py-2.5 border-r border-rippling-line/50',
              isSortHighlight && 'bg-rippling-chip/40',
            )}
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

export default function ByEmployeeView({ data }) {
  const [activePill, setActivePill] = useState(null)
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('desc')

  const { employeeRows, domainGroups, attentionItems, scenario, selectedFieldKeys } = data
  const columnLabel = isTitleOnlyChange(selectedFieldKeys) ? 'Employee · Title change' : 'Employee · Change'

  const pillToStatus = {
    failed: 'failed',
    rereview: 'drift',
    success: 'clean',
  }

  function handleHeaderClick(domainId) {
    if (sortKey === domainId) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else {
      setSortKey(domainId)
      setSortDir('desc')
    }
  }

  let visibleEmployees = [...employeeRows]
  if (activePill && pillToStatus[activePill]) {
    visibleEmployees = visibleEmployees.filter((e) => e.overallStatus === pillToStatus[activePill])
  }

  if (sortKey) {
    visibleEmployees.sort((a, b) => {
      const aWorst = STATUS_PRIORITY[worstStatus(a.domains[sortKey] ?? [])] ?? 0
      const bWorst = STATUS_PRIORITY[worstStatus(b.domains[sortKey] ?? [])] ?? 0
      const diff = sortDir === 'desc' ? bWorst - aWorst : aWorst - bWorst
      return diff !== 0 ? diff : a.name.localeCompare(b.name)
    })
  } else {
    const ORDER = { failed: 0, drift: 1, awaiting: 2, running: 3, clean: 4 }
    visibleEmployees.sort((a, b) => (ORDER[a.overallStatus] ?? 5) - (ORDER[b.overallStatus] ?? 5))
  }

  const tableMinWidth =
    260 + domainGroups.reduce((w, g) => w + (g.dotCount === 1 ? 72 : g.dotCount === 2 ? 96 : 120), 0)

  return (
    <div className="flex flex-col">
      {scenario !== 'happy' && <AttentionSection items={attentionItems} compact />}

      <div className="bg-white rounded-lg border border-rippling-line overflow-hidden shadow-rippling-card">
        <div className="overflow-x-auto">
          <div style={{ minWidth: tableMinWidth }}>
            <div className="flex items-stretch border-b border-rippling-line bg-rippling-surface sticky top-0 z-20">
              <div className="w-[260px] shrink-0 px-4 py-2 sticky left-0 bg-rippling-surface z-30 border-r border-rippling-line">
                <p className="text-[10px] font-semibold text-rippling-muted uppercase tracking-wide">
                  {columnLabel}
                </p>
              </div>
              {domainGroups.map((group) => {
                const colWidth = group.dotCount === 1 ? 72 : group.dotCount === 2 ? 96 : 120
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
                    <div className="flex items-center justify-around w-full gap-0.5">
                      {group.subLabels.map((sub) => (
                        <span
                          key={sub}
                          className="text-[9px] text-rippling-muted/70 leading-none truncate text-center"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center border-b border-rippling-line bg-rippling-surface/60">
              <div className="w-[260px] shrink-0 px-4 py-1.5 sticky left-0 bg-rippling-surface/60 z-10 border-r border-rippling-line">
                <p className="text-[9.5px] font-semibold text-rippling-muted uppercase tracking-wide">
                  Integration health
                </p>
                <p className="text-[9px] text-rippling-muted/70">Aggregated · click column to sort</p>
              </div>
              {domainGroups.map((group) => {
                const colWidth = group.dotCount === 1 ? 72 : group.dotCount === 2 ? 96 : 120
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

            {visibleEmployees.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-[12.5px] text-rippling-muted">No employees match this filter.</p>
              </div>
            ) : (
              visibleEmployees.map((emp) => (
                <EmployeeRow key={emp.id} employee={emp} domainGroups={domainGroups} sortKey={sortKey} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
