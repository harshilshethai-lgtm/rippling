import { classNames } from '../../../lib/utils'

/**
 * A single row in the Properties panel.
 * Label is fixed-width on the left; children fill the right.
 */
export default function PropertyRow({ label, children, className }) {
  return (
    <div className={classNames('flex items-start gap-2 py-1.5 min-h-[28px]', className)}>
      <span className="shrink-0 w-[88px] text-[11.5px] text-rippling-muted mt-0.5 leading-snug">
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
