import { ChevronDown, Search } from 'lucide-react'
import { classNames } from '../../lib/utils'

/**
 * Generic editor for a single field. Used by:
 *   • EmployeeProfile.jsx — tab edit mode
 *   • Bulk change → Define changes table cells & "Set all" popovers
 *
 * The `field` arg shape: { value, type?: 'text'|'textarea'|'select'|'search-select'|'date'|'email'|'tel'|'sensitive', options? }
 *
 * Pass `compact` for the dense table-cell variant (smaller height, no full
 * width by default).
 */
export const FIELD_INPUT_BASE =
  'w-full h-8 border border-rippling-line rounded-md px-2.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-rippling-primary focus:border-rippling-primary'

const COMPACT_BASE =
  'w-full h-7 border border-rippling-line rounded-md px-2 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-rippling-primary focus:border-rippling-primary bg-white'

export default function FieldInput({ field, onChange, compact = false, placeholder, className }) {
  const baseClass = compact ? COMPACT_BASE : FIELD_INPUT_BASE
  const value = field?.value ?? ''

  if (field?.type === 'textarea') {
    return (
      <textarea
        rows={compact ? 2 : 3}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        className={classNames(
          'w-full border border-rippling-line rounded-md px-2.5 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-rippling-primary focus:border-rippling-primary',
          compact ? 'text-[12.5px] bg-white' : 'text-[13px]',
          className,
        )}
      />
    )
  }

  if (field?.type === 'select') {
    return (
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          className={classNames(baseClass, 'appearance-none pr-7', className)}
        >
          {placeholder !== undefined && value === '' && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {(field.options || (value !== '' ? [value] : [])).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          size={compact ? 12 : 13}
          strokeWidth={2}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-rippling-muted"
        />
      </div>
    )
  }

  if (field?.type === 'search-select') {
    return (
      <div className="relative">
        <Search
          size={compact ? 12 : 13}
          strokeWidth={1.9}
          className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-rippling-muted"
        />
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange?.(event.target.value)}
          className={classNames(baseClass, 'pl-7 pr-7', className)}
        />
        <ChevronDown
          size={compact ? 12 : 13}
          strokeWidth={2}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-rippling-muted"
        />
      </div>
    )
  }

  return (
    <input
      type={field?.type === 'sensitive' ? 'text' : field?.type || 'text'}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange?.(event.target.value)}
      className={classNames(baseClass, className)}
    />
  )
}
