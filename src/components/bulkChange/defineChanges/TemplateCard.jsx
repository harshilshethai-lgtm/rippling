import { classNames } from '../../../lib/utils'

/**
 * Small clickable card representing a playbook template. Two variants:
 *
 *   • size="lg"  — used in the empty-state grid below the composer.
 *                  Larger surface with icon, label, description, and
 *                  field count.
 *   • size="sm"  — used inside the composer's "/" menu. Single row,
 *                  no description, optionally highlighted by keyboard nav.
 *
 * The component is presentational; the parent owns selection state.
 */
export default function TemplateCard({
  template,
  onSelect,
  size = 'lg',
  highlighted = false,
  ariaSelected,
}) {
  const Icon = template.icon
  const fieldCount = template.fieldKeys.length

  if (size === 'sm') {
    return (
      <button
        type="button"
        onClick={() => onSelect?.(template)}
        aria-selected={ariaSelected}
        className={classNames(
          'w-full px-2.5 py-2 flex items-center gap-2.5 text-left rounded-md transition-colors',
          highlighted ? 'bg-rippling-surface-2' : 'bg-transparent hover:bg-rippling-surface-2',
        )}
      >
        <span className="h-7 w-7 rounded-md bg-rippling-chip text-rippling-plum flex items-center justify-center shrink-0">
          {Icon && <Icon size={13} strokeWidth={1.9} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-rippling-ink truncate">
            {template.label}
          </span>
          <span className="block text-[11.5px] text-rippling-muted truncate">
            {template.description}
          </span>
        </span>
        <span className="text-[10.5px] tabular-nums text-rippling-muted shrink-0">
          {fieldCount} fields
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.(template)}
      className={classNames(
        'group text-left w-full rounded-xl border border-rippling-line bg-white px-3 py-3',
        'hover:border-rippling-plum/40 hover:shadow-rippling-card transition-all',
        'flex flex-col gap-2 min-h-[112px]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="h-8 w-8 rounded-lg bg-rippling-chip text-rippling-plum flex items-center justify-center shrink-0 group-hover:bg-rippling-plum/10">
          {Icon && <Icon size={15} strokeWidth={1.85} />}
        </span>
        <span className="text-[10.5px] tabular-nums text-rippling-muted shrink-0 mt-1">
          {fieldCount} fields
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-rippling-ink leading-tight truncate">
          {template.label}
        </p>
        <p className="text-[11.5px] text-rippling-muted leading-snug mt-1 line-clamp-2">
          {template.description}
        </p>
      </div>
    </button>
  )
}
