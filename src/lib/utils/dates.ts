/**
 * Date helpers that tolerate the formats Google Sheets can hand back.
 * Sheets reformats typed dates using the spreadsheet locale (en-ZA: 2026/11/03),
 * and values entered by hand may use d/M/yyyy.
 */

const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar date as yyyy-MM-dd (what <input type="date"> uses) */
export function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Parse an ISO timestamp, yyyy-MM-dd, yyyy/MM/dd or d/M/yyyy into a Date.
 * Date-only values become local noon so timezone shifts never change the day.
 * Returns null when unparseable.
 */
export function parseSheetDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  if (!s) return null

  // Full timestamp (has a time part) - let the engine handle it
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  }

  let y: number, m: number, d: number
  let match = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (match) {
    y = +match[1]; m = +match[2]; d = +match[3]
  } else if ((match = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/))) {
    // South African / European order: day first
    d = +match[1]; m = +match[2]; y = +match[3]
  } else {
    const fallback = new Date(s)
    return isNaN(fallback.getTime()) ? null : fallback
  }

  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const date = new Date(y, m - 1, d, 12, 0, 0)
  return isNaN(date.getTime()) ? null : date
}

/** Normalise any sheet date to yyyy-MM-dd; returns the input unchanged if unparseable */
export function normaliseDateString(value: unknown): string {
  const d = parseSheetDate(value)
  if (!d) return value === null || value === undefined ? '' : String(value)
  return toDateInputValue(d)
}

/**
 * Move a stored timestamp to a different calendar day (yyyy-MM-dd),
 * preserving its time of day (noon if there is no usable original).
 */
export function applyDateToTimestamp(original: string | undefined, dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const base = parseSheetDate(original)
  const hasTime = !!original && /T/.test(original)
  const h = base && hasTime ? base.getHours() : 12
  const mi = base && hasTime ? base.getMinutes() : 0
  const s = base && hasTime ? base.getSeconds() : 0
  return new Date(y, m - 1, d, h, mi, s).toISOString()
}

/** Minutes between first and last saved exercise of a session (same-day only), +3 min lead-in */
export function calculateSessionDuration(savedTimestamps: Array<string | undefined>): number | undefined {
  const times = savedTimestamps
    .map(t => parseSheetDate(t))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime())
  if (times.length === 0) return undefined
  const first = times[0]
  const last = times[times.length - 1]
  if (first.toDateString() !== last.toDateString()) return undefined
  return Math.round((last.getTime() - first.getTime() + 3 * 60 * 1000) / 60000)
}
