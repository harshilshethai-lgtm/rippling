/**
 * Minimal RFC-4180-compatible CSV parser.
 * Handles quoted fields, escaped double-quotes, and CRLF/LF line endings.
 * Returns { headers: string[], rows: string[][] } where every element is trimmed.
 */
export function parseCsv(text) {
  const lines = splitCsvLines(text)
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = parseCsvRow(lines[0]).map((h) => h.trim())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvRow(lines[i]).map((c) => c.trim())
    // Skip entirely-blank rows
    if (cells.every((c) => c === '')) continue
    rows.push(cells)
  }
  return { headers, rows }
}

function splitCsvLines(text) {
  // Split on newlines that are not inside quoted fields
  const lines = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
        cur += ch
      }
    } else if ((ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) && !inQuotes) {
      if (ch === '\r') i++
      lines.push(cur)
      cur = ''
    } else if (ch === '\r' && !inQuotes) {
      lines.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  if (cur.length > 0) lines.push(cur)
  return lines.filter((l) => l.trim() !== '' || lines.indexOf(l) === 0)
}

function parseCsvRow(line) {
  const fields = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  fields.push(cur)
  return fields
}

/**
 * Given an array of CSV header strings, returns which column index maps to
 * "Name" or "Email" (or undefined if no match). Matching is case-insensitive.
 */
export function detectMapping(headers) {
  const namePatterns = /^(full.?name|name|employee.?name|employee|person)$/i
  const emailPatterns = /^(e-?mail|work.?e-?mail|email.?address)$/i

  const mapping = {}
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim()
    if (mapping.Name === undefined && namePatterns.test(h)) mapping.Name = i
    if (mapping.Email === undefined && emailPatterns.test(h)) mapping.Email = i
  }
  return mapping
}

/**
 * Normalize a string for comparison: lowercase, collapse whitespace.
 */
function norm(str) {
  return (str || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

// Cap on how many candidates we surface in the picker. The picker has its
// own search box, so we can afford a generous cap without overwhelming the UI.
const MAX_CANDIDATES = 12

/**
 * Resolve a single CSV row against the employee directory.
 *
 * Returns:
 *   { raw, status: 'auto', matchId }
 *   { raw, status: 'ambiguous', candidateIds }
 *   { raw, status: 'missed' }
 *
 * Pipeline (first to fire wins):
 *   1. Exact email
 *   2. Exact full name
 *   3. First + Last token match (with first-initial / last-initial fallbacks)
 *   4. First-name-only match (this is where Eric -> {Eric V, Eric C, ...} lives)
 *   5. Substring fallback (broad fuzzy, last resort)
 */
export function resolveRow(cells, mapping, employees) {
  const raw = {
    name: mapping.Name !== undefined ? cells[mapping.Name] ?? '' : '',
    email: mapping.Email !== undefined ? cells[mapping.Email] ?? '' : '',
  }

  // 1. Exact email match (fastest, most reliable).
  if (raw.email) {
    const emailNorm = raw.email.toLowerCase().trim()
    const hit = employees.filter((e) => e.email.toLowerCase() === emailNorm)
    if (hit.length === 1) return { raw, status: 'auto', matchId: hit[0].id }
    if (hit.length > 1) {
      return { raw, status: 'ambiguous', candidateIds: hit.slice(0, MAX_CANDIDATES).map((e) => e.id) }
    }
  }

  if (!raw.name) return { raw, status: 'missed' }

  const nameNorm = norm(raw.name)
  const tokens = nameNorm.split(' ').filter(Boolean)

  // 2. Exact full-name match.
  const exactFull = employees.filter((e) => norm(e.fullName) === nameNorm)
  if (exactFull.length === 1) return { raw, status: 'auto', matchId: exactFull[0].id }
  if (exactFull.length > 1) {
    return {
      raw,
      status: 'ambiguous',
      candidateIds: exactFull.slice(0, MAX_CANDIDATES).map((e) => e.id),
    }
  }

  // 3. First + Last token match (handles middle names or slight differences).
  if (tokens.length >= 2) {
    const first = tokens[0]
    const last = tokens[tokens.length - 1]

    const fl = employees.filter(
      (e) => norm(e.firstName) === first && norm(e.lastName) === last,
    )
    if (fl.length === 1) return { raw, status: 'auto', matchId: fl[0].id }
    if (fl.length > 1) {
      return { raw, status: 'ambiguous', candidateIds: fl.slice(0, MAX_CANDIDATES).map((e) => e.id) }
    }

    // 3b. First initial + full last name (e.g. "J Smith" -> Jane Smith).
    if (first.length === 1) {
      const initialFirst = employees.filter(
        (e) => norm(e.firstName).startsWith(first) && norm(e.lastName) === last,
      )
      if (initialFirst.length === 1) return { raw, status: 'auto', matchId: initialFirst[0].id }
      if (initialFirst.length > 1) {
        return {
          raw,
          status: 'ambiguous',
          candidateIds: initialFirst.slice(0, MAX_CANDIDATES).map((e) => e.id),
        }
      }
    }

    // 3c. Full first name + last initial (e.g. "Eric C" -> Eric Cholankeril).
    if (last.length === 1) {
      const initialLast = employees.filter(
        (e) => norm(e.firstName) === first && norm(e.lastName).startsWith(last),
      )
      if (initialLast.length === 1) return { raw, status: 'auto', matchId: initialLast[0].id }
      if (initialLast.length > 1) {
        return {
          raw,
          status: 'ambiguous',
          candidateIds: initialLast.slice(0, MAX_CANDIDATES).map((e) => e.id),
        }
      }
    }
  }

  // 4. First-name-only match. Runs BEFORE generic substring so that "eric"
  // surfaces every employee whose firstName === "Eric" rather than every
  // employee with the substring "eric" anywhere (which would also catch
  // "Erickson" and similar). This is the case the user explicitly called
  // out: when a single first name has multiple matches, ask which one.
  if (tokens.length === 1) {
    const firstOnly = employees.filter((e) => norm(e.firstName) === tokens[0])
    if (firstOnly.length === 1) return { raw, status: 'auto', matchId: firstOnly[0].id }
    if (firstOnly.length > 1) {
      return {
        raw,
        status: 'ambiguous',
        candidateIds: firstOnly.slice(0, MAX_CANDIDATES).map((e) => e.id),
      }
    }
  }

  // 5. Substring fallback (broad fuzzy match, last resort).
  const substring = employees.filter((e) => norm(e.fullName).includes(nameNorm))
  if (substring.length === 1) return { raw, status: 'auto', matchId: substring[0].id }
  if (substring.length > 1 && substring.length <= MAX_CANDIDATES) {
    return {
      raw,
      status: 'ambiguous',
      candidateIds: substring.slice(0, MAX_CANDIDATES).map((e) => e.id),
    }
  }

  return { raw, status: 'missed' }
}

/**
 * Resolve all CSV rows at once.
 * Returns an array of resolved row objects (one per CSV data row).
 */
export function resolveAllRows(csvRows, mapping, employees) {
  return csvRows.map((cells) => resolveRow(cells, mapping, employees))
}

/**
 * Build a downloadable CSV template Blob with sample rows.
 */
export function buildTemplateBlob() {
  const lines = [
    'Name,Email',
    'Jane Smith,jane.smith@acme.com',
    'John Doe,john.doe@acme.com',
  ]
  return new Blob([lines.join('\r\n')], { type: 'text/csv' })
}

/**
 * Read a File object as text (returns a Promise<string>).
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
