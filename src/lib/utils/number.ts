/**
 * Parse a user- or sheet-supplied decimal that may use either "." or ","
 * as the decimal separator (e.g. South African locale: "82,5").
 * Returns undefined for empty / non-numeric input.
 */
export function parseDecimal(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'number') return isNaN(value) ? undefined : value
  const cleaned = String(value).trim().replace(/\s/g, '').replace(',', '.')
  if (cleaned === '') return undefined
  const num = Number(cleaned)
  return isNaN(num) ? undefined : num
}
