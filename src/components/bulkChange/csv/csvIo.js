/**
 * Minimal RFC-4180-compatible CSV parser.
 * Handles quoted fields, escaped double-quotes, and CRLF/LF line endings.
 * Returns { headers: string[], rows: string[][] } where every element is trimmed.
 */
export function parseCsv(text) {
  const lines = splitCsvLines(text)
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = parseCsvRow(lines[0]).map((header) => header.trim())
  const rows = []
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvRow(lines[i]).map((cell) => cell.trim())
    if (cells.every((cell) => cell === '')) continue
    rows.push(cells)
  }
  return { headers, rows }
}

function splitCsvLines(text) {
  const lines = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
        current += ch
      }
    } else if ((ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) && !inQuotes) {
      if (ch === '\r') i += 1
      lines.push(current)
      current = ''
    } else if (ch === '\r' && !inQuotes) {
      lines.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current.length > 0) lines.push(current)
  return lines.filter((line, index) => line.trim() !== '' || index === 0)
}

function parseCsvRow(line) {
  const fields = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(event.target.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
