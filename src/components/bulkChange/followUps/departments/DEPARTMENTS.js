import {
  Building2,
  CreditCard,
  DollarSign,
  GraduationCap,
  Laptop,
  ShieldCheck,
  UserCog,
} from 'lucide-react'

/**
 * Catalogue of the seven functional follow-up departments.
 *
 * Each department represents a human-owned area of work triggered by
 * platform-level or user-workflow-level dependencies on a changing property.
 * The order here is the canonical render order in the sub-tracker.
 *
 * Per the design contract:
 *   - Only departments whose `id` appears in FIELD_DEPARTMENT_MAP for at least
 *     one currently-selected field are rendered in the sub-tracker.
 *   - Each department has a SINGLE owner that is applied to all tasks under it.
 */
export const DEPARTMENTS = [
  {
    id: 'hr',
    label: 'HR',
    icon: UserCog,
    blurb: 'Employee records, partner alignment, and people data',
  },
  {
    id: 'payroll',
    label: 'Payroll',
    icon: DollarSign,
    blurb: 'Paychecks, currency, and pay-cycle alignment',
  },
  {
    id: 'it',
    label: 'IT',
    icon: Laptop,
    blurb: 'Identity, devices, and access policy',
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: CreditCard,
    blurb: 'Equity, spend, and accruals',
  },
  {
    id: 'global',
    label: 'Global',
    icon: Building2,
    blurb: 'Tax, legal entity, and country support',
  },
  {
    id: 'benefits',
    label: 'Benefits',
    icon: ShieldCheck,
    blurb: 'Medical, retirement, and carrier coverage',
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: GraduationCap,
    blurb: 'Training, documentation, and regulatory readiness',
  },
]

export const DEPARTMENT_ORDER = DEPARTMENTS.map((d) => d.id)

export const DEPARTMENTS_BY_ID = new Map(DEPARTMENTS.map((d) => [d.id, d]))

export function getDepartment(deptId) {
  return DEPARTMENTS_BY_ID.get(deptId) ?? null
}
