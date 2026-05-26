import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { classNames } from '../../../lib/utils'

// ── Confidence ───────────────────────────────────────────────────────────────

function confidenceFromImpact(impact) {
  const total = (impact?.users ?? 0)
  const undef = (impact?.undefined ?? []).reduce((s, u) => {
    const n = parseInt(u.name) || 1
    return s + n
  }, 0)
  if (total === 0 || undef === 0) return 'High'
  const ratio = undef / total
  if (ratio < 0.1) return 'High'
  if (ratio < 0.25) return 'Medium'
  return 'Low'
}

const CONFIDENCE_STYLES = {
  High:   { dot: 'bg-emerald-500', text: 'text-emerald-700' },
  Medium: { dot: 'bg-amber-400',   text: 'text-amber-700'   },
  Low:    { dot: 'bg-red-400',     text: 'text-red-700'     },
}

function ConfidencePill({ level }) {
  const s = CONFIDENCE_STYLES[level] ?? CONFIDENCE_STYLES.High
  return (
    <span className={classNames('flex items-center gap-1 text-[12px] font-medium', s.text)}>
      <span className={classNames('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} />
      {level}
    </span>
  )
}

// ── Role pill ────────────────────────────────────────────────────────────────

const ROLE_ADMIN_PATTERNS = /admin|owner|manager/i

function RolePill({ role }) {
  const isAdmin = ROLE_ADMIN_PATTERNS.test(role)
  return (
    <span
      className={classNames(
        'inline-flex items-center h-4.5 px-1.5 rounded text-[10.5px] font-semibold border',
        isAdmin
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-rippling-surface-2 text-rippling-muted border-rippling-line',
      )}
    >
      {role}
    </span>
  )
}

// ── Expanded sub-section ──────────────────────────────────────────────────────

function SubSection({ label, count, accentClass, children }) {
  if (count === 0) return null
  return (
    <div className="min-w-0">
      <p className={classNames('text-[10.5px] font-semibold uppercase tracking-wider mb-2', accentClass)}>
        {label} ({count})
      </p>
      <ul className="space-y-2">
        {children}
      </ul>
    </div>
  )
}

// ── Expanded row ─────────────────────────────────────────────────────────────

function ExpandedDetail({ impact }) {
  const grants    = impact?.grants    ?? []
  const loses     = impact?.loses     ?? []
  const undefs    = impact?.undefined ?? []

  const grantCount = grants.reduce((s, g) => s + (parseInt(g.name) || 1), 0)
  const loseCount  = loses.reduce((s, l) => s + (parseInt(l.name) || 1), 0)
  const undefCount = undefs.reduce((s, u) => s + (parseInt(u.name) || 1), 0)

  if (grantCount + loseCount + undefCount === 0) {
    return (
      <p className="text-[12.5px] text-rippling-muted italic">No access changes detected.</p>
    )
  }

  return (
    <div className={classNames(
      'grid gap-x-8 gap-y-4',
      (grantCount > 0 ? 1 : 0) + (loseCount > 0 ? 1 : 0) + (undefCount > 0 ? 1 : 0) === 3
        ? 'grid-cols-3'
        : (grantCount > 0 ? 1 : 0) + (loseCount > 0 ? 1 : 0) + (undefCount > 0 ? 1 : 0) === 2
          ? 'grid-cols-2'
          : 'grid-cols-1',
    )}>
      {/* Grants */}
      <SubSection label="Grants" count={grantCount} accentClass="text-emerald-700">
        {grants.map((g, i) => (
          <li key={i} className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[12.5px] font-medium text-rippling-ink">{g.name}</span>
              <span className="text-[11px] text-rippling-muted">→</span>
              <RolePill role={g.role} />
            </div>
            <p className="text-[11px] text-rippling-muted">
              {g.repos ? `${g.role} — ${g.repos}` : null}
              {g.via ? ` via ${g.via}` : null}
            </p>
          </li>
        ))}
      </SubSection>

      {/* Loses */}
      <SubSection label="Loses" count={loseCount} accentClass="text-red-600">
        {loses.map((l, i) => (
          <li key={i} className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[12.5px] font-medium text-rippling-ink">{l.name}</span>
              <span className="text-[11px] text-rippling-muted">·</span>
              <RolePill role={l.role} />
              {l.system && (
                <span className="text-[11px] text-rippling-muted">— {l.system}</span>
              )}
            </div>
            {l.via && (
              <p className="text-[11px] text-rippling-muted">via {l.via}</p>
            )}
          </li>
        ))}
      </SubSection>

      {/* Undefined */}
      <SubSection label="Undefined" count={undefCount} accentClass="text-rippling-muted">
        {undefs.map((u, i) => (
          <li key={i} className="space-y-0.5">
            <span className="text-[12.5px] font-medium text-rippling-ink">{u.name}</span>
            <p className="text-[11.5px] text-rippling-muted leading-snug">{u.reason}</p>
            {u.action && (
              <p className="text-[11.5px]">
                <span className="text-rippling-muted">→ IT action: </span>
                <button
                  type="button"
                  className="text-rippling-plum font-medium hover:underline"
                >
                  {u.action}
                </button>
              </p>
            )}
          </li>
        ))}
      </SubSection>
    </div>
  )
}

// ── Table row ─────────────────────────────────────────────────────────────────

function IntegrationRow({ item }) {
  const [expanded, setExpanded] = useState(false)
  const impact = item.mockImpact ?? {}

  const grants    = impact.grants    ?? []
  const loses     = impact.loses     ?? []
  const undefs    = impact.undefined ?? []

  const grantCount = grants.reduce((s, g) => s + (parseInt(g.name) || 1), 0)
  const loseCount  = loses.reduce((s, l) => s + (parseInt(l.name) || 1), 0)
  const undefCount = undefs.reduce((s, u) => s + (parseInt(u.name) || 1), 0)

  const confidence = impact.confidence ?? confidenceFromImpact(impact)

  return (
    <div className={classNames(
      'border-b border-rippling-line last:border-b-0',
      expanded ? 'bg-rippling-surface/50' : 'bg-white hover:bg-rippling-surface/30',
    )}>
      {/* Collapsed row */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full text-left"
      >
        <div className="grid items-center gap-x-4 px-4 py-3"
          style={{ gridTemplateColumns: '1.6fr 0.5fr 0.7fr 0.7fr 0.7fr 0.8fr 20px' }}
        >
          {/* Integration name */}
          <div className="flex items-center gap-2 min-w-0">
            <span className={classNames(
              'transition-transform duration-150',
              expanded ? 'rotate-90' : 'rotate-0',
            )}>
              <ChevronRight size={13} strokeWidth={2} className="text-rippling-muted" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-rippling-ink truncate">{item.label}</p>
              <p className="text-[11px] text-rippling-muted truncate">{item.sublabel}</p>
            </div>
          </div>

          {/* Users */}
          <span className="text-[12.5px] text-rippling-ink tabular-nums">{impact.users ?? '—'}</span>

          {/* Grants */}
          <span className={classNames(
            'text-[12.5px] font-semibold tabular-nums',
            grantCount > 0 ? 'text-emerald-600' : 'text-rippling-muted',
          )}>
            {grantCount > 0 ? `+${grantCount}` : '—'}
          </span>

          {/* Loses */}
          <span className={classNames(
            'text-[12.5px] font-semibold tabular-nums',
            loseCount > 0 ? 'text-red-500' : 'text-rippling-muted',
          )}>
            {loseCount > 0 ? `−${loseCount}` : '—'}
          </span>

          {/* Undefined */}
          <span className={classNames(
            'text-[12.5px] tabular-nums',
            undefCount > 0 ? 'text-rippling-muted font-medium' : 'text-rippling-muted',
          )}>
            {undefCount > 0 ? `?${undefCount}` : '—'}
          </span>

          {/* Confidence */}
          <ConfidencePill level={confidence} />

          {/* Spacer */}
          <span />
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-10 pb-5 pt-1 border-t border-rippling-line/60 bg-white">
          <ExpandedDetail impact={impact} />
        </div>
      )}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function IntegrationsPanel({ substep }) {
  const items = substep?.items ?? []

  return (
    <div className="w-full">
      {/* Panel header */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-rippling-ink">Integrations</h3>
          <p className="text-[12.5px] text-rippling-muted mt-0.5">
            Access grants and revocations across connected systems.
          </p>
        </div>
        <span className="text-[11.5px] font-medium px-2.5 py-0.5 rounded-full bg-rippling-surface-2 text-rippling-muted shrink-0">
          {items.length} integration{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] text-rippling-muted italic py-4 text-center">
          No integrations configured for the selected properties.
        </p>
      ) : (
        <div className="rounded-lg border border-rippling-line overflow-hidden">
          {/* Column headers */}
          <div
            className="grid gap-x-4 px-4 py-2 bg-rippling-surface border-b border-rippling-line"
            style={{ gridTemplateColumns: '1.6fr 0.5fr 0.7fr 0.7fr 0.7fr 0.8fr 20px' }}
          >
            {['INTEGRATION', 'USERS', 'GRANTS', 'LOSES', 'UNDEFINED', 'CONFIDENCE', ''].map((h, i) => (
              <span key={i} className="text-[10.5px] font-semibold text-rippling-muted uppercase tracking-wider">
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {items.map((item) => (
            <IntegrationRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
