export const CLEAR_SENTINEL = '[CLEAR]'

export const IDENTITY_FIELDS = ['ProfileNumber', 'Email', 'Name']

export const IDENTITY_FIELD_LABELS = {
  ProfileNumber: 'Rippling profile number',
  Email: 'Email',
  Name: 'Name',
}

export const IDENTITY_ALIASES = {
  ProfileNumber: [
    'rippling profile number',
    'profile number',
    'profile_number',
    'employee id',
    'employee_id',
    'id',
  ],
  Email: ['email', 'work email', 'work_email', 'email address', 'email_address'],
  Name: ['name', 'full name', 'employee name', 'employee'],
}

export const IMPORT_ROW_STATUS = {
  AUTO: 'auto',
  AMBIGUOUS: 'ambiguous',
  MISSED: 'missed',
}

export function normalizeCsvValue(value) {
  return String(value ?? '').trim()
}

export function normalizeHeader(header) {
  return normalizeCsvValue(header).toLowerCase().replace(/[_\s]+/g, ' ')
}

export function isClearValue(value) {
  return normalizeCsvValue(value).toUpperCase() === CLEAR_SENTINEL
}
