import MapStepFields from '../MapStepFields'
import ReviewStepMake from '../ReviewStepMake'
import { inferChangeSetFromHeaders } from '../../csvMapping'
import { buildMakeChangesDraftRows, computeImportPrelim, resolveAmbiguities } from '../../csvDraft'

/**
 * Adapter for Make Changes mode.
 *
 * context: { employees, selectedFieldKeys, bulkValues, cellOverrides, uniformByField }
 *
 * confirm payload: { nextStatePatch: { bulkValues, cellOverrides, uniformByField } }
 */
export const makeAdapter = {
  title: 'Upload CSV values',
  subtitle: 'Map CSV rows to employees and apply new values to the change grid.',
  templateFilename: 'rippling_bulk_change_draft.csv',

  buildTemplateRows(context) {
    const { employees = [], selectedFieldKeys = [], bulkValues = {}, cellOverrides = {}, uniformByField = {} } = context
    if (employees.length > 0 && selectedFieldKeys.length > 0) {
      return buildMakeChangesDraftRows({ employees, selectedFieldKeys, bulkValues, cellOverrides, uniformByField })
    }
    // Fallback blank template
    return [
      ['Rippling profile number', 'Email', 'Name'],
      ['101', 'jane.smith@acme.com', 'Jane Smith'],
    ]
  },

  initMapping(headers, context, initialPayload) {
    if (initialPayload?.inferredMapping) return initialPayload.inferredMapping
    return inferChangeSetFromHeaders(headers)
  },

  MapBody(props) {
    return <MapStepFields {...props} mode="make" />
  },

  runResolve({ parsed, mapping, context }) {
    const { employees, selectedFieldKeys } = context
    return computeImportPrelim({
      parsed,
      inferredMapping: mapping,
      selectedFieldKeys,
      employees,
    })
  },

  ReviewBody: ReviewStepMake,

  canContinue(step, { parsed, mapping, resolution, overrides }, context) {
    if (step === 'upload') return Boolean(parsed?.rows?.length)
    if (step === 'map') {
      return (
        mapping.identityMapping &&
        Object.keys(mapping.identityMapping).length > 0 &&
        Object.keys(mapping.newValueColumnsByField ?? {}).length > 0
      )
    }
    if (step === 'review') {
      if (!resolution) return false
      const pendingAmbiguous = resolution.ambiguousRows.filter(
        (r) => !overrides[r.rowIndex],
      ).length
      if (pendingAmbiguous > 0) return false
      if (resolution.errors.length > 0) return false
      const { employees, selectedFieldKeys, currentState } = context
      const { summary } = resolveAmbiguities(
        resolution, overrides, selectedFieldKeys, employees, currentState,
      )
      return summary.matchedRows > 0 && summary.changedCells > 0
    }
    return false
  },

  confirmLabel(state, context) {
    if (!state.resolution || !context) return 'Apply CSV values'
    const { employees, selectedFieldKeys, currentState } = context
    const { summary } = resolveAmbiguities(
      state.resolution, state.overrides ?? {}, selectedFieldKeys, employees, currentState,
    )
    return summary.changedCells > 0
      ? `Apply ${summary.changedCells} ${summary.changedCells === 1 ? 'change' : 'changes'}`
      : 'Apply CSV values'
  },

  buildConfirmPayload({ resolution, overrides, context }) {
    const { employees, selectedFieldKeys, currentState } = context
    const { nextStatePatch } = resolveAmbiguities(
      resolution, overrides ?? {}, selectedFieldKeys, employees, currentState,
    )
    return { nextStatePatch }
  },
}
