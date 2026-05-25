import { describe, expect, it } from 'vitest'
import { EMPLOYEES, DEPARTMENTS, LOCATIONS, MANAGERS } from '../../../../data/employees'
import { parseAiPrompt } from '../../aiParser'
import { parseScenarioPrompt } from '../scenarioParser'
import { parseChangePrompt, CHANGE_SUGGESTIONS } from '../changeParser'

/**
 * End-to-end coverage for all three step-level Ask AIs:
 *
 *   • Page 1 (Select people)  → parseAiPrompt        — filter chips
 *   • Page 2 (Define changes) → parseScenarioPrompt  — properties/template
 *   • Page 3 (Make changes)   → parseChangePrompt    — scope + value changes
 *
 * These tests double as documentation of the canonical example phrasings
 * shipped in the popovers — if they regress, the demo prompts will break.
 */

const titles = [...new Set(EMPLOYEES.map((e) => e.title).filter(Boolean))]
const aiContext = {
  employees: EMPLOYEES,
  departments: DEPARTMENTS,
  locations: LOCATIONS,
  managers: MANAGERS,
  titles,
}

function chipFor(chips, attribute) {
  return chips.find((c) => c.attribute === attribute)
}

function changeFor(changes, fieldKey) {
  return changes.find((c) => c.fieldKey === fieldKey)
}

// ─── Page 1: filter picking via aiParser ────────────────────────────────

describe('Page 1: parseAiPrompt (Select people Ask AI)', () => {
  it('detects engineers in NYC who report to @Maya Pan', () => {
    const { chips } = parseAiPrompt('Engineers in NYC who report to @Maya Pan', aiContext)
    expect(chipFor(chips, 'Department')?.values).toContain('Engineering')
    expect(chipFor(chips, 'Work location')?.values).toContain('New York')
    expect(chipFor(chips, 'Manager')?.values).toContain('Maya Pan')
  })

  it('detects contractors in Austin', () => {
    const { chips } = parseAiPrompt('Contractors in Austin', aiContext)
    expect(chipFor(chips, 'Employment type')?.values).toContain('Contractor')
    expect(chipFor(chips, 'Work location')?.values).toContain('Austin')
  })

  it('detects EMEA scope without bleeding into US Remote', () => {
    const { chips } = parseAiPrompt('Sales reps in Europe', aiContext)
    const loc = chipFor(chips, 'Work location')?.values || []
    expect(loc).toContain('London')
    expect(loc).toContain('Berlin')
    expect(loc).not.toContain('Remote (US)')
  })

  it('detects capital-cased title keywords (regression for case-insensitive flag)', () => {
    const { chips } = parseAiPrompt('VPs in San Francisco', aiContext)
    const titleChip = chipFor(chips, 'Title')
    expect(titleChip).toBeTruthy()
    expect(titleChip.values.some((t) => t.startsWith('VP'))).toBe(true)
    expect(chipFor(chips, 'Work location')?.values).toContain('San Francisco')
  })

  it('surfaces an unhandled note for unsupported attributes', () => {
    const { unhandled } = parseAiPrompt('Engineers with salary over 200k', aiContext)
    expect(unhandled.join(' ')).toMatch(/salary|comp/i)
  })
})

// ─── Page 2: property making via scenarioParser ─────────────────────────

describe('Page 2: parseScenarioPrompt (Define changes Ask AI)', () => {
  it('matches the reorg template', () => {
    const r = parseScenarioPrompt('Run a reorg — rewire managers, departments, and levels')
    expect(r.templateId).toBe('reorg')
    expect(r.fieldKeys).toEqual(expect.arrayContaining(['manager', 'department', 'level']))
  })

  it('matches the promotion template with comp fields', () => {
    const r = parseScenarioPrompt('Promotion cycle — update title, level, and base comp')
    expect(r.templateId).toBe('promotion')
    expect(r.fieldKeys).toEqual(
      expect.arrayContaining(['title', 'level', 'baseCompensation']),
    )
  })

  it('matches the offboard template', () => {
    const r = parseScenarioPrompt(
      'Lock devices and revoke access for offboarded employees',
    )
    expect(r.templateId).toBe('offboard')
    expect(r.fieldKeys).toEqual(expect.arrayContaining(['accountStatus', 'deviceStatus']))
  })

  it('falls back to ad-hoc field detection without a template', () => {
    const r = parseScenarioPrompt('Update everyone\'s time zone and pay schedule')
    // No clean template match — but synonym map still pulls in the fields.
    expect(r.fieldKeys).toEqual(expect.arrayContaining(['timeZone', 'paySchedule']))
  })

  it('returns a helpful unhandled message for unrecognized prompts', () => {
    const r = parseScenarioPrompt('do the thing for the people')
    expect(r.fieldKeys).toEqual([])
    expect(r.unhandled.length).toBeGreaterThan(0)
  })
})

// ─── Page 3: change making via changeParser ─────────────────────────────

describe('Page 3: parseChangePrompt (Make changes Ask AI)', () => {
  it('"Move all Austin employees to San Francisco" → workLocation', () => {
    const r = parseChangePrompt(
      'Move all Austin employees to San Francisco',
      aiContext,
    )
    expect(chipFor(r.scopeChips, 'Work location')?.values).toEqual(['Austin'])
    expect(changeFor(r.changes, 'workLocation')?.value).toBe('San Francisco')
  })

  it('"Move all reporting to @Maya Pan to @Harshil Sheth" → manager re-assignment', () => {
    const r = parseChangePrompt(
      'Move all reporting to @Maya Pan to @Harshil Sheth',
      aiContext,
    )
    expect(chipFor(r.scopeChips, 'Manager')?.values).toEqual(['Maya Pan'])
    const change = changeFor(r.changes, 'manager')
    expect(change?.value).toBe('Harshil Sheth')
    // Harshil isn't in EMPLOYEES — we still store the verbatim name.
    expect(EMPLOYEES.some((e) => e.fullName === 'Harshil Sheth')).toBe(false)
  })

  it('"Promote all engineers in NYC to P4" → level=P4 with compound scope', () => {
    const r = parseChangePrompt('Promote all engineers in NYC to P4', aiContext)
    expect(chipFor(r.scopeChips, 'Department')?.values).toEqual(['Engineering'])
    expect(chipFor(r.scopeChips, 'Work location')?.values).toEqual(['New York'])
    expect(changeFor(r.changes, 'level')?.value).toBe('P4')
  })

  it('"Switch all contractors to Full-time" → employmentType', () => {
    const r = parseChangePrompt('Switch all contractors to Full-time', aiContext)
    expect(chipFor(r.scopeChips, 'Employment type')?.values).toEqual(['Contractor'])
    expect(changeFor(r.changes, 'employmentType')?.value).toBe('Full-time')
  })

  it('"Set all Sales to Bi-weekly pay schedule" → paySchedule', () => {
    const r = parseChangePrompt('Set all Sales to Bi-weekly pay schedule', aiContext)
    expect(chipFor(r.scopeChips, 'Department')?.values).toEqual(['Sales'])
    expect(changeFor(r.changes, 'paySchedule')?.value).toBe('Bi-weekly')
  })

  it('"Move all London employees to Remote (EMEA)" picks the specific location', () => {
    const r = parseChangePrompt(
      'Move all London employees to Remote (EMEA)',
      aiContext,
    )
    expect(chipFor(r.scopeChips, 'Work location')?.values).toEqual(['London'])
    // Critical: Remote (EMEA) must win over the bare "remote" alias which
    // would otherwise also surface Remote (US).
    expect(changeFor(r.changes, 'workLocation')?.value).toBe('Remote (EMEA)')
  })

  it('handles a prompt with no scope — change applies to everyone', () => {
    const r = parseChangePrompt('Move everyone to San Francisco', aiContext)
    expect(r.scopeChips).toEqual([])
    expect(changeFor(r.changes, 'workLocation')?.value).toBe('San Francisco')
  })

  it('handles multiple changes joined by "and"', () => {
    const r = parseChangePrompt(
      'Move Austin people to San Francisco and bump them to P4',
      aiContext,
    )
    expect(chipFor(r.scopeChips, 'Work location')?.values).toEqual(['Austin'])
    expect(changeFor(r.changes, 'workLocation')?.value).toBe('San Francisco')
    expect(changeFor(r.changes, 'level')?.value).toBe('P4')
  })

  it('surfaces an unhandled note when no change can be extracted', () => {
    const r = parseChangePrompt('all the people in austin', aiContext)
    expect(r.changes).toEqual([])
    expect(r.unhandled.length).toBeGreaterThan(0)
  })

  it('every shipped CHANGE_SUGGESTION parses to at least one change', () => {
    for (const { prompt } of CHANGE_SUGGESTIONS) {
      const r = parseChangePrompt(prompt, aiContext)
      expect(r.changes.length, `"${prompt}" should produce a change`).toBeGreaterThan(0)
    }
  })
})
