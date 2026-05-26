import { avatarClass, classNames, initials } from '../../../../lib/utils'

/**
 * Compact list of affected employees shown inside an EventCard.
 * Shows up to `max` rows, then a "+N more" line.
 */
export default function SampleAffectedList({ employees, max = 3, accentClass = 'text-rippling-muted', nameClass = 'text-rippling-ink' }) {
  if (!employees || employees.length === 0) return null

  const visible = employees.slice(0, max)
  const overflow = employees.length - max

  return (
    <ul className="space-y-1.5">
      {visible.map((emp) => (
        <li key={emp.id} className="flex items-center gap-2">
          <div
            className={classNames(
              'h-5 w-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold shrink-0',
              avatarClass(emp.name),
            )}
          >
            {initials(emp.name)}
          </div>
          <div className="min-w-0">
            <span className={classNames('text-[12px] font-medium', nameClass)}>{emp.name}</span>
            {emp.reason && (
              <span className={classNames('text-[11.5px]', accentClass)}> — {emp.reason}</span>
            )}
          </div>
        </li>
      ))}
      {overflow > 0 && (
        <li className={classNames('text-[11.5px]', accentClass)}>
          +{overflow} more
        </li>
      )}
    </ul>
  )
}
