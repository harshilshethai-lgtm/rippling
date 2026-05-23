import {
  Briefcase,
  MapPin,
  UserCog,
  Tag,
  Clock,
  CircleDot,
} from 'lucide-react'

/**
 * Schema for each filter attribute on the Bulk Change "User Selection" step.
 * Mirrors the categorical filter contract used by the People page so the
 * Bulk Change flow stays in sync with the rest of the prototype.
 */
export const FILTER_SCHEMA = {
  Department: { field: 'department', icon: Briefcase, searchable: false },
  'Work location': { field: 'location', icon: MapPin, searchable: false },
  Manager: { field: 'manager', icon: UserCog, searchable: true },
  Title: { field: 'title', icon: Tag, searchable: true },
  'Employment type': { field: 'employmentType', icon: Clock, searchable: false },
  Status: { field: 'status', icon: CircleDot, searchable: false },
}

export const FILTER_ATTRIBUTES = Object.keys(FILTER_SCHEMA)

export function chipMatches(employee, chip) {
  if (!chip.values || chip.values.length === 0) return true
  const schema = FILTER_SCHEMA[chip.attribute]
  if (!schema) return true
  return chip.values.includes(employee[schema.field])
}

/** AND across chips, OR within a single chip's values. */
export function applyFilters(employees, chips) {
  if (chips.length === 0) return []
  return employees.filter((employee) => chips.every((chip) => chipMatches(employee, chip)))
}

/**
 * Linear-style adaptive scope: when the user is choosing values for a given
 * attribute, the option list should reflect employees that already pass all
 * the OTHER active chips. The chip currently being edited is excluded so its
 * own values don't shrink its option set.
 */
export function scopeOptionsForAttribute(allEmployees, attribute, chips, editingChipId) {
  const schema = FILTER_SCHEMA[attribute]
  if (!schema) return []
  const others = chips.filter((chip) => chip.id !== editingChipId)
  const scopedEmployees = others.length === 0
    ? allEmployees
    : allEmployees.filter((employee) => others.every((chip) => chipMatches(employee, chip)))

  const seen = new Set()
  const out = []
  for (const employee of scopedEmployees) {
    const value = employee[schema.field]
    if (!value) continue
    if (seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out.sort((a, b) => a.localeCompare(b))
}

/** Returns the active filter attributes that should render as table columns. */
export function dynamicColumnsFromChips(chips) {
  const seen = new Set()
  const columns = []
  for (const chip of chips) {
    if (seen.has(chip.attribute)) continue
    if (!FILTER_SCHEMA[chip.attribute]) continue
    seen.add(chip.attribute)
    columns.push(chip.attribute)
  }
  return columns
}

/** Combines @-mentioned employees and filter matches, mention-first, deduped. */
export function buildWorklist(allEmployees, chips, mentionedIds) {
  const filtered = applyFilters(allEmployees, chips)
  const filteredIds = new Set(filtered.map((employee) => employee.id))

  const mentionedEntries = []
  for (const id of mentionedIds) {
    const employee = allEmployees.find((candidate) => candidate.id === id)
    if (!employee) continue
    mentionedEntries.push({
      employee,
      sources: filteredIds.has(employee.id) ? ['mention', 'filter'] : ['mention'],
    })
  }

  const filterEntries = filtered
    .filter((employee) => !mentionedIds.has(employee.id))
    .map((employee) => ({ employee, sources: ['filter'] }))

  return [...mentionedEntries, ...filterEntries]
}

/** Search candidates for the @-mention dropdown. */
export function mentionableMatches(allEmployees, query, excludeIds, limit = 8) {
  const trimmed = query.trim().toLowerCase()
  const exclude = excludeIds || new Set()
  const pool = allEmployees.filter((employee) => !exclude.has(employee.id))
  if (!trimmed) {
    return pool.slice(0, limit)
  }
  const matches = []
  for (const employee of pool) {
    const haystack = `${employee.fullName} ${employee.email} ${employee.title}`.toLowerCase()
    if (haystack.includes(trimmed)) matches.push(employee)
    if (matches.length >= limit) break
  }
  return matches
}

export function makeChipId() {
  return `chip-${Math.random().toString(36).slice(2, 8)}`
}

export function dedupeValues(values) {
  return [...new Set(values)]
}
