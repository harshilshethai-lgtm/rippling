/**
 * Deterministic, offline natural-language → filter chip parser used by the
 * "Ask AI" entry points. This is intentionally rule-based so the prototype is
 * demo-stable; it doesn't call out to an LLM.
 *
 * Returns provisional chips (without ids) plus any unhandled clauses we want
 * to surface back to the user, so they understand what made it through and
 * what didn't.
 */

/**
 * Department alias map. Entries are evaluated longest-first so compound names
 * ("revenue operations") take priority over their sub-words ("operations").
 * Common English words like "people" are intentionally omitted because they
 * are far too ambiguous in natural-language prompts.
 */
const DEPARTMENT_ALIASES = {
  // compound entries first (sorted longest → shortest at runtime)
  'revenue operations': 'Revenue Operations',
  'rev ops': 'Revenue Operations',
  'customer success': 'Customer Success',
  'customer support': 'Customer Support',
  'product team': 'Product',
  'product management': 'Product',
  'sales development': 'Sales',
  'sales team': 'Sales',
  'sales reps': 'Sales',
  'people ops': 'People',
  'people team': 'People',
  'people operations': 'People',
  'people department': 'People',
  'eng team': 'Engineering',
  // single words
  revops: 'Revenue Operations',
  engineering: 'Engineering',
  engineers: 'Engineering',
  engineer: 'Engineering',
  eng: 'Engineering',
  product: 'Product',
  pms: 'Product',
  pm: 'Product',
  design: 'Design',
  designers: 'Design',
  designer: 'Design',
  data: 'Data',
  analytics: 'Data',
  it: 'IT',
  security: 'Security',
  sales: 'Sales',
  reps: 'Sales',
  csms: 'Customer Success',
  support: 'Customer Support',
  implementation: 'Implementation',
  finance: 'Finance',
  accounting: 'Finance',
  hr: 'People',
  marketing: 'Marketing',
  ops: 'Operations',
  operations: 'Operations',
  legal: 'Legal',
}

const LOCATION_ALIASES = {
  nyc: ['New York'],
  'new york': ['New York'],
  ny: ['New York'],
  sf: ['San Francisco'],
  'san francisco': ['San Francisco'],
  bay: ['San Francisco'],
  austin: ['Austin'],
  london: ['London'],
  berlin: ['Berlin'],
  toronto: ['Toronto'],
  bangalore: ['Bangalore'],
  blr: ['Bangalore'],
  india: ['Bangalore'],
  singapore: ['Singapore'],
  remote: ['Remote (US)', 'Remote (EMEA)'],
  'remote us': ['Remote (US)'],
  'remote emea': ['Remote (EMEA)'],
  emea: ['London', 'Berlin', 'Remote (EMEA)'],
  europe: ['London', 'Berlin', 'Remote (EMEA)'],
  uk: ['London'],
  germany: ['Berlin'],
  us: ['San Francisco', 'New York', 'Austin', 'Remote (US)'],
}

const TITLE_KEYWORDS = [
  { keyword: /\bvp(s)?\b/, contains: 'VP' },
  { keyword: /\bdirectors?\b/, contains: 'Director' },
  { keyword: /\bmanagers?\b/, contains: 'Manager' },
  { keyword: /\bleads?\b/, contains: 'Lead' },
  { keyword: /\binterns?\b/, contains: 'Intern' },
  { keyword: /\bseniors?\b/, contains: 'Senior' },
  { keyword: /\bstaff\b/, contains: 'Staff' },
  { keyword: /\bprincipals?\b/, contains: 'Principal' },
  { keyword: /\banalysts?\b/, contains: 'Analyst' },
  { keyword: /\baccountants?\b/, contains: 'Accountant' },
  { keyword: /\baccount executives?\b|\bAEs?\b/i, contains: 'Account Executive' },
  { keyword: /\bsdrs?\b|\bsales development\b/, contains: 'Sales Development' },
  { keyword: /\bcounsel\b/, contains: 'Counsel' },
  { keyword: /\brecruiters?\b/, contains: 'Recruiter' },
  { keyword: /\bchiefs?\b|\bcxo\b|\bc-suite\b/, contains: 'Chief' },
]

const EMPLOYMENT_TYPE_PATTERNS = [
  { regex: /\bcontractors?\b|\bcontracted\b/, value: 'Contractor' },
  { regex: /\bpart[- ]?time(rs)?\b/, value: 'Part-time' },
  { regex: /\bfull[- ]?time(rs)?\b|\bfte\b/, value: 'Full-time' },
]

const STATUS_PATTERNS = [
  { regex: /\bon leave\b|\bparental\b|\bmaternity\b|\bpaternity\b|\bsabbatical\b/, value: 'On Leave' },
  { regex: /\bonboarding\b|\bpre[- ]?boarding\b|\bnew joiners?\b|\bnew starters?\b/, value: 'Onboarding' },
  { regex: /\bactive\b/, value: 'Active' },
]

const UNSUPPORTED_KEYWORDS = [
  'comp',
  'compensation',
  'raise',
  'raises',
  'bonus',
  'salary',
  'pay',
  'performance',
  'rating',
  'rated',
  'level',
  'levels',
  'promotion',
  'promoted',
  'tier',
]

const PRESETS = {
  'people team in austin': [
    { attribute: 'Department', kind: 'categorical', values: ['People'] },
    { attribute: 'Work location', kind: 'categorical', values: ['Austin'] },
  ],
  'sales reps in europe': [
    { attribute: 'Department', kind: 'categorical', values: ['Sales'] },
    { attribute: 'Work location', kind: 'categorical', values: ['London', 'Berlin', 'Remote (EMEA)'] },
  ],
  'contractors in austin': [
    { attribute: 'Employment type', kind: 'categorical', values: ['Contractor'] },
    { attribute: 'Work location', kind: 'categorical', values: ['Austin'] },
  ],
}

function lowercase(str) {
  return (str || '').toLowerCase()
}

function shiftMonths(date, months) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function shiftYears(date, years) {
  const next = new Date(date)
  next.setFullYear(next.getFullYear() + years)
  return next
}

function toIso(date) {
  return date.toISOString().slice(0, 10)
}

function rangeChip(range) {
  return { attribute: 'Joined', kind: 'date_range', range }
}

function detectDepartments(prompt) {
  // Sort longest alias first so compound phrases beat their sub-words.
  const sortedAliases = Object.keys(DEPARTMENT_ALIASES).sort((a, b) => b.length - a.length)
  const set = new Set()
  // Track character ranges already consumed by a longer match so "operations"
  // doesn't fire again after "revenue operations" already fired.
  const consumed = []

  for (const alias of sortedAliases) {
    const regex = new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`, 'gi')
    let m
    while ((m = regex.exec(prompt)) !== null) {
      const start = m.index
      const end = start + m[0].length
      // Skip if this span is already inside a longer match.
      if (consumed.some(([s, e]) => start >= s && end <= e)) continue
      consumed.push([start, end])
      set.add(DEPARTMENT_ALIASES[alias])
    }
  }
  return [...set]
}

function detectLocations(prompt, validLocations) {
  const validSet = new Set(validLocations)
  const set = new Set()
  for (const [alias, locations] of Object.entries(LOCATION_ALIASES)) {
    const regex = new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`, 'i')
    if (regex.test(prompt)) {
      for (const location of locations) {
        if (validSet.has(location)) set.add(location)
      }
    }
  }
  return [...set]
}

function detectTitles(prompt, validTitles) {
  const matched = new Set()
  for (const { keyword, contains } of TITLE_KEYWORDS) {
    if (keyword.test(prompt)) {
      for (const title of validTitles) {
        if (title.toLowerCase().includes(contains.toLowerCase())) {
          matched.add(title)
        }
      }
    }
  }
  return [...matched]
}

function detectEmploymentTypes(prompt) {
  const set = new Set()
  for (const { regex, value } of EMPLOYMENT_TYPE_PATTERNS) {
    if (regex.test(prompt)) set.add(value)
  }
  return [...set]
}

function detectStatuses(prompt) {
  const set = new Set()
  for (const { regex, value } of STATUS_PATTERNS) {
    if (regex.test(prompt)) set.add(value)
  }
  return [...set]
}

/**
 * Resolve "@Full Name" tokens in the prompt to exact manager names. This is
 * the disambiguation escape hatch when fuzzy first-name matching would over-
 * match (e.g. "Maya" matching four different managers in the dataset).
 */
function detectMentionedManagers(prompt, employees, validManagers) {
  const managerSet = new Set(validManagers)
  const matched = new Set()
  let i = 0
  while (i < prompt.length) {
    if (prompt[i] !== '@') {
      i += 1
      continue
    }
    const rest = prompt.slice(i + 1)
    let best = null
    for (const employee of employees) {
      if (rest.toLowerCase().startsWith(employee.fullName.toLowerCase())) {
        if (!best || employee.fullName.length > best.fullName.length) best = employee
      }
    }
    if (best && managerSet.has(best.fullName)) {
      matched.add(best.fullName)
      i += 1 + best.fullName.length
    } else {
      i += 1
    }
  }
  return [...matched]
}

function detectManagers(prompt, validManagers) {
  // Match "report(s) to X", "X's team/reports", "under X", "managed by X".
  // Optional leading "@" tolerated so "@Maya Pan" works through these regexes.
  const phrases = [
    /\breport(?:s|ing)?\s+to\s+@?([a-z][a-z .'-]+?)(?=\s+(?:and|or|who|that|in|with|joined|since|this|last|past|before|under|managed|reporting)\b|[,.;!?]|$)/i,
    /\bunder\s+@?([a-z][a-z .'-]+?)(?=\s+(?:and|or|who|that|in|with|joined|since|this|last|past|before|under|managed|reporting)\b|[,.;!?]|$)/i,
    /\bmanaged\s+by\s+@?([a-z][a-z .'-]+?)(?=\s+(?:and|or|who|that|in|with|joined|since|this|last|past|before|under|managed|reporting)\b|[,.;!?]|$)/i,
    /\b@?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s\s+(?:team|reports|org)\b/g,
  ]
  const candidates = new Set()
  for (const re of phrases) {
    if (re.global) {
      const matches = prompt.matchAll(re)
      for (const m of matches) {
        if (m[1]) candidates.add(m[1].trim())
      }
    } else {
      const m = prompt.match(re)
      if (m && m[1]) candidates.add(m[1].trim())
    }
  }

  if (candidates.size === 0) return []

  const matched = new Set()
  for (const candidate of candidates) {
    const needle = candidate.toLowerCase()
    for (const manager of validManagers) {
      const lower = manager.toLowerCase()
      if (lower === needle) {
        matched.add(manager)
      } else if (lower.startsWith(`${needle} `) || lower.split(' ')[0] === needle) {
        matched.add(manager)
      } else if (lower.includes(needle) && needle.includes(' ')) {
        matched.add(manager)
      }
    }
  }

  return [...matched]
}

function detectJoinedRange(prompt) {
  const lower = lowercase(prompt)
  const today = new Date()

  let match = lower.match(/\b(?:in\s+the\s+)?(?:last|past)\s+(\d+)\s*(month|months|mo|year|years|yr|yrs)\b/)
  if (match) {
    const n = parseInt(match[1], 10)
    const unit = match[2]
    if (unit.startsWith('y')) {
      return {
        from: toIso(shiftYears(today, -n)),
        to: toIso(today),
        label: `last ${n} ${n === 1 ? 'year' : 'years'}`,
      }
    }
    return {
      from: toIso(shiftMonths(today, -n)),
      to: toIso(today),
      label: `last ${n} ${n === 1 ? 'month' : 'months'}`,
    }
  }

  if (/\b(?:in\s+the\s+)?last\s+year\b/.test(lower)) {
    return {
      from: toIso(shiftYears(today, -1)),
      to: toIso(today),
      label: 'last 12 months',
    }
  }
  if (/\b(?:in\s+the\s+)?last\s+month\b/.test(lower)) {
    return {
      from: toIso(shiftMonths(today, -1)),
      to: toIso(today),
      label: 'last 30 days',
    }
  }
  if (/\b(?:in\s+the\s+)?last\s+quarter\b/.test(lower)) {
    return {
      from: toIso(shiftMonths(today, -3)),
      to: toIso(today),
      label: 'last quarter',
    }
  }

  if (/\bthis\s+year\b/.test(lower)) {
    const from = new Date(today.getFullYear(), 0, 1)
    return { from: toIso(from), to: toIso(today), label: `since Jan ${today.getFullYear()}` }
  }

  match = lower.match(/\bsince\s+(\d{4})\b/)
  if (match) {
    const year = parseInt(match[1], 10)
    return {
      from: `${year}-01-01`,
      to: toIso(today),
      label: `since ${year}`,
    }
  }

  match = lower.match(/\bbefore\s+(\d{4})\b/)
  if (match) {
    const year = parseInt(match[1], 10)
    return {
      from: '',
      to: `${year}-01-01`,
      label: `before ${year}`,
    }
  }

  if (/\b(?:tenured|veterans?|long[- ]tenured|long-?time(?:rs)?)\b/.test(lower)) {
    return {
      from: '',
      to: toIso(shiftYears(today, -5)),
      label: '5+ years tenure',
    }
  }

  if (/\bnew\s+(?:hires?|joiners?|starters?)\b/.test(lower)) {
    return {
      from: toIso(shiftMonths(today, -6)),
      to: toIso(today),
      label: 'last 6 months',
    }
  }

  return null
}

function detectUnsupported(prompt) {
  const lower = lowercase(prompt)
  const found = []
  for (const keyword of UNSUPPORTED_KEYWORDS) {
    const re = new RegExp(`\\b${keyword}\\b`, 'i')
    if (re.test(lower)) found.push(keyword)
  }
  return found
}

function dedupeChips(chips) {
  const map = new Map()
  for (const chip of chips) {
    const existing = map.get(chip.attribute)
    if (!existing) {
      if (chip.kind === 'categorical') {
        map.set(chip.attribute, { ...chip, values: [...new Set(chip.values)] })
      } else {
        map.set(chip.attribute, chip)
      }
      continue
    }
    if (chip.kind === 'categorical' && existing.kind === 'categorical') {
      existing.values = [...new Set([...existing.values, ...chip.values])]
    } else {
      map.set(chip.attribute, chip)
    }
  }
  return [...map.values()]
}

export function parseAiPrompt(prompt, ctx = {}) {
  const trimmed = (prompt || '').trim()
  if (!trimmed) {
    return { chips: [], unhandled: [], summary: '' }
  }

  const departments = ctx.departments || []
  const locations = ctx.locations || []
  const managers = ctx.managers || []
  const employees = ctx.employees || []
  const titlePool = ctx.titles || [...new Set(employees.map((e) => e.title).filter(Boolean))]

  const provisional = []

  const presetKey = trimmed.toLowerCase().replace(/[?.!]+$/g, '').trim()
  if (PRESETS[presetKey]) {
    for (const chip of PRESETS[presetKey]) provisional.push({ ...chip })
  }

  const depts = detectDepartments(trimmed).filter(
    (d) => departments.length === 0 || departments.includes(d),
  )
  if (depts.length > 0) {
    provisional.push({ attribute: 'Department', kind: 'categorical', values: depts })
  }

  const locs = detectLocations(trimmed, locations)
  if (locs.length > 0) {
    provisional.push({ attribute: 'Work location', kind: 'categorical', values: locs })
  }

  const titles = detectTitles(trimmed, titlePool)
  if (titles.length > 0) {
    provisional.push({ attribute: 'Title', kind: 'categorical', values: titles })
  }

  // @ mentions resolve exactly; fuzzy matching only when no @ managers.
  const mentionMgrs = detectMentionedManagers(trimmed, employees, managers)
  if (mentionMgrs.length > 0) {
    provisional.push({ attribute: 'Manager', kind: 'categorical', values: mentionMgrs })
  } else {
    const mgrs = detectManagers(trimmed, managers)
    if (mgrs.length > 0) {
      provisional.push({ attribute: 'Manager', kind: 'categorical', values: mgrs })
    }
  }

  const empTypes = detectEmploymentTypes(trimmed)
  if (empTypes.length > 0) {
    provisional.push({ attribute: 'Employment type', kind: 'categorical', values: empTypes })
  }

  const statuses = detectStatuses(trimmed)
  if (statuses.length > 0) {
    provisional.push({ attribute: 'Status', kind: 'categorical', values: statuses })
  }

  const range = detectJoinedRange(trimmed)
  if (range) provisional.push(rangeChip(range))

  const chips = dedupeChips(provisional)

  const unhandled = []
  const unsupported = detectUnsupported(trimmed)
  if (unsupported.length > 0) {
    unhandled.push(
      `I don't have data for ${[...new Set(unsupported)].join(', ')} yet. ` +
        `Try filtering by department, location, manager, title, status, employment type, or join date.`,
    )
  }
  if (chips.length === 0 && unsupported.length === 0) {
    unhandled.push(
      `Couldn't find anything to filter on. Try mentioning a department, city, manager, title, status, employment type, or join date.`,
    )
  }

  const summary =
    chips.length === 0
      ? 'No filters detected.'
      : `Detected ${chips.length} ${chips.length === 1 ? 'filter' : 'filters'}.`

  return { chips, unhandled, summary }
}

export const AI_SUGGESTIONS = [
  'Engineers in NYC who report to @Maya Pan',
  'Joined in the last 12 months',
  'Contractors in Austin',
]
