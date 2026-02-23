import {
  parseReps,
  parseMaxReps,
  calculateStreak,
  calculateVolumeChange,
  calculateDaysCompletedRate,
  calculateCompletionRate,
  groupVolumeByWeek,
  groupByExercise,
  groupVolumeByType,
} from '@/lib/utils/stats'
import { Workout } from '@/types/workout'

function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: '1',
    week: 1,
    day: 1,
    type: 'Upper Body',
    section: 'Strength',
    exercise: 'Bench Press',
    description: '',
    sets: 3,
    reps: '8-12',
    rir: 2,
    rest: '60s',
    escalation: '',
    notes: '',
    done: false,
    ...overrides,
  }
}

describe('parseReps', () => {
  it('parses a single number', () => {
    expect(parseReps('10')).toBe(10)
  })

  it('averages a range', () => {
    expect(parseReps('8-12')).toBe(10)
  })

  it('rounds the average of an odd range', () => {
    expect(parseReps('5-7')).toBe(6)
  })

  it('returns 0 for non-numeric input', () => {
    expect(parseReps('abc')).toBe(0)
  })

  it('parses zero', () => {
    expect(parseReps('0')).toBe(0)
  })
})

describe('parseMaxReps', () => {
  it('extracts highest from range', () => {
    expect(parseMaxReps('5-7')).toBe(7)
  })

  it('returns single number', () => {
    expect(parseMaxReps('10')).toBe(10)
  })

  it('extracts number from text', () => {
    expect(parseMaxReps('3min total')).toBe(3)
  })

  it('returns 0 for no numbers', () => {
    expect(parseMaxReps('abc')).toBe(0)
  })

  it('handles multiple numbers', () => {
    expect(parseMaxReps('3 sets of 12')).toBe(12)
  })
})

describe('calculateStreak', () => {
  it('returns 0 for empty workouts', () => {
    expect(calculateStreak([])).toBe(0)
  })

  it('counts consecutive completed days from most recent', () => {
    const workouts = [
      makeWorkout({ week: 1, day: 1, done: true }),
      makeWorkout({ week: 1, day: 2, done: true }),
      makeWorkout({ week: 1, day: 3, done: false }),
    ]
    expect(calculateStreak(workouts)).toBe(0) // most recent day (1-3) is not done
  })

  it('counts streak when all most recent days are done', () => {
    const workouts = [
      makeWorkout({ week: 1, day: 1, done: false }),
      makeWorkout({ week: 1, day: 2, done: true }),
      makeWorkout({ week: 1, day: 3, done: true }),
    ]
    expect(calculateStreak(workouts)).toBe(2)
  })

  it('handles single completed day', () => {
    const workouts = [makeWorkout({ week: 1, day: 1, done: true })]
    expect(calculateStreak(workouts)).toBe(1)
  })

  it('requires all exercises in a day to be done', () => {
    const workouts = [
      makeWorkout({ week: 1, day: 1, done: true, exercise: 'A' }),
      makeWorkout({ week: 1, day: 1, done: false, exercise: 'B' }),
    ]
    expect(calculateStreak(workouts)).toBe(0)
  })
})

describe('calculateVolumeChange', () => {
  it('returns null with no saved workouts', () => {
    expect(calculateVolumeChange([])).toBeNull()
  })

  it('returns null with only one week', () => {
    const workouts = [
      makeWorkout({ week: 1, set1: 10, lastSaved: '2024-01-01' }),
    ]
    expect(calculateVolumeChange(workouts)).toBeNull()
  })

  it('calculates positive volume change', () => {
    const workouts = [
      makeWorkout({ week: 1, set1: 10, set2: 10, lastSaved: '2024-01-01' }),
      makeWorkout({ week: 2, set1: 12, set2: 12, lastSaved: '2024-01-08' }),
    ]
    expect(calculateVolumeChange(workouts)).toBe(20) // (24-20)/20 * 100 = 20
  })

  it('calculates negative volume change', () => {
    const workouts = [
      makeWorkout({ week: 1, set1: 10, set2: 10, lastSaved: '2024-01-01' }),
      makeWorkout({ week: 2, set1: 8, set2: 8, lastSaved: '2024-01-08' }),
    ]
    expect(calculateVolumeChange(workouts)).toBe(-20) // (16-20)/20 * 100 = -20
  })
})

describe('calculateDaysCompletedRate', () => {
  it('returns 0 for empty workouts', () => {
    expect(calculateDaysCompletedRate([])).toBe(0)
  })

  it('calculates rate correctly', () => {
    const workouts = [
      makeWorkout({ week: 1, day: 1, done: true }),
      makeWorkout({ week: 1, day: 2, done: false }),
    ]
    expect(calculateDaysCompletedRate(workouts)).toBe(50)
  })

  it('returns 100 when all days completed', () => {
    const workouts = [
      makeWorkout({ week: 1, day: 1, done: true }),
      makeWorkout({ week: 1, day: 2, done: true }),
    ]
    expect(calculateDaysCompletedRate(workouts)).toBe(100)
  })
})

describe('calculateCompletionRate', () => {
  it('returns 0 for empty', () => {
    expect(calculateCompletionRate([])).toBe(0)
  })

  it('calculates percentage of done exercises', () => {
    const workouts = [
      makeWorkout({ done: true }),
      makeWorkout({ done: false }),
      makeWorkout({ done: true }),
      makeWorkout({ done: false }),
    ]
    expect(calculateCompletionRate(workouts)).toBe(50)
  })
})

describe('groupVolumeByWeek', () => {
  it('returns empty for no workouts', () => {
    expect(groupVolumeByWeek([])).toEqual([])
  })

  it('only includes saved workouts', () => {
    const workouts = [
      makeWorkout({ week: 1, set1: 10, lastSaved: undefined }),
      makeWorkout({ week: 1, set1: 10, lastSaved: '2024-01-01' }),
    ]
    const result = groupVolumeByWeek(workouts)
    expect(result).toHaveLength(1)
    expect(result[0].reps).toBe(10)
  })

  it('aggregates multiple exercises in same week', () => {
    const workouts = [
      makeWorkout({ week: 1, set1: 10, set2: 8, lastSaved: '2024-01-01' }),
      makeWorkout({ week: 1, set1: 12, lastSaved: '2024-01-01' }),
    ]
    const result = groupVolumeByWeek(workouts)
    expect(result).toHaveLength(1)
    expect(result[0].reps).toBe(30) // 10+8+12
    expect(result[0].sets).toBe(3) // 2 sets + 1 set
  })

  it('sorts by week ascending', () => {
    const workouts = [
      makeWorkout({ week: 3, set1: 5, lastSaved: '2024-01-01' }),
      makeWorkout({ week: 1, set1: 5, lastSaved: '2024-01-01' }),
      makeWorkout({ week: 2, set1: 5, lastSaved: '2024-01-01' }),
    ]
    const result = groupVolumeByWeek(workouts)
    expect(result.map(r => r.week)).toEqual([1, 2, 3])
  })
})

describe('groupByExercise', () => {
  it('returns empty for no workouts', () => {
    expect(groupByExercise([])).toEqual([])
  })

  it('groups by exercise name and week', () => {
    const workouts = [
      makeWorkout({ exercise: 'Bench Press', week: 1, set1: 10, set2: 8, lastSaved: '2024-01-01' }),
      makeWorkout({ exercise: 'Bench Press', week: 2, set1: 12, set2: 10, lastSaved: '2024-01-08' }),
      makeWorkout({ exercise: 'Squat', week: 1, set1: 15, lastSaved: '2024-01-01' }),
    ]
    const result = groupByExercise(workouts)
    expect(result).toHaveLength(2)

    const bench = result.find(e => e.exercise === 'Bench Press')!
    expect(bench.weeks).toHaveLength(2)
    expect(bench.weeks[0].volume).toBe(18) // 10+8
    expect(bench.weeks[0].peakRep).toBe(10)
    expect(bench.weeks[1].volume).toBe(22) // 12+10
  })

  it('skips exercises with no sets data', () => {
    const workouts = [
      makeWorkout({ exercise: 'Stretch', lastSaved: '2024-01-01' }),
    ]
    expect(groupByExercise(workouts)).toEqual([])
  })

  it('sorts exercises alphabetically', () => {
    const workouts = [
      makeWorkout({ exercise: 'Squat', week: 1, set1: 10, lastSaved: '2024-01-01' }),
      makeWorkout({ exercise: 'Bench Press', week: 1, set1: 10, lastSaved: '2024-01-01' }),
    ]
    const result = groupByExercise(workouts)
    expect(result[0].exercise).toBe('Bench Press')
    expect(result[1].exercise).toBe('Squat')
  })
})

describe('groupVolumeByType', () => {
  it('returns empty for no workouts', () => {
    const result = groupVolumeByType([])
    expect(result.data).toEqual([])
    expect(result.types).toEqual([])
  })

  it('groups volume by type per week', () => {
    const workouts = [
      makeWorkout({ week: 1, type: 'Upper Body', set1: 10, lastSaved: '2024-01-01' }),
      makeWorkout({ week: 1, type: 'Lower Body', set1: 8, lastSaved: '2024-01-01' }),
      makeWorkout({ week: 2, type: 'Upper Body', set1: 12, lastSaved: '2024-01-08' }),
    ]
    const result = groupVolumeByType(workouts)
    expect(result.types).toEqual(['Lower Body', 'Upper Body'])
    expect(result.data).toHaveLength(2)
    expect(result.data[0]['Upper Body']).toBe(10)
    expect(result.data[0]['Lower Body']).toBe(8)
    expect(result.data[1]['Upper Body']).toBe(12)
  })
})
