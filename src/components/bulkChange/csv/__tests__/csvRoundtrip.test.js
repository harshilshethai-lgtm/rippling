import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { EMPLOYEES } from '../../../../data/employees'
import { parseCsv } from '../csvIo'
import { detectIdentityMapping, inferChangeSetFromHeaders } from '../csvMapping'
import { resolveAllEmployeeRows, resolveEmployeeRow } from '../csvValidation'
import {
  applyCsvValueImport,
  buildMakeChangesDraftRows,
  computeImportPrelim,
  resolveAmbiguities,
  toCsvString,
} from '../csvDraft'

function readFixture(name) {
  const fixturePath = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    'fixtures',
    name,
  )
  return fs.readFileSync(fixturePath, 'utf8')
}

describe('bulk-change csv engine', () => {
  it('resolves identity-only CSV rows', () => {
    const parsed = parseCsv(readFixture('identity-only.csv'))
    const identityMapping = detectIdentityMapping(parsed.headers)
    expect(identityMapping.ProfileNumber).toBe(0)
    expect(identityMapping.Email).toBe(1)
    expect(identityMapping.Name).toBe(2)

    const rows = resolveAllEmployeeRows(parsed.rows, identityMapping, EMPLOYEES)
    expect(rows).toHaveLength(3)
    expect(rows.every((row) => row.status === 'auto')).toBe(true)
  })

  it('infers field columns from current/new headers', () => {
    const parsed = parseCsv(readFixture('inferred-field.csv'))
    const inferred = inferChangeSetFromHeaders(parsed.headers)
    expect(inferred.inferredFieldKeys).toContain('manager')
    expect(inferred.inferredFieldKeys).toContain('department')
    expect(inferred.newValueColumnsByField.manager).toBeGreaterThan(-1)
    expect(inferred.currentValueColumnsByField.manager).toBeGreaterThan(-1)
  })

  it('maps heterogeneous values to unique overrides', () => {
    const parsed = parseCsv(readFixture('heterogeneous-values.csv'))
    const inferred = inferChangeSetFromHeaders(parsed.headers)
    const result = applyCsvValueImport({
      parsed,
      inferredMapping: inferred,
      selectedFieldKeys: ['title'],
      employees: EMPLOYEES,
      currentState: {},
    })

    expect(result.summary.errorCount).toBe(0)
    expect(result.summary.changedCells).toBe(2)
    expect(result.nextStatePatch.uniformByField.title).toBe('unique')
    expect(Object.keys(result.nextStatePatch.cellOverrides)).toHaveLength(2)
  })

  it('applies clear sentinel values', () => {
    const parsed = parseCsv(readFixture('clear-values.csv'))
    const inferred = inferChangeSetFromHeaders(parsed.headers)
    const result = applyCsvValueImport({
      parsed,
      inferredMapping: inferred,
      selectedFieldKeys: ['manager'],
      employees: EMPLOYEES,
      currentState: {
        bulkValues: { manager: 'Existing Manager' },
        cellOverrides: {},
        uniformByField: { manager: 'uniform' },
      },
    })

    expect(result.summary.errorCount).toBe(0)
    expect(result.summary.changedCells).toBe(1)
    expect(result.nextStatePatch.bulkValues.manager).toBe('')
  })

  it('flags duplicate employee rows', () => {
    const parsed = parseCsv([
      'Rippling profile number,Name,Title',
      '1,,VP of Operations',
      '1,,VP of Engineering',
    ].join('\n'))
    const inferred = inferChangeSetFromHeaders(parsed.headers)
    const result = applyCsvValueImport({
      parsed,
      inferredMapping: inferred,
      selectedFieldKeys: ['title'],
      employees: EMPLOYEES,
      currentState: {},
    })

    expect(result.summary.duplicateRows).toBe(1)
    expect(result.summary.errorCount).toBeGreaterThan(0)
  })

  it('returns ambiguous matches for first-name-only identity', () => {
    const result = resolveEmployeeRow(['Eric'], { Name: 0 }, EMPLOYEES)
    expect(result.status).toBe('ambiguous')
    expect(result.candidateIds.length).toBeGreaterThan(1)
  })

  // ── computeImportPrelim / resolveAmbiguities tests ───────────────────────

  it('computeImportPrelim surfaces ambiguous rows instead of erroring', () => {
    // "Eric" matches multiple employees (first-name only)
    const parsed = parseCsv('Rippling profile number,Name,Title\n,Eric,VP of Engineering')
    const inferred = inferChangeSetFromHeaders(parsed.headers)
    const prelim = computeImportPrelim({
      parsed,
      inferredMapping: inferred,
      selectedFieldKeys: ['title'],
      employees: EMPLOYEES,
    })
    expect(prelim.ambiguousRows.length).toBeGreaterThan(0)
    expect(prelim.matchedRows.length).toBe(0)
    expect(prelim.errors.length).toBe(0) // identity ambiguity is NOT an error
  })

  it('resolveAmbiguities produces a patch when the user picks a match', () => {
    const parsed = parseCsv('Rippling profile number,Name,Title\n,Eric,VP of Engineering')
    const inferred = inferChangeSetFromHeaders(parsed.headers)
    const prelim = computeImportPrelim({
      parsed,
      inferredMapping: inferred,
      selectedFieldKeys: ['title'],
      employees: EMPLOYEES,
    })
    expect(prelim.ambiguousRows.length).toBeGreaterThan(0)

    // Pick the first candidate
    const firstCandidateId = prelim.ambiguousRows[0].candidateIds[0]
    const overrides = { [prelim.ambiguousRows[0].rowIndex]: firstCandidateId }

    const { summary, nextStatePatch } = resolveAmbiguities(
      prelim,
      overrides,
      ['title'],
      EMPLOYEES,
      {},
    )
    expect(summary.matchedRows).toBe(1)
    expect(summary.ambiguousPending).toBe(0)
    // "VP of Engineering" is a valid text field value — either in bulk or per-cell
    const hasValue =
      Boolean(nextStatePatch.bulkValues.title) ||
      Object.keys(nextStatePatch.cellOverrides).length > 0
    expect(hasValue).toBe(true)
  })

  it('resolveAmbiguities returns pending count for unresolved ambiguous rows', () => {
    const parsed = parseCsv('Rippling profile number,Name,Title\n,Eric,Staff Engineer')
    const inferred = inferChangeSetFromHeaders(parsed.headers)
    const prelim = computeImportPrelim({
      parsed,
      inferredMapping: inferred,
      selectedFieldKeys: ['title'],
      employees: EMPLOYEES,
    })
    // No overrides — ambiguous row is unresolved
    const { summary } = resolveAmbiguities(prelim, {}, ['title'], EMPLOYEES, {})
    expect(summary.ambiguousPending).toBe(prelim.ambiguousRows.length)
    expect(summary.matchedRows).toBe(0)
  })

  it('computeImportPrelim correctly identifies unmatched (missed) rows', () => {
    const parsed = parseCsv('Rippling profile number,Name,Title\n9999,Nobody Here,Engineer')
    const inferred = inferChangeSetFromHeaders(parsed.headers)
    const prelim = computeImportPrelim({
      parsed,
      inferredMapping: inferred,
      selectedFieldKeys: ['title'],
      employees: EMPLOYEES,
    })
    expect(prelim.missedRows.length).toBe(1)
    expect(prelim.matchedRows.length).toBe(0)
    expect(prelim.ambiguousRows.length).toBe(0)
  })

  it('treats export->import unchanged draft as no-op', () => {
    const selectedEmployees = EMPLOYEES.slice(0, 2)
    const currentState = {
      bulkValues: { title: 'VP of Operations' },
      cellOverrides: {},
      uniformByField: { title: 'uniform' },
    }
    const rows = buildMakeChangesDraftRows({
      employees: selectedEmployees,
      selectedFieldKeys: ['title'],
      bulkValues: currentState.bulkValues,
      cellOverrides: currentState.cellOverrides,
      uniformByField: currentState.uniformByField,
    })
    const parsed = parseCsv(toCsvString(rows))
    const inferred = inferChangeSetFromHeaders(parsed.headers)
    const result = applyCsvValueImport({
      parsed,
      inferredMapping: inferred,
      selectedFieldKeys: ['title'],
      employees: EMPLOYEES,
      currentState,
    })

    expect(result.summary.errorCount).toBe(0)
    expect(result.summary.changedCells).toBe(0)
  })
})
