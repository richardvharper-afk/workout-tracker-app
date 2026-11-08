import { calculateMuscleLoadProgression, estimate1RM, toChartRows } from '@/lib/metrics/muscle-progression'
import { parseLoad } from '@/lib/metrics/load-parser'
import { Workout } from '@/types/workout'

function w(over: Partial<Workout>): Workout {
  return {
    id: '1', week: 1, day: 1, type: 'Upper Body', section: 'Strength', exercise: 'Bench Press',
    description: '', sets: 3, reps: '8', rir: 2, rest: '90s', escalation: '', notes: '',
    done: true, muscleGroup: 'Chest', set1: 8, load: '60kg', ...over,
  } as Workout
}

describe('parseLoad comma decimals', () => {
  it('reads 22,5kg as 22.5', () => {
    expect(parseLoad('22,5kg', 80, w({}))?.value).toBe(22.5)
  })
})

describe('calculateMuscleLoadProgression', () => {
  const data = [
    w({ week: 1, load: '60kg' }),
    w({ week: 2, load: '62,5kg' }),
    w({ week: 5, load: '66kg' }),
    w({ week: 1, exercise: 'Fly', load: '10kg', id: '2' }),
    w({ week: 5, exercise: 'Fly', load: '12kg', id: '2' }),
    w({ week: 1, exercise: 'Band Press', load: 'band', id: '3' }),
    w({ week: 1, exercise: 'Squat', muscleGroup: 'Quads', id: '4' }),
  ]

  it('only includes the requested muscle and flags untracked', () => {
    const r = calculateMuscleLoadProgression(data, 'chest', 80)
    expect(r.exercises.map(e => e.exercise).sort()).toEqual(['Bench Press', 'Fly'])
    expect(r.untracked).toEqual(['Band Press'])
  })

  it('computes change since start and 4wk change', () => {
    const r = calculateMuscleLoadProgression(data, 'chest', 80)
    const bench = r.exercises.find(e => e.exercise === 'Bench Press')!
    expect(bench.changeSinceStart).toBeCloseTo(10)
    expect(bench.change4wk).toBeCloseTo(((66 - 60) / 60) * 100) // week 1 is >=4 wks before week 5
    expect(r.avgChangeSinceStart).toBeCloseTo((10 + 20) / 2)
  })

  it('ignores undone workouts', () => {
    const r = calculateMuscleLoadProgression([w({ done: false })], 'chest', 80)
    expect(r.exercises).toHaveLength(0)
  })

  it('e1rm metric and chart rows', () => {
    expect(estimate1RM(60, 8)).toBeCloseTo(76)
    const r = calculateMuscleLoadProgression(data, 'chest', 80, 'load')
    const rows = toChartRows(r, 'load')
    expect(rows.map(x => x.week)).toEqual([1, 2, 5])
    expect(rows[0]['Bench Press']).toBe(60)
  })
})
