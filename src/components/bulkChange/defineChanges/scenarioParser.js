import { FIELDS_BY_KEY } from './fieldSchema'
import { TEMPLATES_BY_ID } from './templates'

/**
 * Deterministic, offline natural-language → bulk-change suggestion parser.
 *
 * Sibling of bulkChange/aiParser.js but for the *Define Changes* step:
 * instead of producing filter chips that narrow a population, this parser
 * produces a suggested template id and a set of field keys that should be
 * added as columns to edit.
 *
 * Strategy
 *   1. Score every template against the prompt using a keyword table.
 *   2. If the best score is > 0, that template wins; its fieldKeys are the
 *      base suggestion.
 *   3. Add any *extra* field keys the prompt explicitly mentions
 *      ("…and update level too") via a field synonym map.
 *   4. Return everything so the UI can render a preview card with per-field
 *      drop chips (the "template has 22, user keeps 5" flow).
 *
 * Returns:
 *   {
 *     templateId: string | null,
 *     templateLabel: string | null,
 *     fieldKeys: string[],
 *     extraFieldKeys: string[],   // fields explicitly mentioned beyond the template
 *     droppedKeys: string[],      // always [] from the parser — UI fills in
 *     summary: string,
 *     unhandled: string[],
 *   }
 */

// One row per playbook. `patterns` are matched case-insensitively; each hit
// scores +1 (or the explicit weight when given). The matching template id MUST
// exist in templates.js.
const TEMPLATE_PATTERNS = [
  {
    id: 'reorg',
    patterns: [
      { rx: /\b(reorg|reorganization|reorganisation|restructure|restructuring)\b/, weight: 3 },
      { rx: /\bmanager\s+hierarchy\b/, weight: 2 },
      { rx: /\b(?:rewire|rewir(?:ing|e))\s+manag/, weight: 2 },
      { rx: /\borg\s+chart\b/, weight: 1 },
      { rx: /\bteam\s+structure\b/, weight: 1 },
      { rx: /\bsub[- ]tree\b/, weight: 2 },
    ],
  },
  {
    id: 'relocate',
    patterns: [
      { rx: /\b(relocate|relocating|relocation)\b/, weight: 3 },
      { rx: /\bmoves?\s+(?:from|to)\b/, weight: 2 },
      { rx: /\bremote\s+workers?\s+move/, weight: 2 },
      { rx: /\bnew\s+state\b/, weight: 1 },
      { rx: /\b(?:open|opens|opening)\s+(?:a\s+)?new\s+office\b/, weight: 2 },
    ],
  },
  {
    id: 'office-close',
    patterns: [
      { rx: /\b(close|closing|closure|shutting)\s+(?:an?\s+)?office\b/, weight: 3 },
      { rx: /\boffice\s+(?:close|closure|shutdown)\b/, weight: 3 },
      { rx: /\bwarn\s+notice\b/, weight: 2 },
      { rx: /\bsite\s+closure\b/, weight: 2 },
    ],
  },
  {
    id: 'promotion',
    patterns: [
      { rx: /\b(promotion|promotions|promote|promoted)\b/, weight: 3 },
      { rx: /\btitle\s+(?:and|&)\s+level\b/, weight: 2 },
      { rx: /\blevel(?:ing|ling)\s+cascade\b/, weight: 2 },
      { rx: /\bcomp\s+band\s+re-?check\b/, weight: 1 },
    ],
  },
  {
    id: 'merit',
    patterns: [
      { rx: /\b(merit|merits)\s+(?:cycle|increase|round|raises?)\b/, weight: 3 },
      { rx: /\bannual\s+(?:merit|raise|raises|increase)/, weight: 3 },
      { rx: /\bcola\b|\bcost[- ]of[- ]living\b/, weight: 2 },
      { rx: /\bspot\s+bonus(?:es)?\b/, weight: 2 },
      { rx: /\b(raise|raises)\b/, weight: 1 },
      { rx: /\bsalary\s+(increase|adjustment)/, weight: 2 },
      { rx: /\bcompensation\s+adjust/, weight: 2 },
    ],
  },
  {
    id: 'onboard',
    patterns: [
      { rx: /\b(onboard|onboarding)\b/, weight: 3 },
      { rx: /\bnew\s+hires?\b/, weight: 3 },
      { rx: /\bnew\s+(joiners?|starters?)\b/, weight: 2 },
      { rx: /\bcohort\s+starting\b/, weight: 2 },
      { rx: /\bstarts?\s+(?:on\s+)?(?:next\s+)?monday\b/, weight: 1 },
      { rx: /\bclass\s+of\b/, weight: 1 },
    ],
  },
  {
    id: 'offboard',
    patterns: [
      { rx: /\b(offboard|offboarding)\b/, weight: 3 },
      { rx: /\b(terminate|terminating|termination|terminations)\b/, weight: 3 },
      { rx: /\b(layoff|layoffs|laid\s+off)\b/, weight: 3 },
      { rx: /\brif\b|\breduction\s+in\s+force\b/, weight: 3 },
      { rx: /\bmass\s+layoff\b/, weight: 3 },
      { rx: /\block(?:ed|ing)?\s+devices?\b/, weight: 2 },
      { rx: /\brevoke\s+access\b/, weight: 2 },
      { rx: /\bseverance\b/, weight: 1 },
      { rx: /\bdivestiture\b|\bspin[- ]?out\b/, weight: 2 },
    ],
  },
  {
    id: 'enrollment',
    patterns: [
      { rx: /\b(open\s+enrollment|annual\s+enrollment)\b/, weight: 3 },
      { rx: /\bbenefits?\s+(?:enrollment|election|elections)\b/, weight: 3 },
      { rx: /\bhealth\s+plan\b/, weight: 2 },
      { rx: /\bdependents?\b/, weight: 1 },
      { rx: /\bcobra\b/, weight: 1 },
      { rx: /\bfsa\b|\bhsa\b/, weight: 1 },
    ],
  },
  {
    id: 'policy',
    patterns: [
      { rx: /\b(policy|policies)\s+(?:rollout|update|change)/, weight: 3 },
      { rx: /\bexpense\s+(policy|policies|limits?)/, weight: 3 },
      { rx: /\bt&e\s+policy\b/, weight: 3 },
      { rx: /\bcard\s+limits?\b/, weight: 2 },
      { rx: /\b(grant|revoke)\s+(admin|permissions?|access)\b/, weight: 3 },
      { rx: /\bsso\b/, weight: 2 },
      { rx: /\bmfa\b|\b2fa\b/, weight: 2 },
      { rx: /\bbeta\s+(?:users|access)\b/, weight: 2 },
      { rx: /\blicense\s+seats?\b/, weight: 2 },
    ],
  },
  {
    id: 'acquisition',
    patterns: [
      { rx: /\b(acquisition|acquire|acquired|acqui[- ]?hire)\b/, weight: 3 },
      { rx: /\bm&a\b/, weight: 3 },
      { rx: /\b(legal\s+entity|entity\s+transfer)/, weight: 2 },
      { rx: /\bspun[- ]out\b|\bspin[- ]off\b/, weight: 2 },
      { rx: /\bequity\s+conversion\b/, weight: 2 },
    ],
  },
]

// Synonyms for individual field keys, so a prompt like
// "update level and region" pulls in `level` and `region` even when no
// template matches. Order matters only for de-duplication.
const FIELD_SYNONYMS = [
  { keys: ['manager'], rx: /\bmanager(s)?\b|\breports?\s+to\b/ },
  { keys: ['department'], rx: /\bdepartment(s)?\b|\bdept\b/ },
  { keys: ['level'], rx: /\blevels?\b/ },
  { keys: ['title'], rx: /\btitles?\b/ },
  { keys: ['teams'], rx: /\bteams?\b/ },
  { keys: ['region'], rx: /\bregions?\b|\bgeo\b/ },
  { keys: ['workLocation'], rx: /\b(work\s+)?locations?\b|\boffices?\b|\bsites?\b/ },
  { keys: ['state'], rx: /\bstates?\b|\bca\b|\btx\b|\bny\b/ },
  { keys: ['timeZone'], rx: /\btime[- ]?zones?\b|\btz\b/ },
  { keys: ['stateWithholding'], rx: /\bstate\s+(tax|withhold)/ },
  { keys: ['baseCompensation'], rx: /\bsalary\b|\bbase\s+(comp|pay|salary)\b|\bbase\b/ },
  { keys: ['bonusTarget'], rx: /\bbonus(?:\s+target)?\b/ },
  { keys: ['compPeriod'], rx: /\bhourly\b|\bannual(?:ized)?\b|\bcomp\s+period\b/ },
  { keys: ['currency'], rx: /\bcurrenc(y|ies)\b|\busd\b|\beur\b|\bgbp\b|\bcad\b/ },
  { keys: ['paySchedule'], rx: /\bpay(?:roll)?\s+schedule\b|\bbi[- ]?weekly\b|\bsemi[- ]?monthly\b/ },
  { keys: ['employmentType'], rx: /\b(employment\s+type|full[- ]?time|part[- ]?time|contractor)\b/ },
  { keys: ['startDate'], rx: /\bstart\s+dates?\b|\bjoin\s+dates?\b/ },
  { keys: ['accountStatus'], rx: /\baccount\s+status\b|\bsuspend(ed)?\b|\bdeactivate(d)?\b/ },
  { keys: ['deviceStatus'], rx: /\bdevices?\b|\bmdm\b|\blaptops?\b/ },
  { keys: ['medicalPlan'], rx: /\bmedical\s+plan\b|\bhealth\s+plan\b/ },
  { keys: ['dependentsCovered'], rx: /\bdependents?\b/ },
  { keys: ['retirement'], rx: /\b401[- ]?k\b|\bretirement\b/ },
  { keys: ['expensePolicy'], rx: /\bexpense\s+polic(y|ies)\b/ },
  { keys: ['cardLimit'], rx: /\bcard\s+limits?\b/ },
  { keys: ['mfaEnforcement'], rx: /\bmfa\b|\b2fa\b|\btwo[- ]factor\b/ },
  { keys: ['ssoProvider'], rx: /\bsso\b|\bsingle\s+sign[- ]?on\b/ },
  { keys: ['visaStatus'], rx: /\bvisa\b|\bh[- ]?1b\b|\bwork\s+auth(?:orization)?\b/ },
  { keys: ['performanceTrend'], rx: /\bperformance\s+ratings?\b|\bcalibration\b/ },
  { keys: ['equityEligibility'], rx: /\bequity\b|\bgrants?\b|\brefresh\s+grants?\b/ },
  { keys: ['legalEntity'], rx: /\blegal\s+entit(y|ies)\b|\bentit(y|ies)\b/ },
]

function lower(s) {
  return (s || '').toLowerCase()
}

function scoreTemplate(prompt, patterns) {
  let score = 0
  for (const { rx, weight = 1 } of patterns) {
    if (rx.test(prompt)) score += weight
  }
  return score
}

function detectFieldKeys(prompt) {
  const set = new Set()
  for (const { keys, rx } of FIELD_SYNONYMS) {
    if (rx.test(prompt)) {
      for (const k of keys) set.add(k)
    }
  }
  return [...set]
}

/**
 * Parse a natural-language prompt into a bulk-change suggestion.
 * `excludeKeys` lets the caller pre-strip fields already on screen so the
 * suggestion preview never re-suggests something that's already a chip.
 */
export function parseScenarioPrompt(prompt, { excludeKeys = [] } = {}) {
  const trimmed = (prompt || '').trim()
  if (!trimmed) {
    return {
      templateId: null,
      templateLabel: null,
      fieldKeys: [],
      extraFieldKeys: [],
      droppedKeys: [],
      summary: '',
      unhandled: [],
    }
  }

  const lc = lower(trimmed)
  const excluded = new Set(excludeKeys)

  let bestId = null
  let bestScore = 0
  for (const { id, patterns } of TEMPLATE_PATTERNS) {
    const s = scoreTemplate(lc, patterns)
    if (s > bestScore) {
      bestScore = s
      bestId = id
    }
  }

  const template = bestId ? TEMPLATES_BY_ID.get(bestId) : null
  const templateKeys = template ? [...template.fieldKeys] : []

  const synonymKeys = detectFieldKeys(lc)
  const extraFieldKeys = synonymKeys.filter(
    (k) => FIELDS_BY_KEY.has(k) && !templateKeys.includes(k) && !excluded.has(k),
  )

  // Final ordered union — template fields first (in their canonical order),
  // then any extras the prompt explicitly mentioned.
  const ordered = []
  const seen = new Set()
  for (const k of templateKeys) {
    if (!excluded.has(k) && !seen.has(k)) {
      ordered.push(k)
      seen.add(k)
    }
  }
  for (const k of extraFieldKeys) {
    if (!seen.has(k)) {
      ordered.push(k)
      seen.add(k)
    }
  }

  // Distinguish "we recognized something but it's all already on screen"
  // from "we couldn't parse any of this". The first case isn't a parser
  // failure — the UI just has nothing new to add.
  const recognizedSomething =
    !!template || (templateKeys.length === 0 && synonymKeys.length > 0)
  const unhandled = []
  if (ordered.length === 0 && !recognizedSomething) {
    unhandled.push(
      "Couldn't recognize this scenario. Try wording like 'run a reorg', " +
        "'relocate to Austin', 'merit cycle raises', 'onboard new hires', or " +
        "'terminate the contractors' — or press / to pick a template, @ to add a field.",
    )
  } else if (ordered.length === 0 && recognizedSomething) {
    unhandled.push(
      'All fields for this scenario are already on the worklist. Trim some, ' +
        'or describe additional changes.',
    )
  }

  let summary = ''
  if (template) {
    summary = `${template.label} — ${ordered.length} ${ordered.length === 1 ? 'field' : 'fields'}`
  } else if (ordered.length > 0) {
    summary = `${ordered.length} ${ordered.length === 1 ? 'field' : 'fields'} detected`
  }

  return {
    templateId: template?.id ?? null,
    templateLabel: template?.label ?? null,
    fieldKeys: ordered,
    extraFieldKeys,
    droppedKeys: [],
    summary,
    unhandled,
  }
}

/**
 * Rotating placeholder suggestions for the composer textarea. Picked to span
 * the scenario table without being too long to render in a single line.
 */
export const SCENARIO_SUGGESTIONS = [
  'Run a reorg — rewire managers, departments, and levels',
  'Relocate our CA remote workers to TX',
  'Merit cycle raises with per-person amounts',
  'Onboard 63 new hires starting next Monday',
  'Lock devices and revoke access for offboarded employees',
  'Open enrollment — switch medical plan and update dependents',
  'Apply the new T&E policy across all teams',
  'Promotion cycle title and level changes',
  'COLA adjustment by city',
  'Acquisition close — bring 200 employees into a new legal entity',
]
