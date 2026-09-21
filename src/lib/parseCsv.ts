export type CsvRecord = Record<string, string>

function stripBom(content: string) {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content
}

function parseCsvRecords(content: string): string[][] {
  const records: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let index = 0

  while (index < content.length) {
    const char = content[index]

    if (inQuotes) {
      if (char === '"') {
        const next = content[index + 1]
        if (next === '"') {
          field += '"'
          index += 2
          continue
        }
        inQuotes = false
        index += 1
        continue
      }
      field += char
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = true
      index += 1
      continue
    }

    if (char === ',') {
      row.push(field)
      field = ''
      index += 1
      continue
    }

    if (char === '\r') {
      index += 1
      if (content[index] === '\n') index += 1
      row.push(field)
      field = ''
      if (row.length > 1 || row[0] !== '') {
        records.push(row)
      }
      row = []
      continue
    }

    if (char === '\n') {
      row.push(field)
      field = ''
      if (row.length > 1 || row[0] !== '') {
        records.push(row)
      }
      row = []
      index += 1
      continue
    }

    field += char
    index += 1
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    if (row.length > 1 || row[0] !== '') {
      records.push(row)
    }
  }

  return records
}

function isEmptyRecord(record: string[]) {
  return record.every((cell) => cell.trim() === '')
}

/**
 * Parse CSV text into objects keyed by the header row (RFC 4180-style, browser-safe).
 */
export function parseCsv(content: string): CsvRecord[] {
  const normalized = stripBom(content)
  const records = parseCsvRecords(normalized).filter((record) => !isEmptyRecord(record))
  if (records.length === 0) return []

  const headers = records[0]
  return records.slice(1).map((cells) => {
    const row: CsvRecord = {}
    headers.forEach((header, headerIndex) => {
      row[header] = cells[headerIndex] ?? ''
    })
    return row
  })
}
