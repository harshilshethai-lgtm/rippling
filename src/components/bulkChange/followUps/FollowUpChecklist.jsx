import ChecklistItem from './ChecklistItem'
import { classNames } from '../../../lib/utils'

/**
 * Generic checklist panel used by all three substep panels.
 *
 * Props:
 *   title       — section heading (e.g. "Payroll")
 *   description — optional subtitle
 *   items       — item config array from followUpsConfig
 *   statuses    — Map<itemId, { status, error?, affectedEmployees? }>
 *   onRerun     — (itemId) => void
 *   onEditAffected — (employeeIds[]) => void
 */
export default function FollowUpChecklist({
  title,
  description,
  items,
  statuses,
  onRerun,
  onEditAffected,
}) {
  const total = items.length
  const successCount = items.filter((i) => statuses.get(i.id)?.status === 'success').length
  const failureCount = items.filter((i) => statuses.get(i.id)?.status === 'failure').length
  const allDone = total > 0 && successCount === total

  return (
    <div className="w-full">
      {/* Section header */}
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="text-[15px] font-semibold text-rippling-ink">{title}</h3>
          {description && (
            <p className="text-[12.5px] text-rippling-muted mt-0.5">{description}</p>
          )}
        </div>

        {/* Summary pill */}
        <span
          className={classNames(
            'text-[11.5px] font-medium px-2.5 py-0.5 rounded-full shrink-0',
            allDone
              ? 'bg-emerald-50 text-emerald-700'
              : failureCount > 0
                ? 'bg-red-50 text-red-700'
                : 'bg-rippling-surface-2 text-rippling-muted',
          )}
        >
          {successCount} of {total} complete
        </span>
      </div>

      {/* Item list */}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <ChecklistItem
              item={item}
              statusEntry={statuses.get(item.id)}
              onRerun={onRerun}
              onEditAffected={onEditAffected}
            />
          </li>
        ))}
      </ul>

      {items.length === 0 && (
        <p className="text-[13px] text-rippling-muted italic py-4 text-center">
          No items for this step based on the selected properties.
        </p>
      )}
    </div>
  )
}
