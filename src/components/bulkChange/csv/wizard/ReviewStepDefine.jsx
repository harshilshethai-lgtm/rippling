import { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { classNames } from '../../../../lib/utils'
import { FIELDS_BY_KEY } from '../../defineChanges/fieldSchema'

/**
 * Review step for Define Change Set mode.
 *
 * Shows:
 *   - List of inferred fields with add/skip toggles
 *   - Sample row preview (first 3 rows × selected fields)
 *
 * resolution: { inferredFieldKeys, newValueColumnsByField, sampleRows, headers }
 * overrides: { selectedFieldKeys?: string[] }  — user's field selection
 */
export default function ReviewStepDefine({ resolution, overrides, onChangeOverrides, parsed }) {
  const { inferredFieldKeys, newValueColumnsByField, sampleRows, headers } = resolution

  const effectiveKeys = overrides.selectedFieldKeys ?? inferredFieldKeys

  function toggleField(fieldKey) {
    const current = effectiveKeys
    const next = current.includes(fieldKey)
      ? current.filter((k) => k !== fieldKey)
      : [...current, fieldKey]
    onChangeOverrides((prev) => ({ ...prev, selectedFieldKeys: next }))
  }

  const fieldMeta = useMemo(() =>
    inferredFieldKeys
      .map((key) => ({ key, meta: FIELDS_BY_KEY.get(key) }))
      .filter((e) => e.meta),
    [inferredFieldKeys],
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-[14px] font-semibold text-rippling-ink">Confirm fields to add</h3>
        <p className="text-[12.5px] text-rippling-muted mt-0.5 leading-relaxed">
          We detected {inferredFieldKeys.length} editable{' '}
          {inferredFieldKeys.length === 1 ? 'field' : 'fields'} from your CSV headers.
          Uncheck any you don't want to add to the change set.
        </p>
      </div>

      {/* Field checklist */}
      {fieldMeta.length === 0 ? (
        <p className="text-[12.5px] text-rippling-muted">No editable fields were detected.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {fieldMeta.map(({ key, meta }) => {
            const isSelected = effectiveKeys.includes(key)
            return (
              <label
                key={key}
                className={classNames(
                  'flex items-center gap-2.5 text-[12.5px] rounded-lg border px-3 py-2.5 cursor-pointer transition-colors',
                  isSelected
                    ? 'border-rippling-plum/40 bg-rippling-chip text-rippling-ink'
                    : 'border-rippling-line text-rippling-ink-2 bg-white hover:bg-rippling-surface',
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleField(key)}
                  className="rippling-checkbox"
                />
                <div className="min-w-0">
                  <span className="font-medium truncate">{meta.label}</span>
                  {meta.sectionLabel && (
                    <span className="ml-1.5 text-[10.5px] text-rippling-muted">
                      {meta.sectionLabel}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <CheckCircle2 size={13} strokeWidth={2} className="text-rippling-plum ml-auto shrink-0" />
                )}
              </label>
            )
          })}
        </div>
      )}

      {effectiveKeys.length === 0 && fieldMeta.length > 0 && (
        <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Select at least one field to continue.
        </p>
      )}

      {/* Sample preview */}
      {sampleRows.length > 0 && effectiveKeys.length > 0 && (
        <SamplePreview
          sampleRows={sampleRows}
          headers={headers}
          selectedFieldKeys={effectiveKeys}
          newValueColumnsByField={newValueColumnsByField}
        />
      )}
    </div>
  )
}

function SamplePreview({ sampleRows, headers, selectedFieldKeys, newValueColumnsByField }) {
  const previewCols = selectedFieldKeys
    .map((key) => ({ key, colIdx: newValueColumnsByField[key], meta: FIELDS_BY_KEY.get(key) }))
    .filter((c) => c.colIdx !== undefined && c.meta)

  if (previewCols.length === 0) return null

  return (
    <div>
      <p className="text-[12.5px] font-semibold text-rippling-ink mb-2">
        Data preview (first {sampleRows.length} {sampleRows.length === 1 ? 'row' : 'rows'})
      </p>
      <div className="border border-rippling-line rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-rippling-surface-2 border-b border-rippling-line">
              {previewCols.map(({ key, meta }) => (
                <th
                  key={key}
                  className="px-3 py-2 text-left font-semibold text-rippling-ink-2 whitespace-nowrap"
                >
                  {meta.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, i) => (
              <tr key={i} className="border-b border-rippling-line-2 last:border-b-0">
                {previewCols.map(({ key, colIdx }) => (
                  <td key={key} className="px-3 py-2 text-rippling-ink-2 whitespace-nowrap">
                    {row[colIdx] || <span className="text-rippling-muted/60 italic">empty</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
