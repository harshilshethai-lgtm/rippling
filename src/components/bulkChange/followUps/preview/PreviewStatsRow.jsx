import { classNames } from '../../../../lib/utils'

const TIER_CONFIG = {
  critical: {
    label: 'Critical',
    sublabel: 'reviewer required',
    bar: 'bg-red-500',
    countClass: 'text-red-600',
    bg: 'bg-white',
  },
  high: {
    label: 'High',
    sublabel: 'reviewer required',
    bar: 'bg-orange-500',
    countClass: 'text-orange-600',
    bg: 'bg-white',
  },
  medium: {
    label: 'Medium',
    sublabel: 'review recommended',
    bar: 'bg-amber-400',
    countClass: 'text-amber-600',
    bg: 'bg-white',
  },
  routine: {
    label: 'Routine',
    sublabel: 'auto-handled',
    bar: 'bg-rippling-line',
    countClass: 'text-rippling-muted',
    bg: 'bg-white',
  },
}

/**
 * Four KPI cards in a row — Blocker / Critical / High / Routine.
 * Positioned sticky below the sub-tracker band so the user always
 * sees aggregate counts while scrolling through events.
 */
export default function PreviewStatsRow({ aggregate, totalEmployees, isLoading }) {
  const tiers = ['critical', 'high', 'medium', 'routine']

  return (
    <div className="mb-5">
      {/* Employee count strip */}
      <p className="text-[12px] text-rippling-muted mb-2.5 text-center">
        {isLoading ? (
          <span className="inline-block w-32 h-3 bg-rippling-surface-2 rounded animate-pulse" />
        ) : (
          <>
            <span className="font-semibold text-rippling-ink">{totalEmployees}</span> employee{totalEmployees === 1 ? '' : 's'} ·{' '}
            <span className="font-semibold text-red-600">{aggregate.critical}</span> critical ·{' '}
            <span className="font-semibold text-orange-600">{aggregate.high}</span> high ·{' '}
            <span className="font-semibold text-amber-600">{aggregate.medium}</span> medium ·{' '}
            <span className="font-semibold text-rippling-muted">{aggregate.routine}</span> routine
          </>
        )}
      </p>

      {/* Tier cards */}
      <div className="grid grid-cols-4 gap-3">
        {tiers.map((tier) => {
          const cfg = TIER_CONFIG[tier]
          const count = aggregate[tier] ?? 0
          return (
            <div
              key={tier}
              className={classNames(
                'relative rounded-xl border border-rippling-line shadow-rippling-card overflow-hidden',
                cfg.bg,
              )}
            >
              {/* Left accent bar */}
              <div className={classNames('absolute left-0 top-0 bottom-0 w-1', cfg.bar)} />
              <div className="pl-4 pr-3 py-3">
                {isLoading ? (
                  <div className="space-y-1.5">
                    <div className="h-6 w-8 bg-rippling-surface-2 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-rippling-surface-2 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <p className={classNames('text-[24px] font-bold leading-none tabular-nums', cfg.countClass)}>
                      {count}
                    </p>
                    <p className="text-[12px] font-semibold text-rippling-ink mt-0.5">{cfg.label}</p>
                    <p className="text-[11px] text-rippling-muted">{cfg.sublabel}</p>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
