import { AlertCircle, RotateCw } from 'lucide-react'
import ChecklistItem from './ChecklistItem'
import { classNames } from '../../../lib/utils'

/**
 * Integrations substep panel — always the last Follow Ups step.
 *
 * Shows a failure summary banner at the top when one or more integrations
 * have failed, listing which systems errored and why. Each failed item
 * can be retried individually from the checklist below.
 */
export default function IntegrationsPanel({ substep, statuses, onRerun }) {
  const items = substep.items ?? []
  const failedItems = items.filter((i) => statuses.get(i.id)?.status === 'failure')
  const successCount = items.filter((i) => statuses.get(i.id)?.status === 'success').length
  const allDone = items.length > 0 && successCount === items.length

  return (
    <div className="w-full">
      {/* Section header */}
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="text-[15px] font-semibold text-rippling-ink">{substep.label}</h3>
          {substep.description && (
            <p className="text-[12.5px] text-rippling-muted mt-0.5">{substep.description}</p>
          )}
        </div>

        <span
          className={classNames(
            'text-[11.5px] font-medium px-2.5 py-0.5 rounded-full shrink-0',
            allDone
              ? 'bg-emerald-50 text-emerald-700'
              : failedItems.length > 0
                ? 'bg-red-50 text-red-700'
                : 'bg-rippling-surface-2 text-rippling-muted',
          )}
        >
          {successCount} of {items.length} complete
        </span>
      </div>

      {/* Failure summary banner */}
      {failedItems.length > 0 && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={15} strokeWidth={1.75} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-red-800">
                {failedItems.length} integration{failedItems.length > 1 ? 's' : ''} failed — you can still continue
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {failedItems.map((item) => {
                  const entry = statuses.get(item.id)
                  return (
                    <li key={item.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[12px] font-medium text-red-800">{item.label}</span>
                        {entry?.error && (
                          <span className="text-[11.5px] text-red-600"> — {entry.error}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRerun?.(item.id)}
                        className="shrink-0 flex items-center gap-1 h-6 pl-2 pr-2.5 rounded-full border border-red-200 bg-white text-[11px] font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                      >
                        <RotateCw size={10} strokeWidth={2} />
                        Retry
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Checklist */}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <ChecklistItem
              item={item}
              statusEntry={statuses.get(item.id)}
              onRerun={onRerun}
            />
          </li>
        ))}
      </ul>

      {items.length === 0 && (
        <p className="text-[13px] text-rippling-muted italic py-4 text-center">
          No integrations configured for the selected properties.
        </p>
      )}
    </div>
  )
}
