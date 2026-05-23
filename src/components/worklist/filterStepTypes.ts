import type { Employee, FilterAttribute } from '../../mock/employees'

export type FilterValue = string | string[] | number | { from: string; to: string }

export type WorklistFilter = {
  id: string
  attribute: FilterAttribute
  operator: string
  value: FilterValue
}

export type DraftState = {
  attribute: FilterAttribute | null
  operator: string
  value: FilterValue
  optionSearch: string
}

export type WorklistStepProps = {
  onBack?: () => void
  initialSelectedIds?: string[]
}

export type EmployeeMap = Map<string, Employee>
