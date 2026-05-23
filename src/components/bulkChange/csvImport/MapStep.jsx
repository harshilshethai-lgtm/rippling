import { ChevronDown } from 'lucide-react'
import { classNames } from '../../../lib/utils'

const FIELD_OPTIONS = [
  { value: 'Name', label: 'Name' },
  { value: 'Email', label: 'Email' },
  { value: '', label: '— Ignore' },
]

export default function MapStep({ headers, mapping, onMappingChange }) {
  function handleSelect(colIndex, value) {
    const next = { ...mapping }
    // Remove any existing assignment to this field value to avoid duplicates
    for (const key of Object.keys(next)) {
      if (next[key] === colIndex) delete next[key]
    }
    if (value) next[value] = colIndex
    onMappingChange(next)
  }

  const assignedField = (colIndex) => {
    for (const [field, idx] of Object.entries(mapping)) {
      if (idx === colIndex) return field
    }
    return ''
  }

  const isValid = mapping.Name !== undefined || mapping.Email !== undefined

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[14px] font-semibold text-rippling-ink">Map CSV headers to fields</h3>
        <p className="text-[12.5px] text-rippling-muted mt-0.5 leading-relaxed">
          Review the mapping from your CSV and ensure they are the right fields. At least one of
          Name or Email must be mapped.
        </p>
      </div>

      <div className="border border-rippling-line rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-2 border-b border-rippling-line bg-rippling-surface-2 px-4 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-rippling-ink-2">
            Column from CSV
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-rippling-ink-2">
            Field in Rippling
          </span>
        </div>

        {/* Rows */}
        {headers.map((header, i) => {
          const currentField = assignedField(i)
          return (
            <div
              key={i}
              className="grid grid-cols-2 items-center px-4 py-3 border-b border-rippling-line-2 last:border-b-0"
            >
              <span className="text-[13px] text-rippling-ink-2">
                {header || <em className="text-rippling-muted">(empty)</em>}
                {(currentField === 'Name' || currentField === 'Email') && (
                  <span className="ml-1.5 text-[10.5px] text-rippling-plum font-medium bg-rippling-chip px-1.5 py-0.5 rounded-full">
                    required
                  </span>
                )}
              </span>
              <div className="relative">
                <select
                  value={currentField}
                  onChange={(e) => handleSelect(i, e.target.value)}
                  className={classNames(
                    'w-full appearance-none border rounded-md px-3 py-1.5 pr-8 text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-rippling-plum/30 cursor-pointer',
                    currentField
                      ? 'border-rippling-plum/40 text-rippling-ink font-medium'
                      : 'border-rippling-line text-rippling-muted',
                  )}
                >
                  {FIELD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  strokeWidth={1.75}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-rippling-muted"
                />
              </div>
            </div>
          )
        })}
      </div>

      {!isValid && (
        <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Map at least one column to <strong>Name</strong> or <strong>Email</strong> to continue.
        </p>
      )}
    </div>
  )
}
