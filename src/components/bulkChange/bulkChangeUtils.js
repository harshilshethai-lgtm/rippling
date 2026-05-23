import {
  Briefcase,
  MapPin,
  UserCog,
  Tag,
  Clock,
  CircleDot,
  CalendarClock,
} from 'lucide-react'

/**
 * Schema for each filter attribute on the Bulk Change "User Selection" step.
 * Mirrors the categorical filter contract used by the People page so the
 * Bulk Change flow stays in sync with the rest of the prototype.
 *
 * `kind` distinguishes simple multi-select (categorical) from date-range
 * filters. The `Joined` attribute is AI-only and intentionally absent from
 * `FILTER_ATTRIBUTES` so it doesn't appear in the manual FilterPicker.
 */
export const FILTER_SCHEMA = {
  Department: { field: 'department', icon: Briefcase, kind: 'categorical', searchable: false },
  'Work location': { field: 'location', icon: MapPin, kind: 'categorical', searchable: false },
  Manager: { field: 'manager', icon: UserCog, kind: 'categorical', searchable: true },
  Title: { field: 'title', icon: Tag, kind: 'categorical', searchable: true },
  'Employment type': { field: 'employmentType', icon: Clock, kind: 'categorical', searchable: false },
  Status: { field: 'status', icon: CircleDot, kind: 'categorical', searchable: false },
  Joined: { field: 'startDate', icon: CalendarClock, kind: 'date_range', searchable: false },
}

// Manual picker only sees categorical attributes. `Joined` is AI-only.
export const FILTER_ATTRIBUTES = Object.keys(FILTER_SCHEMA).filter(
  (attribute) => FILTER_SCHEMA[attribute].kind === 'categorical',
)

function dateRangeMatches(value, range) {
  if (!value || !range) return true
  const ts = new Date(value).getTime()
  if (Number.isNaN(ts)) return true
  if (range.from) {
    const fromTs = new Date(range.from).getTime()
    if (!Number.isNaN(fromTs) && ts < fromTs) return false
  }
  if (range.to) {
    const toTs = new Date(range.to).getTime()
    if (!Number.isNaN(toTs) && ts > toTs) return false
  }
  return true
}

export function chipMatches(employee, chip) {
  const schema = FILTER_SCHEMA[chip.attribute]
  if (!schema) return true

  if (schema.kind === 'date_range') {
    if (!chip.range) return true
    return dateRangeMatches(employee[schema.field], chip.range)
  }

  if (!chip.values || chip.values.length === 0) return true
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
  if (!schema || schema.kind !== 'categorical') return []
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

/**
 * Combines @-mentioned, CSV-imported, and filter-matched employees into a
 * single ordered worklist (mention-first, then CSV imports, then filter-only),
 * deduped on employee.id. Each entry's `sources` is a multi-tag array so the
 * worklist UI can render combined provenance like "CSV · Filter".
 */
export function buildWorklist(allEmployees, chips, mentionedIds, csvImportIds) {
  const filtered = applyFilters(allEmployees, chips)
  const filteredIds = new Set(filtered.map((employee) => employee.id))
  const csvIds = csvImportIds || new Set()

  function buildSources({ id, isMention, isCsv }) {
    const sources = []
    if (isMention) sources.push('mention')
    if (isCsv) sources.push('csv')
    if (filteredIds.has(id)) sources.push('filter')
    return sources
  }

  const seen = new Set()
  const out = []

  for (const id of mentionedIds) {
    const employee = allEmployees.find((candidate) => candidate.id === id)
    if (!employee || seen.has(employee.id)) continue
    seen.add(employee.id)
    out.push({
      employee,
      sources: buildSources({ id: employee.id, isMention: true, isCsv: csvIds.has(employee.id) }),
    })
  }

  for (const id of csvIds) {
    if (seen.has(id)) continue
    const employee = allEmployees.find((candidate) => candidate.id === id)
    if (!employee) continue
    seen.add(employee.id)
    out.push({
      employee,
      sources: buildSources({ id: employee.id, isMention: false, isCsv: true }),
    })
  }

  for (const employee of filtered) {
    if (seen.has(employee.id)) continue
    seen.add(employee.id)
    out.push({ employee, sources: ['filter'] })
  }

  return out
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

/** Render-friendly label for either categorical or date-range chips. */
export function formatChipValueLabel(chip) {
  const schema = FILTER_SCHEMA[chip.attribute]
  if (schema?.kind === 'date_range') {
    if (chip.range?.label) return chip.range.label
    if (chip.range?.from && chip.range?.to) {
      return `${chip.range.from} – ${chip.range.to}`
    }
    if (chip.range?.from) return `since ${chip.range.from}`
    if (chip.range?.to) return `before ${chip.range.to}`
    return '—'
  }

  const values = chip.values || []
  if (values.length === 0) return '—'
  if (values.length === 1) return values[0]
  if (values.length === 2) return `${values[0]}, ${values[1]}`
  return `${values[0]}, ${values[1]} +${values.length - 2}`
}

/** Localized 'Mar 2024' style label used by the dynamic Joined column. */
export function formatStartDate(startDate) {
  if (!startDate) return '—'
  const date = new Date(startDate)
  if (Number.isNaN(date.getTime())) return startDate
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
}
