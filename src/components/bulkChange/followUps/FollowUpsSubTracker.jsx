import { Check } from 'lucide-react'
import { classNames } from '../../../lib/utils'

/**
 * Secondary step tracker for the Follow Ups page.
 *
 * Visually mirrors the main StepIndicator (same chip + numbered circle +
 * connector tokens) but renders the dynamic substep list and is sized down
 * for the sub-header band.
 *
 * Props:
 *   substeps      — ordered array of { id, label } from buildFollowUpsPlan()
 *   activeId      — id of the currently active substep
 *   completedIds  — Set of substep ids that are fully resolved
 */
export default function FollowUpsSubTracker({ substeps, activeId, completedIds = new Set() }) {
  const activeIndex = substeps.findIndex((s) => s.id === activeId)

  return (
    <ol className="flex items-center gap-1">
      {substeps.map((substep, index) => {
        const isCurrent = substep.id === activeId
        const isComplete = completedIds.has(substep.id)
        const isPast = index < activeIndex && !isCurrent

        return (
          <li key={substep.id} className="flex items-center gap-1">
            <span
              className={classNames(
                'inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11.5px] font-medium transition-colors',
                isCurrent && 'bg-rippling-chip text-rippling-plum',
                isComplete && 'bg-rippling-surface-2 text-rippling-ink-2',
                !isCurrent && !isComplete && 'bg-transparent text-rippling-muted',
              )}
            >
              <span
                className={classNames(
                  'w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0',
                  isCurrent && 'bg-rippling-plum text-white',
                  isComplete && 'bg-rippling-plum text-white',
                  !isCurrent && !isComplete && 'border border-rippling-line text-rippling-muted bg-white',
                )}
              >
                {isComplete ? <Check size={8} strokeWidth={3} /> : index + 1}
              </span>
              <span className="whitespace-nowrap">{substep.label}</span>
            </span>

            {index < substeps.length - 1 && (
              <span aria-hidden className="w-3 h-px bg-rippling-line" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
