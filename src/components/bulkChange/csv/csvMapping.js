import { FIELDS_BY_KEY } from '../defineChanges/fieldSchema'
import {
  IDENTITY_ALIASES,
  IDENTITY_FIELDS,
  normalizeCsvValue,
  normalizeHeader,
} from './csvContract'

function addIfMissing(list, value) {
  if (!value) return
  if (!list.includes(value)) list.push(value)
}

function inferFieldFromHeader(header) {
  const normalized = normalizeHeader(header)
  if (!normalized) return null

  const trimmed = normalized
    .replace(/^new /, '')
    .replace(/^new_/, '')
    .replace(/\s*\(new\)\s*$/, '')
    .replace(/^current /, '')
    .replace(/^current_/, '')
    .replace(/\s*\(current\)\s*$/, '')

  for (const [fieldKey, meta] of FIELDS_BY_KEY.entries()) {
    const candidates = []
    addIfMissing(candidates, fieldKey)
    addIfMissing(candidates, fieldKey.replace(/([A-Z])/g, ' $1').trim())
    addIfMissing(candidates, meta?.label)
    for (const candidate of candidates) {
      if (normalizeHeader(candidate) === trimmed) return fieldKey
    }
  }
  return null
}

function inferColumnRole(rawHeader, fieldKey) {
  const normalized = normalizeHeader(rawHeader)
  if (
    normalized.startsWith('current ') ||
    normalized.startsWith('current_') ||
    normalized.endsWith('(current)')
  ) {
    return { role: 'current', fieldKey }
  }
  return { role: 'new', fieldKey }
}

export function detectIdentityMapping(headers = []) {
  const mapping = {}
  for (let i = 0; i < headers.length; i += 1) {
    const header = normalizeHeader(headers[i])
    if (!header) continue
    for (const identityField of IDENTITY_FIELDS) {
      if (mapping[identityField] !== undefined) continue
      const aliases = IDENTITY_ALIASES[identityField] ?? []
      if (aliases.includes(header)) {
        mapping[identityField] = i
        break
      }
    }
  }
  return mapping
}

export function detectSelectStepMapping(headers = []) {
  const identity = detectIdentityMapping(headers)
  const out = {}
  if (identity.Name !== undefined) out.Name = identity.Name
  if (identity.Email !== undefined) out.Email = identity.Email
  if (identity.ProfileNumber !== undefined) out.ProfileNumber = identity.ProfileNumber
  return out
}

export function inferChangeSetFromHeaders(headers = []) {
  const identityMapping = detectIdentityMapping(headers)
  const newValueColumnsByField = {}
  const currentValueColumnsByField = {}
  const ignoredHeaders = []

  for (let i = 0; i < headers.length; i += 1) {
    const header = normalizeCsvValue(headers[i])
    if (!header) {
      ignoredHeaders.push({ index: i, header, reason: 'empty' })
      continue
    }
    const isIdentity = Object.values(identityMapping).includes(i)
    if (isIdentity) continue

    const fieldKey = inferFieldFromHeader(header)
    if (!fieldKey) {
      ignoredHeaders.push({ index: i, header, reason: 'unmapped' })
      continue
    }

    const { role } = inferColumnRole(header, fieldKey)
    if (role === 'current') {
      currentValueColumnsByField[fieldKey] = i
      continue
    }
    newValueColumnsByField[fieldKey] = i
  }

  return {
    identityMapping,
    inferredFieldKeys: Object.keys(newValueColumnsByField),
    newValueColumnsByField,
    currentValueColumnsByField,
    ignoredHeaders,
  }
}
