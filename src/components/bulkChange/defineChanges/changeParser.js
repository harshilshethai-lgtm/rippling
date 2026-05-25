import { parseAiPrompt } from '../aiParser'
import { FIELDS_BY_KEY } from './fieldSchema'

/**
 * Deterministic NL → bulk-change parser for the "Make Changes" step.
 *
 * A Make-Changes prompt is a *scope + change-set* sentence. Example:
 *
 *   "Move all reporting to @Maya Pan to @Harshil Sheth"
 *
 * splits into:
 *   • scope:  Manager is Maya Pan        (reuses aiParser.parseAiPrompt)
 *   • change: manager → "Harshil Sheth"  (this file)
 *
 * The scope side is delegated to aiParser so all the alias tables for
 * departments, locations, managers, titles, etc. stay in one place. The
 * change side uses VALUE_PATTERNS — a deliberately conservative, ordered
 * list of (value regex → fieldKey + canonical value) entries. Order matters:
 * more specific phrases come first so that "Remote (EMEA)" doesn't get
 * scooped up by the bare "remote" alias and over-match to two locations.
 *
 * Return shape:
 *   {
 *     scopeChips: ChipProvisional[],
 *     changes:    [{ fieldKey, value, displayValue, field }],
 *     unhandled:  string[],
 *     summary:    string,
 *   }
 *
 * `field` is the FIELDS_BY_KEY metadata object for the change's target,
 * provided as a convenience so the UI can render label + icon without
 * re-looking it up.
 */

// Value → fieldKey + canonical value. Ordered: most specific first.
const VALUE_PATTERNS = [
  // ── Work location (most specific first so "Remote (EMEA)" wins over bare "remote") ──
  { rx: /\bremote\s*\(?\s*emea\s*\)?/i, fieldKey: 'workLocation', value: 'Remote (EMEA)' },
  { rx: /\bremote\s*\(?\s*us\s*\)?/i, fieldKey: 'workLocation', value: 'Remote (US)' },
  { rx: /\bsan\s+francisco\b|\bsf\b|\bbay\s+area\b/i, fieldKey: 'workLocation', value: 'San Francisco' },
  { rx: /\bnew\s+york\b|\bnyc\b/i, fieldKey: 'workLocation', value: 'New York' },
  { rx: /\baustin\b/i, fieldKey: 'workLocation', value: 'Austin' },
  { rx: /\blondon\b/i, fieldKey: 'workLocation', value: 'London' },
  { rx: /\bberlin\b/i, fieldKey: 'workLocation', value: 'Berlin' },
  { rx: /\btoronto\b/i, fieldKey: 'workLocation', value: 'Toronto' },
  { rx: /\bbangalore\b|\bblr\b/i, fieldKey: 'workLocation', value: 'Bangalore' },
  { rx: /\bsingapore\b/i, fieldKey: 'workLocation', value: 'Singapore' },

  // ── Titles (most specific first to win over Department=Engineering) ──
  { rx: /\bstaff\s+(?:software\s+)?engineer\b/i, fieldKey: 'title', value: 'Staff Engineer' },
  { rx: /\bprincipal\s+engineer\b/i, fieldKey: 'title', value: 'Principal Engineer' },
  { rx: /\bsenior\s+software\s+engineer\b/i, fieldKey: 'title', value: 'Senior Software Engineer' },

  // ── Level — P1..P5 ──
  { rx: /\bp[1-5]\b/i, fieldKey: 'level', value: (m) => m[0].toUpperCase() },

  // ── Employment type ──
  { rx: /\bfull[- ]?time\b|\bfte\b/i, fieldKey: 'employmentType', value: 'Full-time' },
  { rx: /\bpart[- ]?time\b/i, fieldKey: 'employmentType', value: 'Part-time' },
  { rx: /\bcontractors?\b/i, fieldKey: 'employmentType', value: 'Contractor' },

  // ── Pay schedule (Bi-weekly before bare "weekly" so we don't downgrade) ──
  { rx: /\bbi[- ]?weekly\b/i, fieldKey: 'paySchedule', value: 'Bi-weekly' },
  { rx: /\bsemi[- ]?monthly\b/i, fieldKey: 'paySchedule', value: 'Semi-monthly' },
  { rx: /\bmonthly\b/i, fieldKey: 'paySchedule', value: 'Monthly' },
  { rx: /\bweekly\b/i, fieldKey: 'paySchedule', value: 'Weekly' },

  // ── Medical plans ──
  { rx: /\bblue\s+shield\s+ppo\s+gold\b|\bppo\s+gold\b/i, fieldKey: 'medicalPlan', value: 'Blue Shield PPO Gold' },
  { rx: /\bblue\s+shield\s+hmo\b/i, fieldKey: 'medicalPlan', value: 'Blue Shield HMO' },
  { rx: /\bkaiser(?:\s+hmo)?\b/i, fieldKey: 'medicalPlan', value: 'Kaiser HMO' },

  // ── Currency ──
  { rx: /\busd\b/i, fieldKey: 'currency', value: 'USD' },
  { rx: /\beur(?:o)?\b/i, fieldKey: 'currency', value: 'EUR' },
  { rx: /\bgbp\b/i, fieldKey: 'currency', value: 'GBP' },
  { rx: /\bcad\b/i, fieldKey: 'currency', value: 'CAD' },

  // ── Departments (longer compound names first) ──
  { rx: /\brevenue\s+operations\b|\brev\s*ops\b/i, fieldKey: 'department', value: 'Revenue Operations' },
  { rx: /\bcustomer\s+success\b/i, fieldKey: 'department', value: 'Customer Success' },
  { rx: /\bcustomer\s+support\b/i, fieldKey: 'department', value: 'Customer Support' },
  { rx: /\bengineering\b|\beng\b/i, fieldKey: 'department', value: 'Engineering' },
  { rx: /\bproduct\b/i, fieldKey: 'department', value: 'Product' },
  { rx: /\bdesign\b/i, fieldKey: 'department', value: 'Design' },
  { rx: /\bsales\b/i, fieldKey: 'department', value: 'Sales' },
  { rx: /\bmarketing\b/i, fieldKey: 'department', value: 'Marketing' },
  { rx: /\bfinance\b/i, fieldKey: 'department', value: 'Finance' },
  { rx: /\bpeople\b|\bhr\b/i, fieldKey: 'department', value: 'People' },
  { rx: /\bsecurity\b/i, fieldKey: 'department', value: 'Security' },
  { rx: /\blegal\b/i, fieldKey: 'department', value: 'Legal' },
  { rx: /\bimplementation\b/i, fieldKey: 'department', value: 'Implementation' },
  { rx: /\boperations\b|\bops\b/i, fieldKey: 'department', value: 'Operations' },
  { rx: /\bdata\b/i, fieldKey: 'department', value: 'Data' },
  { rx: /\bit\b/i, fieldKey: 'department', value: 'IT' },

  // ── Account status (after Status detection in scope; only matched when explicit field) ──
  { rx: /\bsuspended?\b/i, fieldKey: 'accountStatus', value: 'Suspended' },
  { rx: /\blocked\b/i, fieldKey: 'accountStatus', value: 'Locked' },
]

// Explicit "<field word> to <value>" markers. Detected on either side of the " to ".
const FIELD_KEYWORD_MAP = [
  { fieldKey: 'paySchedule', rx: /\bpay(?:roll)?\s+schedule\b/i },
  { fieldKey: 'manager', rx: /\bmanager\b|\breport(?:s|ing)?\s+to\b/i },
  { fieldKey: 'workLocation', rx: /\bwork\s+location\b|\boffice\b/i },
  { fieldKey: 'level', rx: /\blevels?\b/i },
  { fieldKey: 'title', rx: /\btitles?\b/i },
  { fieldKey: 'department', rx: /\bdepartments?\b|\bdept\b/i },
  { fieldKey: 'employmentType', rx: /\bemployment\s+type\b/i },
  { fieldKey: 'baseCompensation', rx: /\bbase\s+(?:comp|salary|pay)\b|\bsalary\b/i },
  { fieldKey: 'medicalPlan', rx: /\bmedical\s+plan\b|\bhealth\s+plan\b/i },
  { fieldKey: 'currency', rx: /\bcurrenc(?:y|ies)\b/i },
  { fieldKey: 'accountStatus', rx: /\baccount\s+status\b/i },
]

const SCOPE_NOISE_RX =
  /^(?:move|moves|moving|switch|switches|switching|promote|promotes|promoting|bump|bumps|bumping|set|sets|setting|change|changes|changing|relocate|relocates|relocating|transfer|transfers|transferring|update|updates|updating|put|puts|putting|make|makes|making|then|also|now|them|their|us|it|they|the|all|every|everyone|everybody|please|just|can|you)$/i

function findRightmostTo(text) {
  const lc = text.toLowerCase()
  const idx = lc.lastIndexOf(' to ')
  if (idx === -1) return null
  return { start: idx, end: idx + 4 }
}

/**
 * Resolve an "@<Name>" token at the start of `valueText` to either an
 * EMPLOYEES record's `fullName` (when found) or the user-typed name verbatim
 * (so manager values can target people who aren't in EMPLOYEES — e.g. the
 * worklist lead "Harshil Sheth").
 */
function resolveMentionValue(valueText, employees) {
  const trimmed = valueText.trim()
  if (!trimmed.startsWith('@')) return null
  const namePart = trimmed.slice(1).trim()
  if (!namePart) return null
  let best = null
  for (const emp of employees) {
    if (namePart.toLowerCase().startsWith(emp.fullName.toLowerCase())) {
      if (!best || emp.fullName.length > best.fullName.length) best = emp
    }
  }
  return best ? best.fullName : namePart
}

function inferFromValueText(valueText) {
  for (const { rx, fieldKey, value } of VALUE_PATTERNS) {
    const m = valueText.match(rx)
    if (m) {
      const resolved = typeof value === 'function' ? value(m) : value
      return { fieldKey, value: resolved, displayValue: resolved }
    }
  }
  return null
}

function detectExplicitField(text) {
  if (!text) return null
  for (const { fieldKey, rx } of FIELD_KEYWORD_MAP) {
    if (rx.test(text)) return fieldKey
  }
  return null
}

function stripFieldKeywords(text) {
  let next = text
  for (const { rx } of FIELD_KEYWORD_MAP) {
    next = next.replace(rx, ' ')
  }
  return next.replace(/\s{2,}/g, ' ').trim()
}

function hasMeaningfulScope(text) {
  if (!text) return false
  // After stripping verbs/pronouns, is there anything left worth parsing?
  const tokens = text
    .trim()
    .split(/\s+/)
    .filter((t) => !SCOPE_NOISE_RX.test(t))
  return tokens.length > 0
}

function withMeta(change) {
  if (!change) return null
  const meta = FIELDS_BY_KEY.get(change.fieldKey) ?? null
  return { ...change, field: meta }
}

/**
 * Parse a single "<lhs> to <rhs>" clause into a change. Tries, in order:
 *   1. `@Name`         on the value side → manager (resolved or verbatim)
 *   2. Explicit field  in either side    → that field + value text matched
 *   3. Value pattern   on the value side → fieldKey/value inferred from rhs
 */
function parseClause(seg, ctx) {
  const toMatch = findRightmostTo(seg)
  if (!toMatch) return { change: null, beforeText: seg }

  const valueText = seg.slice(toMatch.end).trim()
  const beforeText = seg.slice(0, toMatch.start).trim()
  if (!valueText) return { change: null, beforeText: seg }

  // 1. Person mention on the value side wins. Falls back to verbatim text.
  if (valueText.startsWith('@')) {
    const name = resolveMentionValue(valueText, ctx.employees || [])
    if (name) {
      const fieldKey =
        detectExplicitField(beforeText) === 'approver' ? 'approver' : 'manager'
      return {
        change: { fieldKey, value: name, displayValue: name },
        beforeText,
      }
    }
  }

  // 2. Explicit field marker in either side?
  const explicitField =
    detectExplicitField(beforeText) || detectExplicitField(valueText)

  if (explicitField) {
    const stripped = stripFieldKeywords(valueText)
    const inferred = inferFromValueText(stripped) || inferFromValueText(valueText)
    if (inferred && inferred.fieldKey === explicitField) {
      return { change: inferred, beforeText }
    }
    const fallbackValue = (inferred && inferred.value) || stripped
    if (fallbackValue) {
      return {
        change: {
          fieldKey: explicitField,
          value: fallbackValue,
          displayValue: fallbackValue,
        },
        beforeText,
      }
    }
  }

  // 3. Pure value-driven inference.
  const inferred = inferFromValueText(valueText)
  if (inferred) return { change: inferred, beforeText }

  return { change: null, beforeText: seg }
}

export function parseChangePrompt(prompt, ctx = {}) {
  const trimmed = (prompt || '').trim()
  if (!trimmed) {
    return { scopeChips: [], changes: [], unhandled: [], summary: '' }
  }

  // Split into clauses on " and " / ", " so multi-change prompts work.
  const segments = trimmed
    .split(/\s*(?:,|\band\b)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean)

  const rawChanges = []
  const scopeParts = []

  for (const seg of segments) {
    const { change, beforeText } = parseClause(seg, ctx)
    if (change) {
      rawChanges.push(change)
      // Only contribute to scope if there's actually meaningful content
      // (otherwise pronouns like "them" pollute the scope text).
      if (scopeParts.length === 0 || hasMeaningfulScope(beforeText)) {
        if (beforeText) scopeParts.push(beforeText)
      }
    } else {
      // No change found in this segment — treat it all as scope text.
      scopeParts.push(seg)
    }
  }

  // De-dupe by fieldKey, keeping the LAST occurrence (later in the prompt wins).
  const dedupedChanges = []
  const seen = new Set()
  for (let i = rawChanges.length - 1; i >= 0; i--) {
    const ch = rawChanges[i]
    if (seen.has(ch.fieldKey)) continue
    seen.add(ch.fieldKey)
    dedupedChanges.unshift(withMeta(ch))
  }

  // Parse scope.
  const scopeText = scopeParts.join(' ').trim()
  const scopeParsed = scopeText
    ? parseAiPrompt(scopeText, ctx)
    : { chips: [], unhandled: [], summary: '' }

  const unhandled = []
  if (dedupedChanges.length === 0) {
    unhandled.push(
      'Couldn\'t extract a change. Try wording like ' +
        '"Move <scope> to <new value>", ' +
        '"Promote <scope> to P4", or ' +
        '"Switch <scope> to Full-time".',
    )
  }
  // Surface scope-side unhandled clauses (e.g. unsupported comp/perf keywords).
  for (const line of scopeParsed.unhandled || []) {
    if (!unhandled.includes(line)) unhandled.push(line)
  }

  const summary =
    dedupedChanges.length === 0
      ? 'No changes detected.'
      : `${dedupedChanges.length} ${dedupedChanges.length === 1 ? 'change' : 'changes'} detected.`

  return {
    scopeChips: scopeParsed.chips,
    changes: dedupedChanges,
    unhandled,
    summary,
  }
}

/**
 * Clickable example prompts shown at the top of the Ask AI popover.
 * Each is verified to parse cleanly against the seeded EMPLOYEES dataset.
 */
export const CHANGE_SUGGESTIONS = [
  { label: 'Relocate Austin → SF', prompt: 'Move all Austin employees to San Francisco' },
  { label: 'Re-assign manager', prompt: 'Move all reporting to @Maya Pan to @Harshil Sheth' },
  { label: 'Promote NYC engineers', prompt: 'Promote all engineers in NYC to P4' },
  { label: 'Convert contractors', prompt: 'Switch all contractors to Full-time' },
  { label: 'Update Sales payroll', prompt: 'Set all Sales to Bi-weekly pay schedule' },
  { label: 'Relocate London → EMEA', prompt: 'Move all London employees to Remote (EMEA)' },
  { label: 'Promote seniors', prompt: 'Bump all Senior Software Engineers to Staff Engineer' },
  { label: 'Switch medical plan', prompt: 'Switch everyone in San Francisco to Kaiser HMO' },
]
