import { useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { classNames } from '../../../../lib/utils'
import { FIELDS_BY_KEY } from '../../defineChanges/fieldSchema'

const IDENTITY_OPTIONS = [
  { value: 'ProfileNumber', label: 'Rippling profile number' },
  { value: 'Name', label: 'Name' },
  { value: 'Email', label: 'Email' },
  { value: '', label: '— Ignore' },
]

const ROLE_OPTIONS = [
  { value: 'new', label: 'New value' },
  { value: 'current', label: 'Current value (read-only)' },
]

/**
 * Map step for Define / Make modes.
 * Shows two sections:
 *   1. Identity columns — which column identifies each employee
 *   2. Field columns — which Rippling field each column maps to, and whether
 *      it's the "new value" to write or the "current value" (informational)
 *
 * mapping format (inferChangeSetFromHeaders compatible):
 *   {
 *     identityMapping: { ProfileNumber?, Name?, Email? },
 *     newValueColumnsByField: { [fieldKey]: colIdx },
 *     currentValueColumnsByField: { [fieldKey]: colIdx },
 *     inferredFieldKeys: string[],
 *     ignoredHeaders: [...],
 *   }
 */
export default function MapStepFields({ headers, mapping, onMappingChange, mode }) {
  // Build per-column assignment lookup for UI rendering
  const assignments = useMemo(
    () => buildColumnAssignments(headers, mapping),
    [headers, mapping],
  )

  // Sorted list of all editable field keys for the dropdown
  const allFieldOptions = useMemo(() => {
    const entries = []
    for (const [key, meta] of FIELDS_BY_KEY.entries()) {
      entries.push({ value: key, label: meta.label })
    }
    return entries.sort((a, b) => a.label.localeCompare(b.label))
  }, [])

  function handleIdentityChange(colIdx, newField) {
    const next = buildMappingFromAssignments(
      updateAssignment(assignments, colIdx, newField ? { type: 'identity', field: newField } : { type: 'ignore' }),
    )
    onMappingChange(next)
  }

  function handleFieldKeyChange(colIdx, newFieldKey) {
    const current = assignments[colIdx] ?? { type: 'ignore' }
    const role = current.type === 'field' ? current.role : 'new'
    const next = buildMappingFromAssignments(
      updateAssignment(
        assignments,
        colIdx,
        newFieldKey ? { type: 'field', fieldKey: newFieldKey, role } : { type: 'ignore' },
      ),
    )
    onMappingChange(next)
  }

  function handleRoleChange(colIdx, newRole) {
    const current = assignments[colIdx]
    if (!current || current.type !== 'field') return
    const next = buildMappingFromAssignments(
      updateAssignment(assignments, colIdx, { ...current, role: newRole }),
    )
    onMappingChange(next)
  }

  function assignedIdentityField(colIdx) {
    const a = assignments[colIdx]
    return a?.type === 'identity' ? a.field : ''
  }

  const identityCols = headers.reduce((acc, _, i) => {
    if (assignments[i]?.type === 'identity') acc.push(i)
    return acc
  }, [])

  const fieldCols = headers.reduce((acc, _, i) => {
    if (assignments[i]?.type !== 'identity') acc.push(i)
    return acc
  }, [])

  const hasIdentity =
    mapping.identityMapping &&
    Object.keys(mapping.identityMapping).length > 0

  const newValueFields = Object.keys(mapping.newValueColumnsByField ?? {})
  const hasNewValueFields = newValueFields.length > 0

  const isValid = hasIdentity && (mode === 'define' ? true : hasNewValueFields)

  return (
    <div className="space-y-6">
      {/* Identity section */}
      <div>
        <h3 className="text-[13.5px] font-semibold text-rippling-ink mb-0.5">
          Identity columns
        </h3>
        <p className="text-[12.5px] text-rippling-muted mb-3 leading-relaxed">
          Map at least one column so Rippling can match each row to an employee.
        </p>
        <div className="border border-rippling-line rounded-lg overflow-hidden">
          <div className="grid grid-cols-2 border-b border-rippling-line bg-rippling-surface-2 px-4 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-rippling-ink-2">CSV column</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-rippling-ink-2">Maps to</span>
          </div>
          {headers.map((header, i) => {
            const currentField = assignedIdentityField(i)
            const isIdentityCol = currentField !== ''
            if (!isIdentityCol && assignments[i]?.type === 'field') return null
            if (!isIdentityCol && identityCols.length > 0 && !isIdentityCol) return null

            return (
              <div
                key={i}
                className="grid grid-cols-2 items-center px-4 py-2.5 border-b border-rippling-line-2 last:border-b-0"
              >
                <span className="text-[13px] text-rippling-ink-2 truncate">
                  {header || <em className="text-rippling-muted">(empty)</em>}
                </span>
                <div className="relative">
                  <select
                    value={currentField}
                    onChange={(e) => handleIdentityChange(i, e.target.value)}
                    className={classNames(
                      'w-full appearance-none border rounded-md px-3 py-1.5 pr-8 text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-rippling-plum/30 cursor-pointer',
                      currentField
                        ? 'border-rippling-plum/40 text-rippling-ink font-medium'
                        : 'border-rippling-line text-rippling-muted',
                    )}
                  >
                    {IDENTITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} strokeWidth={1.75} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-rippling-muted" />
                </div>
              </div>
            )
          })}
          {/* Show non-identity columns as ignoreable identity slots */}
          {fieldCols.map((i) => {
            const currentField = assignedIdentityField(i)
            if (currentField) return null
            const header = headers[i]
            return (
              <div
                key={i}
                className="grid grid-cols-2 items-center px-4 py-2.5 border-b border-rippling-line-2 last:border-b-0"
              >
                <span className="text-[13px] text-rippling-ink-2 truncate">
                  {header || <em className="text-rippling-muted">(empty)</em>}
                </span>
                <div className="relative">
                  <select
                    value=""
                    onChange={(e) => handleIdentityChange(i, e.target.value)}
                    className="w-full appearance-none border rounded-md px-3 py-1.5 pr-8 text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-rippling-plum/30 cursor-pointer border-rippling-line text-rippling-muted"
                  >
                    {IDENTITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} strokeWidth={1.75} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-rippling-muted" />
                </div>
              </div>
            )
          })}
        </div>
        {!hasIdentity && (
          <p className="mt-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Map at least one column to an identity field to continue.
          </p>
        )}
      </div>

      {/* Field columns section */}
      <div>
        <h3 className="text-[13.5px] font-semibold text-rippling-ink mb-0.5">
          Data columns
        </h3>
        <p className="text-[12.5px] text-rippling-muted mb-3 leading-relaxed">
          For each remaining column, choose which Rippling field it contains and whether it
          represents the <em>new value</em> to write or the <em>current value</em> for reference.
        </p>
        <div className="border border-rippling-line rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr_1.4fr_140px] border-b border-rippling-line bg-rippling-surface-2 px-4 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-rippling-ink-2">CSV column</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-rippling-ink-2">Rippling field</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-rippling-ink-2">Role</span>
          </div>
          {headers.map((header, i) => {
            const a = assignments[i]
            if (a?.type === 'identity') return null
            const currentFieldKey = a?.type === 'field' ? a.fieldKey : ''
            const currentRole = a?.type === 'field' ? a.role : 'new'
            return (
              <div
                key={i}
                className="grid grid-cols-[1fr_1.4fr_140px] items-center px-4 py-2.5 border-b border-rippling-line-2 last:border-b-0"
              >
                <span className="text-[13px] text-rippling-ink-2 truncate">
                  {header || <em className="text-rippling-muted">(empty)</em>}
                </span>
                <div className="relative">
                  <select
                    value={currentFieldKey}
                    onChange={(e) => handleFieldKeyChange(i, e.target.value)}
                    className={classNames(
                      'w-full appearance-none border rounded-md px-3 py-1.5 pr-8 text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-rippling-plum/30 cursor-pointer',
                      currentFieldKey
                        ? 'border-rippling-plum/40 text-rippling-ink font-medium'
                        : 'border-rippling-line text-rippling-muted',
                    )}
                  >
                    <option value="">— Ignore</option>
                    {allFieldOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} strokeWidth={1.75} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-rippling-muted" />
                </div>
                <div className="relative">
                  <select
                    value={currentRole}
                    disabled={!currentFieldKey}
                    onChange={(e) => handleRoleChange(i, e.target.value)}
                    className={classNames(
                      'w-full appearance-none border rounded-md px-3 py-1.5 pr-8 text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-rippling-plum/30 cursor-pointer',
                      !currentFieldKey ? 'opacity-40 cursor-not-allowed' : '',
                      currentFieldKey && currentRole === 'new'
                        ? 'border-rippling-plum/30 text-rippling-ink'
                        : 'border-rippling-line text-rippling-muted',
                    )}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} strokeWidth={1.75} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-rippling-muted" />
                </div>
              </div>
            )
          })}
        </div>
        {mode === 'make' && !hasNewValueFields && hasIdentity && (
          <p className="mt-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Map at least one column to a field with role <strong>New value</strong> to continue.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Mapping helpers ───────────────────────────────────────────────────────────

function buildColumnAssignments(headers, mapping) {
  const { identityMapping = {}, newValueColumnsByField = {}, currentValueColumnsByField = {} } = mapping
  const assignments = {}

  for (const [field, colIdx] of Object.entries(identityMapping)) {
    assignments[colIdx] = { type: 'identity', field }
  }
  for (const [fieldKey, colIdx] of Object.entries(newValueColumnsByField)) {
    if (assignments[colIdx]) continue // identity takes priority
    assignments[colIdx] = { type: 'field', fieldKey, role: 'new' }
  }
  for (const [fieldKey, colIdx] of Object.entries(currentValueColumnsByField)) {
    if (assignments[colIdx]) continue
    assignments[colIdx] = { type: 'field', fieldKey, role: 'current' }
  }
  for (let i = 0; i < headers.length; i += 1) {
    if (!assignments[i]) assignments[i] = { type: 'ignore' }
  }

  return assignments
}

function updateAssignment(assignments, colIdx, newAssignment) {
  const next = { ...assignments }
  // If reassigning an identity field, clear the old slot too
  if (newAssignment.type === 'identity') {
    for (const [idx, a] of Object.entries(next)) {
      if (a.type === 'identity' && a.field === newAssignment.field && Number(idx) !== colIdx) {
        next[idx] = { type: 'ignore' }
      }
    }
  }
  next[colIdx] = newAssignment
  return next
}

function buildMappingFromAssignments(assignments) {
  const identityMapping = {}
  const newValueColumnsByField = {}
  const currentValueColumnsByField = {}

  for (const [colIdxStr, a] of Object.entries(assignments)) {
    const colIdx = Number(colIdxStr)
    if (a.type === 'identity') {
      identityMapping[a.field] = colIdx
    } else if (a.type === 'field' && a.fieldKey) {
      if (a.role === 'new') {
        newValueColumnsByField[a.fieldKey] = colIdx
      } else {
        currentValueColumnsByField[a.fieldKey] = colIdx
      }
    }
  }

  return {
    identityMapping,
    newValueColumnsByField,
    currentValueColumnsByField,
    inferredFieldKeys: Object.keys(newValueColumnsByField),
    ignoredHeaders: [],
  }
}
