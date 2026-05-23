import { Check } from 'lucide-react'
import { classNames } from '../../lib/utils'

export const BULK_CHANGE_STEPS = [
  { id: 'select', label: 'Select people' },
  { id: 'changes', label: 'Define changes' },
  { id: 'review', label: 'Review & apply' },
]

export default function StepIndicator({ currentStepId }) {
  const currentIndex = BULK_CHANGE_STEPS.findIndex((step) => step.id === currentStepId)

  return (
    <ol className="flex items-center gap-1.5">
      {BULK_CHANGE_STEPS.map((step, index) => {
        const isCurrent = index === currentIndex
        const isComplete = index < currentIndex
        return (
          <li key={step.id} className="flex items-center gap-1.5">
            <span
              className={classNames(
                'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[12px] font-medium transition-colors',
                isCurrent && 'bg-rippling-chip text-rippling-plum',
                isComplete && 'bg-rippling-surface-2 text-rippling-ink-2',
                !isCurrent && !isComplete && 'bg-transparent text-rippling-muted',
              )}
            >
              <span
                className={classNames(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold',
                  isCurrent && 'bg-rippling-plum text-white',
                  isComplete && 'bg-rippling-plum text-white',
                  !isCurrent && !isComplete && 'border border-rippling-line text-rippling-muted bg-white',
                )}
              >
                {isComplete ? <Check size={10} strokeWidth={3} /> : index + 1}
              </span>
              <span>{step.label}</span>
            </span>
            {index < BULK_CHANGE_STEPS.length - 1 && (
              <span aria-hidden className="w-4 h-px bg-rippling-line" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
