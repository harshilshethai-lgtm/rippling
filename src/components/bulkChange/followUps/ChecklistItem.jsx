import { Check, Loader2, RotateCw, AlertCircle, AlertTriangle, Clock, ArrowLeft } from 'lucide-react'
import { classNames } from '../../../lib/utils'
import { avatarClass, initials } from '../../../lib/utils'

/**
 * Single checklist row supporting five states:
 *   pending  — grey clock icon, muted label
 *   running  — spinning loader, "Checking…" sublabel
 *   success  — green check
 *   warning  — amber triangle + affected employees (does NOT block Continue)
 *   failure  — red circle + error + Re-run pill (write/comm)
 *             OR affected-employees list + Edit link (validation)
 */
export default function ChecklistItem({
  item,
  statusEntry,
  onRerun,
  onEditAffected,
}) {
  const status = statusEntry?.status ?? 'pending'
  const error = statusEntry?.error
  const affectedEmployees = statusEntry?.affectedEmployees ?? []
  const isValidation = item.kind === 'validation'
  const isFailure = status === 'failure'
  const isWarning = status === 'warning'

  return (
    <div
      className={classNames(
        'rounded-lg border transition-colors',
        isFailure
          ? 'border-red-200 bg-red-50'
          : isWarning
            ? 'border-amber-200 bg-amber-50'
            : status === 'success'
              ? 'border-emerald-100 bg-white'
              : 'border-rippling-line bg-white',
      )}
    >
      {/* Main row */}
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Status icon */}
        <div className="shrink-0 mt-0.5">
          {status === 'pending' && (
            <Clock size={16} strokeWidth={1.75} className="text-rippling-muted/60" />
          )}
          {status === 'running' && (
            <Loader2 size={16} strokeWidth={1.75} className="animate-spin text-rippling-muted" />
          )}
          {status === 'success' && (
            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check size={9} strokeWidth={3} className="text-white" />
            </div>
          )}
          {isWarning && (
            <AlertTriangle size={16} strokeWidth={1.75} className="text-amber-500" />
          )}
          {isFailure && (
            <AlertCircle size={16} strokeWidth={1.75} className="text-red-500" />
          )}
        </div>

        {/* Label + sublabel */}
        <div className="flex-1 min-w-0">
          <p
            className={classNames(
              'text-[13px] font-medium leading-snug',
              status === 'pending' ? 'text-rippling-muted' : 'text-rippling-ink',
              isFailure && 'text-red-800',
              isWarning && 'text-amber-800',
            )}
          >
            {item.label}
          </p>
          {status === 'running' && (
            <p className="text-[11.5px] text-rippling-muted mt-0.5">Checking…</p>
          )}
          {status !== 'running' && item.sublabel && (
            <p
              className={classNames(
                'text-[11.5px] mt-0.5',
                isFailure ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-rippling-muted',
              )}
            >
              {item.sublabel}
            </p>
          )}
        </div>

        {/* Right badge: Re-run pill for write/comm failures */}
        {isFailure && !isValidation && (
          <button
            type="button"
            onClick={() => onRerun?.(item.id)}
            className="shrink-0 flex items-center gap-1 h-7 pl-2.5 pr-3 rounded-full border border-red-200 bg-white text-[12px] font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
          >
            <RotateCw size={11} strokeWidth={2} />
            Re-run
          </button>
        )}

        {/* Warning badge — "Heads up" label, no blocking */}
        {isWarning && (
          <span className="shrink-0 inline-flex items-center h-6 px-2 rounded-full bg-amber-100 border border-amber-200 text-[11px] font-medium text-amber-700">
            Heads up
          </span>
        )}
      </div>

      {/* Failure expansion */}
      {isFailure && (
        <div className="px-4 pb-3 ml-7 -mt-1 space-y-2">
          {error && (
            <p className="text-[12px] text-red-700 leading-relaxed">{error}</p>
          )}
          {isValidation && affectedEmployees.length > 0 && (
            <AffectedEmployeeList
              employees={affectedEmployees}
              labelColor="text-red-700"
              nameColor="text-red-800"
              reasonColor="text-red-600"
            />
          )}
          {isValidation && (
            <button
              type="button"
              onClick={() => onEditAffected?.(affectedEmployees.map((e) => e.id))}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-rippling-plum hover:underline mt-1"
            >
              <ArrowLeft size={11} strokeWidth={2} />
              Edit affected employees in Make Changes
            </button>
          )}
        </div>
      )}

      {/* Warning expansion */}
      {isWarning && (
        <div className="px-4 pb-3 ml-7 -mt-1 space-y-2">
          {error && (
            <p className="text-[12px] text-amber-700 leading-relaxed">{error}</p>
          )}
          {affectedEmployees.length > 0 && (
            <AffectedEmployeeList
              employees={affectedEmployees}
              labelColor="text-amber-700"
              nameColor="text-amber-800"
              reasonColor="text-amber-600"
            />
          )}
        </div>
      )}
    </div>
  )
}

function AffectedEmployeeList({ employees, labelColor, nameColor, reasonColor }) {
  return (
    <div className="space-y-1.5">
      <p className={classNames('text-[11px] font-semibold uppercase tracking-wide', labelColor)}>
        Affected employees ({employees.length})
      </p>
      <ul className="space-y-1">
        {employees.slice(0, 5).map((emp) => (
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
              <span className={classNames('text-[12px] font-medium', nameColor)}>{emp.name}</span>
              {emp.reason && (
                <span className={classNames('text-[11.5px]', reasonColor)}> — {emp.reason}</span>
              )}
            </div>
          </li>
        ))}
        {employees.length > 5 && (
          <li className={classNames('text-[11.5px]', reasonColor)}>
            +{employees.length - 5} more employees
          </li>
        )}
      </ul>
    </div>
  )
}
