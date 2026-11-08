import { parseSheetDate, normaliseDateString, applyDateToTimestamp, toDateInputValue, calculateSessionDuration } from '@/lib/utils/dates'

describe('parseSheetDate', () => {
  it('parses en-ZA, ISO and day-first formats to the same day', () => {
    expect(normaliseDateString('2026/11/03')).toBe('2026-11-03')
    expect(normaliseDateString('2026-11-03')).toBe('2026-11-03')
    expect(normaliseDateString('03/11/2026')).toBe('2026-11-03')
  })
  it('parses full ISO timestamps', () => {
    expect(parseSheetDate('2024-01-15T10:30:00Z')).toBeInstanceOf(Date)
  })
  it('returns null for junk and empty', () => {
    expect(parseSheetDate('')).toBeNull()
    expect(parseSheetDate(undefined)).toBeNull()
    expect(parseSheetDate('not a date')).toBeNull()
  })
})

describe('applyDateToTimestamp', () => {
  it('changes the day and keeps time of day', () => {
    const original = new Date(2026, 10, 8, 18, 45, 10).toISOString()
    const moved = new Date(applyDateToTimestamp(original, '2026-11-03'))
    expect(toDateInputValue(moved)).toBe('2026-11-03')
    expect([moved.getHours(), moved.getMinutes()]).toEqual([18, 45])
  })
  it('uses noon when there is no original time', () => {
    const moved = new Date(applyDateToTimestamp(undefined, '2026-11-03'))
    expect(toDateInputValue(moved)).toBe('2026-11-03')
    expect(moved.getHours()).toBe(12)
  })
})

describe('calculateSessionDuration', () => {
  it('adds 3 minutes lead-in to first->last span', () => {
    const a = new Date(2026, 10, 3, 17, 0).toISOString()
    const b = new Date(2026, 10, 3, 17, 40).toISOString()
    expect(calculateSessionDuration([a, b, undefined])).toBe(43)
  })
  it('returns undefined for multi-day sessions or no data', () => {
    expect(calculateSessionDuration([])).toBeUndefined()
    const a = new Date(2026, 10, 3, 17, 0).toISOString()
    const b = new Date(2026, 10, 4, 17, 0).toISOString()
    expect(calculateSessionDuration([a, b])).toBeUndefined()
  })
})
