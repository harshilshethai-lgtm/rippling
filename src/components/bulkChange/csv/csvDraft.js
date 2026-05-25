import { EMPLOYEES } from '../../../data/employees'
import { FIELDS_BY_KEY } from '../defineChanges/fieldSchema'
import { getCurrentValue } from '../defineChanges/currentValues'
import { normalizeFieldValue, resolveEmployeeRow } from './csvValidation'
import { normalizeCsvValue } from './csvContract'

function escapeCell(value) {
  const text = String(value ?? '')
  if (!text.includes(',') && !text.includes('"') && !text.includes('\n')) return text
  return `"${text.replace(/"/g, '""')}"`
}

export function toCsvString(rows) {
  return rows.map((row) => row.map((cell) => escapeCell(cell)).join(',')).join('\r\n')
}

export function downloadCsv(filename, rows) {
  const blob = new Blob([toCsvString(rows)], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function buildIdentityColumns(employee) {
  return [
    employee.profileNumber ?? '',
    employee.email ?? '',
    employee.fullName ?? '',
  ]
}

export function buildPeopleSelectionCsvRows(entries = []) {
  const headers = ['Rippling profile number', 'Email', 'Name', 'Department', 'Manager', 'Source']
  const dataRows = entries.map(({ employee, sources }) => [
    employee.profileNumber ?? '',
    employee.email ?? '',
    employee.fullName ?? '',
    employee.department ?? '',
    employee.manager ?? '',
    (sources ?? []).join('|'),
  ])
  return [headers, ...dataRows]
}

export function buildChangeWorksheetRows({ employees, selectedFieldKeys, includeValues = false }) {
  const fieldHeaders = selectedFieldKeys.flatMap((fieldKey) => {
    const meta = FIELDS_BY_KEY.get(fieldKey)
    if (!meta) return []
    return [`Current ${meta.label}`, meta.label]
  })
  const headers = ['Rippling profile number', 'Email', 'Name', ...fieldHeaders]

  const dataRows = employees.map((employee) => {
    const row = buildIdentityColumns(employee)
    for (const fieldKey of selectedFieldKeys) {
      const current = getCurrentValue(employee, fieldKey)
      row.push(current ?? '')
      row.push(includeValues ? current ?? '' : '')
    }
    return row
  })
  return [headers, ...dataRows]
}

export function buildMakeChangesDraftRows({
  employees,
  selectedFieldKeys,
  bulkValues,
  cellOverrides,
  uniformByField,
}) {
  const fieldHeaders = selectedFieldKeys.flatMap((fieldKey) => {
    const meta = FIELDS_BY_KEY.get(fieldKey)
    if (!meta) return []
    return [`Current ${meta.label}`, meta.label]
  })
  const headers = ['Rippling profile number', 'Email', 'Name', ...fieldHeaders]

  const dataRows = employees.map((employee) => {
    const row = buildIdentityColumns(employee)
    for (const fieldKey of selectedFieldKeys) {
      const current = getCurrentValue(employee, fieldKey)
      const mode = uniformByField?.[fieldKey] ?? 'uniform'
      const bulk = bulkValues?.[fieldKey]
      const override = cellOverrides?.[employee.id]?.[fieldKey]
      const draftValue = mode === 'unique' ? override ?? bulk ?? '' : bulk ?? ''
      row.push(current ?? '')
      row.push(draftValue)
    }
    return row
  })
  return [headers, ...dataRows]
}

export function applyCsvValueImport({
  parsed,
  inferredMapping,
  selectedFieldKeys,
  employees = EMPLOYEES,
  currentState = {},
}) {
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]))
  const { identityMapping, newValueColumnsByField } = inferredMapping

  const fromValidation = []
  const duplicateIds = new Set()
  const seenIds = new Set()
  const matchedRowIds = []
  const errors = []
  const valueByFieldByEmployee = {}

  function getCurrentDraftCellValue(employeeId, fieldKey) {
    const mode = currentState.uniformByField?.[fieldKey] ?? 'uniform'
    const bulk = currentState.bulkValues?.[fieldKey]
    const override = currentState.cellOverrides?.[employeeId]?.[fieldKey]
    return mode === 'unique' ? override ?? bulk ?? '' : bulk ?? ''
  }

  for (let rowIndex = 0; rowIndex < parsed.rows.length; rowIndex += 1) {
    const row = parsed.rows[rowIndex]
    const profile = normalizeCsvValue(
      identityMapping.ProfileNumber !== undefined ? row[identityMapping.ProfileNumber] : '',
    )
    const email = normalizeCsvValue(
      identityMapping.Email !== undefined ? row[identityMapping.Email] : '',
    )
    const name = normalizeCsvValue(
      identityMapping.Name !== undefined ? row[identityMapping.Name] : '',
    )

    const employee = employees.find((candidate) => {
      if (profile && Number(profile) === Number(candidate.profileNumber)) return true
      if (email && email.toLowerCase() === String(candidate.email ?? '').toLowerCase()) return true
      if (name && name.toLowerCase() === String(candidate.fullName ?? '').toLowerCase()) return true
      return false
    })

    if (!employee) {
      errors.push({
        row: rowIndex + 2,
        column: 'identity',
        message: 'Could not match employee from identity columns',
      })
      continue
    }

    if (seenIds.has(employee.id)) {
      duplicateIds.add(employee.id)
      errors.push({
        row: rowIndex + 2,
        column: 'identity',
        message: `Duplicate employee row for ${employee.fullName}`,
      })
      continue
    }
    seenIds.add(employee.id)
    matchedRowIds.push(employee.id)
    valueByFieldByEmployee[employee.id] = valueByFieldByEmployee[employee.id] ?? {}

    for (const fieldKey of selectedFieldKeys) {
      const columnIndex = newValueColumnsByField[fieldKey]
      if (columnIndex === undefined) continue
      const rawValue = row[columnIndex]
      const normalized = normalizeFieldValue(fieldKey, rawValue, employees)
      if (!normalized.ok) {
        errors.push({
          row: rowIndex + 2,
          column: parsed.headers[columnIndex] ?? fieldKey,
          message: normalized.message,
        })
        continue
      }
      if (normalized.isNoChange) continue
      valueByFieldByEmployee[employee.id][fieldKey] = normalized.normalized
      const previous = getCurrentDraftCellValue(employee.id, fieldKey)
      if (previous !== normalized.normalized) {
        fromValidation.push({ employeeId: employee.id, fieldKey, value: normalized.normalized })
      }
    }
  }

  const bulkValues = {}
  const cellOverrides = {}
  const uniformByField = {}

  for (const fieldKey of selectedFieldKeys) {
    const valuesForField = matchedRowIds
      .map((employeeId) => valueByFieldByEmployee?.[employeeId]?.[fieldKey])
      .filter((value) => value !== undefined)

    if (valuesForField.length === 0) continue
    const uniqueValues = [...new Set(valuesForField)]
    if (uniqueValues.length === 1) {
      bulkValues[fieldKey] = uniqueValues[0]
      uniformByField[fieldKey] = 'uniform'
      continue
    }

    uniformByField[fieldKey] = 'unique'
    for (const employeeId of matchedRowIds) {
      const value = valueByFieldByEmployee?.[employeeId]?.[fieldKey]
      if (value === undefined) continue
      const employeeExists = employeeById.has(employeeId)
      if (!employeeExists) continue
      cellOverrides[employeeId] = {
        ...(cellOverrides[employeeId] ?? {}),
        [fieldKey]: value,
      }
    }
  }

  return {
    summary: {
      matchedRows: matchedRowIds.length,
      duplicateRows: duplicateIds.size,
      changedCells: fromValidation.length,
      errorCount: errors.length,
    },
    matchedRowIds,
    duplicateIds: [...duplicateIds],
    errors,
    nextStatePatch: { bulkValues, cellOverrides, uniformByField },
  }
}

// ── Multi-pass import engine with ambiguous employee support ─────────────────

/**
 * First pass: resolve identities (including ambiguous) and validate field values.
 * Returns a preliminary result that can be fed into resolveAmbiguities() after
 * the user picks matches for any ambiguous rows.
 */
export function computeImportPrelim({
  parsed,
  inferredMapping,
  selectedFieldKeys = [],
  employees = EMPLOYEES,
}) {
  const { identityMapping, newValueColumnsByField = {} } = inferredMapping
  const matchedRows = []   // { rowIndex, employeeId, rowValues }
  const ambiguousRows = [] // { rowIndex, candidateIds, raw, rowValues }
  const missedRows = []    // { rowIndex, raw }
  const duplicateIds = new Set()
  const seenIds = new Set()
  const errors = []

  for (let rowIndex = 0; rowIndex < parsed.rows.length; rowIndex += 1) {
    const row = parsed.rows[rowIndex]
    const resolution = resolveEmployeeRow(row, identityMapping, employees)

    if (resolution.status === 'missed') {
      missedRows.push({ rowIndex, raw: resolution.raw })
      continue
    }

    const rowValues = extractRowValues(
      row, newValueColumnsByField, selectedFieldKeys, employees, errors, rowIndex,
    )

    if (resolution.status === 'ambiguous') {
      ambiguousRows.push({
        rowIndex,
        candidateIds: resolution.candidateIds,
        raw: resolution.raw,
        rowValues,
      })
      continue
    }

    // status === 'auto'
    const { matchId: employeeId } = resolution
    if (seenIds.has(employeeId)) {
      duplicateIds.add(employeeId)
      const emp = employees.find((e) => e.id === employeeId)
      errors.push({
        row: rowIndex + 2,
        column: 'identity',
        message: `Duplicate employee row for ${emp?.fullName ?? employeeId}`,
      })
      continue
    }
    seenIds.add(employeeId)
    matchedRows.push({ rowIndex, employeeId, rowValues })
  }

  return { matchedRows, ambiguousRows, missedRows, duplicateIds, seenIds, errors }
}

function extractRowValues(row, newValueColumnsByField, selectedFieldKeys, employees, errors, rowIndex) {
  const rowValues = {}
  for (const fieldKey of selectedFieldKeys) {
    const colIdx = newValueColumnsByField[fieldKey]
    if (colIdx === undefined) continue
    const rawValue = row[colIdx]
    const normalized = normalizeFieldValue(fieldKey, rawValue, employees)
    if (!normalized.ok) {
      errors.push({ row: rowIndex + 2, column: fieldKey, message: normalized.message })
      continue
    }
    if (!normalized.isNoChange) {
      rowValues[fieldKey] = normalized.normalized
    }
  }
  return rowValues
}

/**
 * Second pass: given the preliminary result and user overrides for ambiguous rows,
 * produce the final nextStatePatch.
 *
 * overrides: { [rowIndex]: employeeId } — user picks for ambiguous rows
 */
export function resolveAmbiguities(prelim, overrides, selectedFieldKeys, employees, currentState = {}) {
  const { matchedRows, ambiguousRows, duplicateIds, errors } = prelim

  // Combine matched rows with user-resolved ambiguous rows
  const allRows = [...matchedRows]
  let ambiguousPending = 0
  for (const ambigRow of ambiguousRows) {
    const pickedId = overrides[ambigRow.rowIndex]
    if (pickedId) {
      allRows.push({ rowIndex: ambigRow.rowIndex, employeeId: pickedId, rowValues: ambigRow.rowValues })
    } else {
      ambiguousPending += 1
    }
  }

  // Build bulkValues / cellOverrides / uniformByField
  const valueByFieldByEmployee = {}
  const allEmployeeIds = []
  for (const { employeeId, rowValues } of allRows) {
    allEmployeeIds.push(employeeId)
    valueByFieldByEmployee[employeeId] = rowValues
  }

  const bulkValues = {}
  const cellOverrides = {}
  const uniformByField = {}
  let changedCells = 0

  for (const fieldKey of selectedFieldKeys) {
    const valuesForField = allEmployeeIds
      .map((id) => valueByFieldByEmployee[id]?.[fieldKey])
      .filter((v) => v !== undefined)
    if (valuesForField.length === 0) continue

    const uniqueValues = [...new Set(valuesForField)]
    if (uniqueValues.length === 1) {
      bulkValues[fieldKey] = uniqueValues[0]
      uniformByField[fieldKey] = 'uniform'
    } else {
      uniformByField[fieldKey] = 'unique'
      for (const empId of allEmployeeIds) {
        const value = valueByFieldByEmployee[empId]?.[fieldKey]
        if (value !== undefined) {
          cellOverrides[empId] = { ...(cellOverrides[empId] ?? {}), [fieldKey]: value }
        }
      }
    }

    // Count cells that differ from current draft state
    for (const empId of allEmployeeIds) {
      const value = valueByFieldByEmployee[empId]?.[fieldKey]
      if (value === undefined) continue
      const mode = currentState.uniformByField?.[fieldKey] ?? 'uniform'
      const bulk = currentState.bulkValues?.[fieldKey]
      const override = currentState.cellOverrides?.[empId]?.[fieldKey]
      const currentDraft = mode === 'unique' ? override ?? bulk ?? '' : bulk ?? ''
      if (value !== currentDraft) changedCells += 1
    }
  }

  return {
    summary: {
      matchedRows: allRows.length,
      ambiguousResolved: ambiguousRows.length - ambiguousPending,
      ambiguousPending,
      missedRows: prelim.missedRows.length,
      duplicateRows: duplicateIds.size,
      changedCells,
      errorCount: errors.length,
    },
    errors,
    nextStatePatch: { bulkValues, cellOverrides, uniformByField },
  }
}
