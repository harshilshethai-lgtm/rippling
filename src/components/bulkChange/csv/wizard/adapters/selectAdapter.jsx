import MapStepIdentity from '../MapStepIdentity'
import ReviewStepSelect, { computeConfirmedSelect } from '../ReviewStepSelect'
import { detectSelectStepMapping } from '../../csvMapping'
import { resolveAllEmployeeRows } from '../../csvValidation'

/**
 * Adapter for Select People mode.
 *
 * context: { employees }
 *
 * confirm payload: { resolvedIds: string[], missedRows: string[] }
 */
export const selectAdapter = {
  title: 'Import from CSV',
  subtitle: 'Add employees to your selection using a CSV file',
  templateFilename: 'rippling_bulk_template.csv',

  buildTemplateRows() {
    return [
      ['Rippling profile number', 'Name', 'Email'],
      ['101', 'Jane Smith', 'jane.smith@acme.com'],
      ['102', 'John Doe', 'john.doe@acme.com'],
    ]
  },

  /** Seed the initial identity mapping from CSV headers */
  initMapping(headers) {
    return detectSelectStepMapping(headers)
  },

  MapBody: MapStepIdentity,

  /** Resolve all rows to employees (auto / ambiguous / missed) */
  runResolve({ parsed, mapping, context }) {
    return resolveAllEmployeeRows(parsed.rows, mapping, context.employees)
  },

  ReviewBody: ReviewStepSelect,

  canContinue(step, { parsed, mapping, resolution, overrides }) {
    if (step === 'upload') return Boolean(parsed?.rows?.length)
    if (step === 'map') {
      return (
        mapping.ProfileNumber !== undefined ||
        mapping.Name !== undefined ||
        mapping.Email !== undefined
      )
    }
    if (step === 'review') {
      if (!resolution) return false
      const stillAmbiguous = resolution.some((r, i) => r.status === 'ambiguous' && !overrides[i])
      const { resolvedIds } = computeConfirmedSelect(resolution, overrides)
      return !stillAmbiguous && resolvedIds.length > 0
    }
    return false
  },

  confirmLabel(state) {
    const { resolvedIds } = computeConfirmedSelect(
      state.resolution ?? [],
      state.overrides ?? {},
    )
    return resolvedIds.length > 0
      ? `Confirm import (${resolvedIds.length})`
      : 'Confirm import'
  },

  buildConfirmPayload({ resolution, overrides }) {
    return computeConfirmedSelect(resolution ?? [], overrides ?? {})
  },
}
