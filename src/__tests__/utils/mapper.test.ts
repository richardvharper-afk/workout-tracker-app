import { mapRowToWorkout, mapWorkoutToRow, calculateAvgRir, validateWorkout } from '@/lib/google-sheets/mapper'
import { SHEET_COLUMNS } from '@/types/sheets'

function makeRow(): any[] {
  const row = new Array(24).fill('')
  row[SHEET_COLUMNS.WEEK] = 'Week 1'
  row[SHEET_COLUMNS.DAY] = 'Day 2'
  row[SHEET_COLUMNS.TYPE] = 'Upper Body'
  row[SHEET_COLUMNS.SECTION] = 'Strength'
  row[SHEET_COLUMNS.EXERCISE] = 'Bench Press'
  row[SHEET_COLUMNS.DESCRIPTION] = 'Flat bench barbell press'
  row[SHEET_COLUMNS.SETS] = 3
  row[SHEET_COLUMNS.REPS] = '8-12'
  row[SHEET_COLUMNS.RIR] = 2
  row[SHEET_COLUMNS.REST] = '60s'
  row[SHEET_COLUMNS.ESCALATION] = '+2.5kg'
  row[SHEET_COLUMNS.NOTES] = 'Focus on form'
  row[SHEET_COLUMNS.SET1] = '10'
  row[SHEET_COLUMNS.SET2] = '9'
  row[SHEET_COLUMNS.SET3] = '8'
  row[SHEET_COLUMNS.SET4] = ''
  row[SHEET_COLUMNS.SET5] = ''
  row[SHEET_COLUMNS.LOAD] = '135 lbs'
  row[SHEET_COLUMNS.AVG_RIR] = '2.5'
  row[SHEET_COLUMNS.DONE] = 'TRUE'
  row[SHEET_COLUMNS.LAST_SAVED] = '2024-01-15T10:30:00Z'
  row[SHEET_COLUMNS.VIDEO_URL] = ''
  row[SHEET_COLUMNS.ROW_INDEX] = '5'
  row[SHEET_COLUMNS.MUSCLE_GROUP] = 'Chest'
  return row
}

describe('mapRowToWorkout', () => {
  it('maps a complete row correctly', () => {
    const row = makeRow()
    const workout = mapRowToWorkout(row, 5)

    expect(workout.id).toBe('5')
    expect(workout.week).toBe(1) // Extracted from "Week 1"
    expect(workout.day).toBe(2) // Extracted from "Day 2"
    expect(workout.type).toBe('Upper Body')
    expect(workout.section).toBe('Strength')
    expect(workout.exercise).toBe('Bench Press')
    expect(workout.description).toBe('Flat bench barbell press')
    expect(workout.sets).toBe(3)
    expect(workout.reps).toBe('8-12')
    expect(workout.rir).toBe(2)
    expect(workout.rest).toBe('60s')
    expect(workout.set1).toBe(10)
    expect(workout.set2).toBe(9)
    expect(workout.set3).toBe(8)
    expect(workout.set4).toBeUndefined()
    expect(workout.set5).toBeUndefined()
    expect(workout.load).toBe('135 lbs')
    expect(workout.avgRir).toBe(2.5)
    expect(workout.done).toBe(true)
    expect(workout.lastSaved).toBe('2024-01-15T10:30:00Z')
    expect(workout.muscleGroup).toBe('Chest')
  })

  it('handles numeric week/day values', () => {
    const row = makeRow()
    row[SHEET_COLUMNS.WEEK] = 3
    row[SHEET_COLUMNS.DAY] = 1
    const workout = mapRowToWorkout(row, 1)
    expect(workout.week).toBe(3)
    expect(workout.day).toBe(1)
  })

  it('handles empty optional fields', () => {
    const row = new Array(24).fill('')
    row[SHEET_COLUMNS.WEEK] = 1
    row[SHEET_COLUMNS.DAY] = 1
    row[SHEET_COLUMNS.TYPE] = 'Core'
    row[SHEET_COLUMNS.SECTION] = 'Core'
    row[SHEET_COLUMNS.EXERCISE] = 'Plank'
    row[SHEET_COLUMNS.SETS] = 3
    row[SHEET_COLUMNS.REPS] = '30s'
    row[SHEET_COLUMNS.DONE] = 'FALSE'

    const workout = mapRowToWorkout(row, 1)
    expect(workout.set1).toBeUndefined()
    expect(workout.load).toBeUndefined()
    expect(workout.lastSaved).toBeUndefined()
    expect(workout.done).toBe(false)
  })
})

describe('mapWorkoutToRow', () => {
  it('converts workout back to row format', () => {
    const row = makeRow()
    const workout = mapRowToWorkout(row, 5)
    const outputRow = mapWorkoutToRow(workout)

    expect(outputRow).toHaveLength(24)
    expect(outputRow[SHEET_COLUMNS.TYPE]).toBe('Upper Body')
    expect(outputRow[SHEET_COLUMNS.EXERCISE]).toBe('Bench Press')
    expect(outputRow[SHEET_COLUMNS.DONE]).toBe('TRUE')
    expect(outputRow[SHEET_COLUMNS.LOAD]).toBe('135 lbs')
  })

  it('preserves raw week/day values', () => {
    const row = makeRow()
    const workout = mapRowToWorkout(row, 5)
    const outputRow = mapWorkoutToRow(workout)

    expect(outputRow[SHEET_COLUMNS.WEEK]).toBe('Week 1')
    expect(outputRow[SHEET_COLUMNS.DAY]).toBe('Day 2')
  })

  it('formats empty optional values', () => {
    const row = new Array(24).fill('')
    row[SHEET_COLUMNS.WEEK] = 1
    row[SHEET_COLUMNS.DAY] = 1
    row[SHEET_COLUMNS.TYPE] = 'Core'
    row[SHEET_COLUMNS.SECTION] = 'Core'
    row[SHEET_COLUMNS.EXERCISE] = 'Plank'
    row[SHEET_COLUMNS.SETS] = 3
    row[SHEET_COLUMNS.REPS] = '30s'
    row[SHEET_COLUMNS.DONE] = 'FALSE'

    const workout = mapRowToWorkout(row, 1)
    const outputRow = mapWorkoutToRow(workout)

    expect(outputRow[SHEET_COLUMNS.SET1]).toBe('')
    expect(outputRow[SHEET_COLUMNS.LOAD]).toBe('')
    expect(outputRow[SHEET_COLUMNS.DONE]).toBe('FALSE')
  })
})

describe('calculateAvgRir', () => {
  it('returns undefined for no sets', () => {
    expect(calculateAvgRir()).toBeUndefined()
  })

  it('calculates average of provided sets', () => {
    expect(calculateAvgRir(2, 3, 2)).toBe(2.3)
  })

  it('skips undefined sets', () => {
    expect(calculateAvgRir(4, undefined, 2)).toBe(3)
  })

  it('rounds to 1 decimal', () => {
    expect(calculateAvgRir(1, 2, 3)).toBe(2)
  })
})

describe('validateWorkout', () => {
  it('returns no errors for valid workout', () => {
    const errors = validateWorkout({
      exercise: 'Bench Press',
      type: 'Upper Body',
      section: 'Strength',
      week: 1,
      day: 1,
      sets: 3,
      rir: 2,
    })
    expect(errors).toHaveLength(0)
  })

  it('requires exercise name', () => {
    const errors = validateWorkout({ exercise: '', type: 'Core', section: 'Core' })
    expect(errors).toContain('Exercise name is required')
  })

  it('requires type', () => {
    const errors = validateWorkout({ exercise: 'Plank', section: 'Core' })
    expect(errors).toContain('Workout type is required')
  })

  it('requires section', () => {
    const errors = validateWorkout({ exercise: 'Plank', type: 'Core' })
    expect(errors).toContain('Workout section is required')
  })

  it('validates week range', () => {
    const errors = validateWorkout({ exercise: 'A', type: 'Core', section: 'Core', week: 53 })
    expect(errors).toContain('Week must be between 1 and 52')
  })

  it('validates day range', () => {
    const errors = validateWorkout({ exercise: 'A', type: 'Core', section: 'Core', day: 0 })
    expect(errors).toContain('Day must be between 1 and 7')
  })

  it('validates sets range', () => {
    const errors = validateWorkout({ exercise: 'A', type: 'Core', section: 'Core', sets: 11 })
    expect(errors).toContain('Sets must be between 1 and 10')
  })
})
