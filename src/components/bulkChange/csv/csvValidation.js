import { EMPLOYEES } from '../../../data/employees'
import { FIELDS_BY_KEY } from '../defineChanges/fieldSchema'
import { PERSON_FIELD_KEYS, getOptionsFor } from '../defineChanges/fieldEditors'
import {
  IMPORT_ROW_STATUS,
  isClearValue,
  normalizeCsvValue,
} from './csvContract'

const MAX_CANDIDATES = 12

function norm(str) {
  return normalizeCsvValue(str).toLowerCase().replace(/\s+/g, ' ').trim()
}

function parseProfileNumber(value) {
  if (!value) return null
  const n = Number(String(value).replace(/[^\d]/g, ''))
  return Number.isFinite(n) ? n : null
}

function findByProfileNumber(profileNumber, employees) {
  if (!profileNumber) return []
  return employees.filter((employee) => Number(employee.profileNumber) === Number(profileNumber))
}

function findByEmail(email, employees) {
  if (!email) return []
  const target = norm(email)
  return employees.filter((employee) => norm(employee.email) === target)
}

function findByName(name, employees) {
  if (!name) return []
  const nameNorm = norm(name)
  const tokens = nameNorm.split(' ').filter(Boolean)

  const exactFull = employees.filter((employee) => norm(employee.fullName) === nameNorm)
  if (exactFull.length > 0) return exactFull

  if (tokens.length >= 2) {
    const first = tokens[0]
    const last = tokens[tokens.length - 1]
    const firstLast = employees.filter(
      (employee) => norm(employee.firstName) === first && norm(employee.lastName) === last,
    )
    if (firstLast.length > 0) return firstLast
  }

  if (tokens.length === 1) {
    const firstOnly = employees.filter((employee) => norm(employee.firstName) === tokens[0])
    if (firstOnly.length > 0) return firstOnly
  }

  return employees.filter((employee) => norm(employee.fullName).includes(nameNorm))
}

function toResolutionResult(raw, matches) {
  if (matches.length === 1) {
    return { raw, status: IMPORT_ROW_STATUS.AUTO, matchId: matches[0].id }
  }
  if (matches.length > 1) {
    return {
      raw,
      status: IMPORT_ROW_STATUS.AMBIGUOUS,
      candidateIds: matches.slice(0, MAX_CANDIDATES).map((employee) => employee.id),
    }
  }
  return { raw, status: IMPORT_ROW_STATUS.MISSED }
}

export function resolveEmployeeRow(cells, identityMapping, employees = EMPLOYEES) {
  const raw = {
    profileNumber:
      identityMapping?.ProfileNumber !== undefined
        ? normalizeCsvValue(cells[identityMapping.ProfileNumber])
        : '',
    email:
      identityMapping?.Email !== undefined
        ? normalizeCsvValue(cells[identityMapping.Email])
        : '',
    name:
      identityMapping?.Name !== undefined
        ? normalizeCsvValue(cells[identityMapping.Name])
        : '',
  }

  const profileMatches = findByProfileNumber(parseProfileNumber(raw.profileNumber), employees)
  if (profileMatches.length > 0) return toResolutionResult(raw, profileMatches)

  const emailMatches = findByEmail(raw.email, employees)
  if (emailMatches.length > 0) return toResolutionResult(raw, emailMatches)

  const nameMatches = findByName(raw.name, employees)
  if (nameMatches.length > 0) return toResolutionResult(raw, nameMatches)

  return { raw, status: IMPORT_ROW_STATUS.MISSED }
}

export function resolveAllEmployeeRows(csvRows = [], identityMapping = {}, employees = EMPLOYEES) {
  return csvRows.map((cells) => resolveEmployeeRow(cells, identityMapping, employees))
}

function matchOption(options = [], value) {
  const normalized = norm(value)
  const hit = options.find((option) => norm(option) === normalized)
  return hit ?? null
}

function resolvePersonByName(value, employees = EMPLOYEES) {
  const matches = findByName(value, employees)
  if (matches.length === 1) return { ok: true, value: matches[0].fullName }
  if (matches.length > 1) {
    return {
      ok: false,
      code: 'ambiguous_person',
      message: `Multiple matches found for "${value}"`,
      candidateIds: matches.slice(0, MAX_CANDIDATES).map((employee) => employee.id),
    }
  }
  return { ok: false, code: 'invalid_person', message: `Could not find person "${value}"` }
}

export function normalizeFieldValue(fieldKey, rawValue, employees = EMPLOYEES) {
  const meta = FIELDS_BY_KEY.get(fieldKey)
  const value = normalizeCsvValue(rawValue)
  if (!meta) return { ok: false, code: 'unknown_field', message: `Unknown field "${fieldKey}"` }
  if (value === '') return { ok: true, normalized: '', isNoChange: true }
  if (isClearValue(value)) return { ok: true, normalized: '', clear: true }

  if (meta.type === 'select' && Array.isArray(meta.options)) {
    const option = matchOption(meta.options, value)
    if (!option) {
      return {
        ok: false,
        code: 'invalid_option',
        message: `Expected one of: ${meta.options.join(', ')}`,
      }
    }
    return { ok: true, normalized: option }
  }

  if (meta.type === 'date') {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, code: 'invalid_date', message: 'Invalid date value' }
    }
    const normalizedDate = parsed.toISOString().slice(0, 10)
    return { ok: true, normalized: normalizedDate }
  }

  if (meta.type === 'search-select' && PERSON_FIELD_KEYS.has(fieldKey)) {
    return resolvePersonByName(value, employees)
  }

  if (meta.type === 'search-select') {
    const options = getOptionsFor(fieldKey)
    if (options?.length) {
      const option = matchOption(options, value)
      if (!option) {
        return {
          ok: false,
          code: 'invalid_search_option',
          message: `Expected one of: ${options.join(', ')}`,
        }
      }
      return { ok: true, normalized: option }
    }
  }

  return { ok: true, normalized: value }
}
