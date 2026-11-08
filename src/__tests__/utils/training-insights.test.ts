import { suggestNextTarget, parseRepRange, parseEscalationStep } from '@/lib/metrics/next-target'
import { findPRHistory } from '@/lib/metrics/personal-records'
import { computeAlerts, findStagnantExercises } from '@/lib/metrics/alerts'
import { calculateExerciseProgression } from '@/lib/metrics/progression'
import { Workout } from '@/types/workout'

let n = 0
function w(over: Partial<Workout>): Workout {
  n += 1
  return {
    id: String(n), week: 1, day: 1, type: 'Upper Body', section: 'Strength', exercise: 'Bench Press',
    description: '', sets: 3, reps: '8-12', rir: 2, rest: '90s', escalation: '+2.5kg', notes: '',
    done: true, lastSaved: '2026-01-01T10:00:00Z', muscleGroup: 'Chest', load: '40kg',
    set1: 10, set2: 10, set3: 10, ...over,
  } as Workout
}

describe('parsing helpers', () => {
  it('parses rep ranges', () => {
    expect(parseRepRange('8-12')).toEqual({ min: 8, max: 12 })
    expect(parseRepRange('8–12')).toEqual({ min: 8, max: 12 })
    expect(parseRepRange('10')).toEqual({ min: 10, max: 10 })
    expect(parseRepRange('30s')).toBeNull()
  })
  it('parses escalation step with default', () => {
    expect(parseEscalationStep('+5kg')).toBe(5)
    expect(parseEscalationStep('+1,25 kg')).toBe(1.25)
    expect(parseEscalationStep('+1 rep')).toBe(2.5)
    expect(parseEscalationStep(undefined)).toBe(2.5)
  })
})

describe('suggestNextTarget', () => {
  const current = w({ week: 2, done: false, set1: undefined, set2: undefined, set3: undefined, lastSaved: undefined })

  it('suggests more load when every set hit the top of the range', () => {
    const prev = w({ week: 1, set1: 12, set2: 12, set3: 12 })
    const t = suggestNextTarget(current, [prev, current])!
    expect(t.kind).toBe('increase-load')
    expect(t.headline).toContain('42.5')
  })

  it('suggests one more rep when inside the range', () => {
    const prev = w({ week: 1, set1: 10, set2: 9, set3: 8 })
    const t = suggestNextTarget(current, [prev, current])!
    expect(t.kind).toBe('add-rep')
    expect(t.headline).toContain('9 reps')
  })

  it('holds the load when a set fell below the range', () => {
    const prev = w({ week: 1, set1: 8, set2: 7, set3: 6 })
    expect(suggestNextTarget(current, [prev, current])!.kind).toBe('hold')
  })

  it('does not suggest an increase if sets were skipped', () => {
    const prev = w({ week: 1, set1: 12, set2: 12, set3: undefined })
    expect(suggestNextTarget(current, [prev, current])!.kind).not.toBe('increase-load')
  })

  it('falls back to reps-only for bodyweight work', () => {
    const cur = w({ week: 2, exercise: 'Pull-up', isBodyweight: true, load: '', done: false, lastSaved: undefined })
    const prev = w({ week: 1, exercise: 'Pull-up', isBodyweight: true, load: '', set1: 8, set2: 7, set3: 6 })
    expect(suggestNextTarget(cur, [prev, cur], 80)!.kind).toBe('reps-only')
  })

  it('returns null with no history, for completed or time-based exercises', () => {
    expect(suggestNextTarget(current, [current])).toBeNull()
    expect(suggestNextTarget(w({ done: true }), [])).toBeNull()
    const plank = w({ week: 2, exercise: 'Plank', reps: '30s', done: false, lastSaved: undefined })
    expect(suggestNextTarget(plank, [w({ exercise: 'Plank', reps: '30s' }), plank])).toBeNull()
  })
})

describe('findPRHistory', () => {
  it('never flags the first entry, then flags load, rep and e1RM PRs', () => {
    const history = [
      w({ week: 1, load: '40kg', set1: 10, set2: 10, set3: 10 }),
      w({ week: 2, load: '42.5kg', set1: 8, set2: 8, set3: 8 }), // load PR
      w({ week: 3, load: '42.5kg', set1: 10, set2: 9, set3: 8 }), // rep PR at 42.5
      w({ week: 4, load: '41kg', set1: 12, set2: 11, set3: 10 }), // new load below best, but higher est. 1RM
      w({ week: 5, load: '40kg', set1: 6, set2: 6, set3: 6 }), // nothing
    ]
    const events = findPRHistory(history)
    expect(events.map(e => [e.week, e.type])).toEqual([[2, 'load'], [3, 'reps'], [4, 'e1rm']])
  })

  it('ignores undone workouts and handles bodyweight rep PRs', () => {
    const events = findPRHistory([
      w({ week: 1, exercise: 'Pull-up', isBodyweight: true, load: '', set1: 6, set2: 5, set3: 5 }),
      w({ week: 2, exercise: 'Pull-up', isBodyweight: true, load: '', set1: 8, set2: 6, set3: 5 }),
      w({ week: 3, exercise: 'Pull-up', isBodyweight: true, load: '', set1: 12, done: false }),
    ])
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ type: 'reps', week: 2 })
  })
})

describe('stagnation detection', () => {
  const flat = [1, 2, 3, 4].map(week => w({ week, load: '40kg', set1: 10, set2: 10, set3: 10 }))

  it('flags an exercise with 3 identical comparisons as stagnant (regression: was unreachable)', () => {
    expect(calculateExerciseProgression(flat, 'Bench Press', 80).progressionStatus).toBe('stagnant')
    expect(findStagnantExercises(flat, 80)[0]).toMatchObject({ exercise: 'Bench Press', sessions: 3 })
  })

  it('does not flag an exercise that is progressing', () => {
    const prog = [40, 42.5, 42.5, 45].map((l, i) => w({ week: i + 1, load: `${l}kg` }))
    expect(findStagnantExercises(prog, 80)).toHaveLength(0)
  })
})

describe('computeAlerts', () => {
  const vol = (week: number, chest: number) => ({
    week, totalSets: chest,
    muscles: [{ muscle: 'chest', sets: chest, isGoalMuscle: true, threshold: chest < 10 ? 'under' : chest > 25 ? 'very-high' : 'optimal' } as const],
  })
  const load = (week: number, sessionLoad: number) => ({ week, day: 1, sessionLoad, rpe: 7, duration: 60, label: `W${week}` })

  it('raises plateau, load-spike and low-volume alerts, warnings first', () => {
    const alerts = computeAlerts({
      workouts: [1, 2, 3, 4].map(week => w({ week })),
      weeklyVolume: [vol(3, 6), vol(4, 8)],
      sessionLoads: [load(1, 400), load(2, 410), load(3, 390), load(4, 600)],
      bodyweightKg: 80,
    })
    const ids = alerts.map(a => a.id)
    expect(ids).toEqual(expect.arrayContaining(['stagnant-Bench Press', 'load-spike', 'low-volume-chest']))
    expect(alerts[0].severity).toBe('warning')
    expect(alerts[alerts.length - 1].id.startsWith('low-volume')).toBe(true)
  })

  it('stays quiet when everything is fine', () => {
    const alerts = computeAlerts({
      workouts: [],
      weeklyVolume: [vol(3, 14), vol(4, 15)],
      sessionLoads: [load(1, 400), load(2, 410), load(3, 420), load(4, 430)],
    })
    expect(alerts.filter(a => a.id.startsWith('low-volume-chest') || a.id === 'load-spike')).toHaveLength(0)
  })
})
