// In-memory worklist store with a tiny subscriber pattern so React
// components can re-render when entries are added/updated/removed.
//
// This is a prototype: state is *not* persisted across reloads.

import { FIELDS_BY_KEY } from '../components/bulkChange/defineChanges/fieldSchema'

export const BUCKETS = [
  { id: 'drafts', label: 'Drafts' },
  { id: 'needsApproval', label: 'Needs Approval' },
  { id: 'contributor', label: 'Contributor' },
  { id: 'complete', label: 'Complete' },
]

const STATUS_BY_BUCKET = {
  drafts: 'Draft',
  needsApproval: 'Needs approval',
  contributor: 'In progress',
  complete: 'Complete',
}

// ─── Subscriber pattern ──────────────────────────────────────────────────────

let entries = []
const listeners = new Set()

function emit() {
  for (const fn of listeners) fn()
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getWorklists() {
  return entries
}

// ─── Mutations ───────────────────────────────────────────────────────────────

let idCounter = 1
function nextId() {
  return `wl_${String(idCounter++).padStart(4, '0')}`
}

/**
 * Create or update a worklist entry. If `partial.id` is falsy, a new id is
 * assigned. Returns the resulting entry.
 */
export function upsertWorklist(partial) {
  const now = new Date().toISOString()

  if (partial.id) {
    const existing = entries.find((e) => e.id === partial.id)
    if (existing) {
      const next = { ...existing, ...partial, lastModified: now }
      entries = entries.map((e) => (e.id === partial.id ? next : e))
      emit()
      return next
    }
  }

  const entry = {
    id: partial.id ?? nextId(),
    name: 'Untitled bulk change',
    startTime: now,
    lastModified: now,
    status: 'Draft',
    intent: '—',
    fieldKeys: [],
    role: 'Lead',
    bucket: 'drafts',
    peopleCount: 0,
    leadName: 'You',
    approvers: [],
    step: 'select',
    ...partial,
  }
  entries = [entry, ...entries]
  emit()
  return entry
}

export function removeWorklist(id) {
  const before = entries.length
  entries = entries.filter((e) => e.id !== id)
  if (entries.length !== before) emit()
}

// ─── Derived helpers ─────────────────────────────────────────────────────────

export function bucketCounts(list) {
  const counts = { drafts: 0, needsApproval: 0, contributor: 0, complete: 0 }
  for (const entry of list) {
    if (counts[entry.bucket] !== undefined) counts[entry.bucket]++
  }
  return counts
}

/**
 * Produces a short, human-friendly summary of what a worklist changes,
 * based on the set of field keys currently selected.
 *
 *   ['compensation']                → 'Compensation change'
 *   ['title', 'level']              → 'Role change'
 *   ['compensation', 'manager']     → 'Mixed changes'
 *   []                              → '—'
 */
export function intentFromFieldKeys(fieldKeys) {
  if (!fieldKeys || fieldKeys.length === 0) return '—'

  const sections = new Set()
  for (const key of fieldKeys) {
    const meta = FIELDS_BY_KEY.get(key)
    if (meta) sections.add(meta.sectionLabel)
  }

  if (fieldKeys.length === 1) {
    const meta = FIELDS_BY_KEY.get(fieldKeys[0])
    return meta ? `${meta.label} change` : 'Field change'
  }

  if (sections.size === 1) {
    const [section] = sections
    return `${section} change`
  }

  return 'Mixed changes'
}

// ─── Seed data ──────────────────────────────────────────────────────────────
// A few sample entries spread across non-draft buckets so the new tabs aren't
// empty when the user first opens the page.

function seed() {
  const day = 24 * 60 * 60 * 1000
  const now = Date.now()
  const ago = (ms) => new Date(now - ms).toISOString()

  const seeded = [
    {
      name: 'Q1 promotions — Engineering',
      bucket: 'needsApproval',
      role: 'Lead',
      status: STATUS_BY_BUCKET.needsApproval,
      intent: 'My pay change',
      fieldKeys: ['baseCompensation', 'title', 'level'],
      peopleCount: 24,
      leadName: 'Harshil Sheth',
      approvers: [{ name: 'Noah Thompson' }, { name: 'Rachel Kim' }],
      step: 'review',
      startTime: ago(3 * day),
      lastModified: ago(4 * 60 * 60 * 1000),
    },
    {
      name: 'NY office → Remote conversion',
      bucket: 'needsApproval',
      role: 'Lead',
      status: STATUS_BY_BUCKET.needsApproval,
      intent: 'Work location change',
      fieldKeys: ['workLocation'],
      peopleCount: 8,
      leadName: 'Harshil Sheth',
      approvers: [{ name: 'Sarah Johnson' }],
      step: 'review',
      startTime: ago(1 * day),
      lastModified: ago(2 * 60 * 60 * 1000),
    },
    {
      name: 'Contractor → FTE conversion (Sales)',
      bucket: 'contributor',
      role: 'Approver',
      status: STATUS_BY_BUCKET.contributor,
      intent: 'Employment type change',
      fieldKeys: ['employmentType', 'baseCompensation'],
      peopleCount: 6,
      leadName: 'Sarah Johnson',
      approvers: [{ name: 'Rachel Kim' }, { name: 'Noah Thompson' }],
      step: 'edit',
      startTime: ago(5 * day),
      lastModified: ago(8 * 60 * 60 * 1000),
    },
    {
      name: 'Design org restructure',
      bucket: 'contributor',
      role: 'Observer',
      status: STATUS_BY_BUCKET.contributor,
      intent: 'Manager change',
      fieldKeys: ['manager', 'department'],
      peopleCount: 14,
      leadName: 'Emily Walker',
      approvers: [{ name: 'Sarah Johnson' }],
      step: 'define',
      startTime: ago(7 * day),
      lastModified: ago(1 * day),
    },
    {
      name: 'Annual merit cycle — H2',
      bucket: 'complete',
      role: 'Lead',
      status: STATUS_BY_BUCKET.complete,
      intent: 'Base compensation change',
      fieldKeys: ['baseCompensation'],
      peopleCount: 412,
      leadName: 'Harshil Sheth',
      approvers: [{ name: 'Noah Thompson' }, { name: 'Rachel Kim' }],
      step: 'review',
      startTime: ago(45 * day),
      lastModified: ago(30 * day),
    },
    {
      name: 'EU entity transfer — wave 2',
      bucket: 'complete',
      role: 'Collaborator',
      status: STATUS_BY_BUCKET.complete,
      intent: 'Legal entity change',
      fieldKeys: ['legalEntity'],
      peopleCount: 19,
      leadName: 'Aditi Brown',
      approvers: [{ name: 'Sarah Johnson' }],
      step: 'review',
      startTime: ago(60 * day),
      lastModified: ago(40 * day),
    },
  ]

  // Inserted in reverse so most-recent ends up first
  for (const partial of seeded) upsertWorklist(partial)
}

seed()
