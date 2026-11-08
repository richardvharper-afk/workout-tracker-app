import { parseDecimal } from '@/lib/utils/number'

describe('parseDecimal', () => {
  it('parses period and comma decimals', () => {
    expect(parseDecimal('82.5')).toBe(82.5)
    expect(parseDecimal('82,5')).toBe(82.5)
  })
  it('passes numbers through', () => {
    expect(parseDecimal(38.5)).toBe(38.5)
  })
  it('returns undefined for empty / invalid', () => {
    expect(parseDecimal('')).toBeUndefined()
    expect(parseDecimal(undefined)).toBeUndefined()
    expect(parseDecimal('abc')).toBeUndefined()
  })
  it('tolerates whitespace', () => {
    expect(parseDecimal(' 82,5 ')).toBe(82.5)
  })
})
