import { EMPLOYEES } from '../../../data/employees'

/**
 * Field keys that should render a person-picker (MemberPickerPopover) instead
 * of a plain text input. The picker stores the selected employee's fullName.
 */
export const PERSON_FIELD_KEYS = new Set([
  'manager',
  'managerReviewer',
  'hrbp',
  'recruiter',
  'financePartner',
  'itPartner',
  'legalPartner',
  'payrollPartner',
  'benefitsPartner',
  'jobsManager',
  'approver',
])

// Derive unique department names from the employee dataset.
const DEPT_OPTIONS = [
  ...new Set(EMPLOYEES.map((e) => e.department).filter(Boolean)),
].sort()

// Derive unique location names from the employee dataset.
const LOCATION_OPTIONS = [
  ...new Set(EMPLOYEES.map((e) => e.location).filter(Boolean)),
].sort()

const TEAM_OPTIONS = [
  'Core Infrastructure',
  'Data Platform',
  'Growth',
  'People Operations',
  'Revenue Engineering',
  'Security & Compliance',
  'Support Engineering',
]

const JOB_FAMILY_OPTIONS = [
  'Administrative Support',
  'Customer Operations',
  'Engineering',
  'Finance & Accounting',
  'Human Resources',
  'Information Technology',
  'Legal & Compliance',
  'Marketing',
  'Product Management',
  'Sales',
]

const STATE_OPTIONS = [
  'California',
  'Colorado',
  'Florida',
  'Georgia',
  'Illinois',
  'Massachusetts',
  'New York',
  'Texas',
  'Washington',
]

const COUNTRY_OPTIONS = [
  'Australia',
  'Canada',
  'Germany',
  'India',
  'Singapore',
  'United Kingdom',
  'United States',
]

const LANGUAGE_OPTIONS = ['English', 'French', 'German', 'Hindi', 'Japanese', 'Mandarin', 'Spanish']

const VISA_OPTIONS = ['H-1B', 'L-1', 'N/A', 'O-1', 'Other', 'Work Visa']

/**
 * Returns a static options list for a `search-select` typed field that is NOT
 * a person field. Returns `null` if no static list is available (caller should
 * fall back to a free-text input).
 */
export function getOptionsFor(fieldKey) {
  switch (fieldKey) {
    case 'department':
      return DEPT_OPTIONS
    case 'workLocation':
    case 'jobsWorkLocation':
      return LOCATION_OPTIONS
    case 'teams':
      return TEAM_OPTIONS
    case 'jobFamily':
      return JOB_FAMILY_OPTIONS
    case 'state':
      return STATE_OPTIONS
    case 'countryOfCitizenship':
      return COUNTRY_OPTIONS
    case 'preferredLanguage':
      return LANGUAGE_OPTIONS
    case 'visaStatus':
      return VISA_OPTIONS
    default:
      return null
  }
}
