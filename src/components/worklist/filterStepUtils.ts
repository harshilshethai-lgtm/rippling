import { filterAttributeSchema, type Employee, type FilterAttribute, type FilterAttributeSchema } from '../../mock/employees'
import type { DraftState, FilterValue, WorklistFilter } from './filterStepTypes'

export const FILTER_SCHEMA_BY_ATTRIBUTE = new Map<FilterAttribute, FilterAttributeSchema>(
  filterAttributeSchema.map((item) => [item.attribute, item]),
)

export const CHIP_COLUMN_ATTRIBUTES: FilterAttribute[] = [
  'Department',
  'Manager',
  'Title',
  'Level',
  'Location',
  'Country',
  'Employment type',
  'Tenure',
  'Start date',
]

export function cn(...tokens: Array<string | false | null | undefined>) {
  return tokens.filter(Boolean).join(' ')
}

export function createEmptyDraft(): DraftState {
  return {
    attribute: null,
    operator: '',
    value: '',
    optionSearch: '',
  }
}

export function getDefaultValue(schema: FilterAttributeSchema): FilterValue {
  if (schema.kind === 'categorical') return []
  if (schema.kind === 'text') return ''
  if (schema.kind === 'numeric') return 1
  return { from: '', to: '' }
}

export function formatFilterValue(filter: WorklistFilter) {
  if (Array.isArray(filter.value)) return filter.value.join(', ')
  if (typeof filter.value === 'number') return String(filter.value)
  if (typeof filter.value === 'string') return filter.value || '...'
  if (filter.operator === 'between') return `${filter.value.from || '...'} to ${filter.value.to || '...'}`
  return filter.value.from || filter.value.to || '...'
}

export function employeeValue(employee: Employee, attribute: FilterAttribute) {
  switch (attribute) {
    case 'Department':
      return employee.department
    case 'Manager':
      return employee.manager
    case 'Title':
      return employee.title
    case 'Level':
      return Number(employee.level.slice(1))
    case 'Location':
      return employee.location
    case 'Country':
      return employee.country
    case 'Employment type':
      return employee.employmentType
    case 'Tenure':
      return Number((employee.tenureMonths / 12).toFixed(1))
    case 'Start date':
      return employee.startDate
    default:
      return ''
  }
}

export function filterMatches(employee: Employee, filter: WorklistFilter) {
  const schema = FILTER_SCHEMA_BY_ATTRIBUTE.get(filter.attribute)
  if (!schema) return true

  if (schema.kind === 'categorical') {
    const values = Array.isArray(filter.value) ? filter.value : []
    if (values.length === 0) return true
    return values.includes(String(employeeValue(employee, filter.attribute)))
  }

  if (schema.kind === 'text') {
    const value = String(filter.value).trim().toLowerCase()
    if (!value) return true
    const source = String(employeeValue(employee, filter.attribute)).toLowerCase()
    return filter.operator === 'is' ? source === value : source.includes(value)
  }

  if (schema.kind === 'numeric') {
    const target = Number(filter.value)
    if (Number.isNaN(target)) return true
    const actual = Number(employeeValue(employee, filter.attribute))
    if (filter.operator === 'greater than') return actual > target
    if (filter.operator === 'less than') return actual < target
    return actual === target
  }

  const actualDate = new Date(String(employeeValue(employee, filter.attribute))).getTime()
  if (Number.isNaN(actualDate)) return true
  const value = filter.value as { from: string; to: string }

  if (filter.operator === 'between') {
    if (!value.from || !value.to) return true
    const from = new Date(value.from).getTime()
    const to = new Date(value.to).getTime()
    if (Number.isNaN(from) || Number.isNaN(to)) return true
    return actualDate >= from && actualDate <= to
  }

  if (!value.from) return true
  const edge = new Date(value.from).getTime()
  if (Number.isNaN(edge)) return true
  return filter.operator === 'before' ? actualDate < edge : actualDate > edge
}

export function isDraftComplete(draft: DraftState) {
  if (!draft.attribute) return false
  const schema = FILTER_SCHEMA_BY_ATTRIBUTE.get(draft.attribute)
  if (!schema) return false
  if (schema.kind === 'categorical') return Array.isArray(draft.value) && draft.value.length > 0
  if (schema.kind === 'text') return typeof draft.value === 'string' && draft.value.trim().length > 0
  if (schema.kind === 'numeric') return Number.isFinite(Number(draft.value))
  if (draft.operator === 'between') {
    return typeof draft.value === 'object' && !Array.isArray(draft.value) && Boolean(draft.value.from && draft.value.to)
  }
  return typeof draft.value === 'object' && !Array.isArray(draft.value) && Boolean(draft.value.from)
}

export function rowCellText(employee: Employee, attribute: FilterAttribute) {
  if (attribute === 'Tenure') {
    const years = (employee.tenureMonths / 12).toFixed(1)
    return `${years} yrs`
  }
  return String(employeeValue(employee, attribute))
}

export function categoricalValue(employee: Employee, attribute: FilterAttribute) {
  const value = employeeValue(employee, attribute)
  return typeof value === 'number' ? String(value) : String(value)
}
