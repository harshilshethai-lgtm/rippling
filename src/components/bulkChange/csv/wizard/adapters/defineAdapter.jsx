import MapStepFields from '../MapStepFields'
import ReviewStepDefine from '../ReviewStepDefine'
import { inferChangeSetFromHeaders } from '../../csvMapping'
import { buildChangeWorksheetRows } from '../../csvDraft'

/**
 * Adapter for Define Change Set mode.
 *
 * context: { employees, selectedEmployees, selectedFieldKeys }
 *
 * confirm payload: { fieldKeys, parsed, inferredMapping }  (stagedCsvDraft format)
 */
export const defineAdapter = {
  title: 'Use CSV to define change set',
  subtitle: 'Upload or paste a CSV to detect which fields to add to your change set.',
  templateFilename: 'rippling_changes_worksheet.csv',

  buildTemplateRows(context) {
    const { selectedEmployees = [], selectedFieldKeys = [] } = context
    if (selectedFieldKeys.length > 0 && selectedEmployees.length > 0) {
      return buildChangeWorksheetRows({
        employees: selectedEmployees,
        selectedFieldKeys,
        includeValues: false,
      })
    }
    // Blank template — identity headers only
    return [
      ['Rippling profile number', 'Email', 'Name'],
      ['101', 'jane.smith@acme.com', 'Jane Smith'],
      ['102', 'john.doe@acme.com', 'John Doe'],
    ]
  },

  initMapping(headers) {
    return inferChangeSetFromHeaders(headers)
  },

  MapBody(props) {
    return <MapStepFields {...props} mode="define" />
  },

  runResolve({ parsed, mapping }) {
    return {
      inferredFieldKeys: mapping.inferredFieldKeys ?? [],
      newValueColumnsByField: mapping.newValueColumnsByField ?? {},
      currentValueColumnsByField: mapping.currentValueColumnsByField ?? {},
      sampleRows: parsed.rows.slice(0, 3),
      headers: parsed.headers,
    }
  },

  ReviewBody: ReviewStepDefine,

  canContinue(step, { parsed, mapping, resolution, overrides }) {
    if (step === 'upload') return Boolean(parsed?.rows?.length)
    if (step === 'map') {
      return (
        mapping.identityMapping &&
        Object.keys(mapping.identityMapping).length > 0
      )
    }
    if (step === 'review') {
      if (!resolution) return false
      const effectiveKeys = overrides.selectedFieldKeys ?? resolution.inferredFieldKeys
      return effectiveKeys.length > 0
    }
    return false
  },

  confirmLabel(state) {
    const effectiveKeys =
      state.overrides?.selectedFieldKeys ?? state.resolution?.inferredFieldKeys ?? []
    const n = effectiveKeys.length
    return n > 0 ? `Add ${n} ${n === 1 ? 'field' : 'fields'}` : 'Add fields'
  },

  buildConfirmPayload({ parsed, mapping, resolution, overrides }) {
    const fieldKeys = overrides.selectedFieldKeys ?? resolution?.inferredFieldKeys ?? []
    return {
      fieldKeys,
      parsed,
      inferredMapping: mapping,
    }
  },
}
