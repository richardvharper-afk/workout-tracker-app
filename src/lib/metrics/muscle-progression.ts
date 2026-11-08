import { Workout } from '@/types/workout'
import { normalizeMuscle } from '@/lib/utils/muscles'
import { calculateExerciseProgression, ExerciseProgression } from './progression'
import { parseLoad } from './load-parser'

export type LoadMetric = 'load' | 'e1rm'

export interface ExerciseWeekPoint {
  week: number
  load: number // best top-set load that week (kg)
  e1rm: number // best estimated 1RM that week (kg, Epley)
}

export interface MuscleExerciseProgress {
  exercise: string
  points: ExerciseWeekPoint[]
  status: ExerciseProgression['progressionStatus']
  /** % change in the chosen metric, first tracked week -> latest */
  changeSinceStart: number | null
  /** % change vs the last point at least 4 weeks before the latest */
  change4wk: number | null
}

export interface MuscleLoadProgression {
  muscle: string
  exercises: MuscleExerciseProgress[]
  /** Exercises we could not quantify (bands, unparseable, no reps) */
  untracked: string[]
  /** Mean of per-exercise % change since start */
  avgChangeSinceStart: number | null
  avgChange4wk: number | null
}

/** Epley estimated 1RM */
export function estimate1RM(load: number, reps: number): number {
  if (reps <= 1) return load
  return load * (1 + reps / 30)
}

function topReps(w: Workout): number | null {
  const sets = [w.set1, w.set2, w.set3, w.set4, w.set5].filter(
    (s): s is number => s !== undefined && s !== null
  )
  return sets.length ? Math.max(...sets) : null
}

function pctChange(from: number, to: number): number | null {
  if (!from || from <= 0) return null
  return ((to - from) / from) * 100
}

const mean = (xs: number[]): number | null =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null

/**
 * Per-muscle load progression across the exercises that train that muscle.
 * Only done Strength/Core workouts are considered.
 */
export function calculateMuscleLoadProgression(
  workouts: Workout[],
  muscle: string,
  bodyweightKg: number | undefined,
  metric: LoadMetric = 'load'
): MuscleLoadProgression {
  const muscleWorkouts = workouts.filter(
    w =>
      (w.section === 'Strength' || w.section === 'Core') &&
      w.muscleGroup &&
      normalizeMuscle(w.muscleGroup) === muscle
  )

  const names = [...new Set(muscleWorkouts.map(w => w.exercise))]
  const exercises: MuscleExerciseProgress[] = []
  const untracked: string[] = []

  for (const name of names) {
    const done = muscleWorkouts.filter(w => w.exercise === name && w.done)
    const byWeek = new Map<number, ExerciseWeekPoint>()

    for (const w of done) {
      const parsed = parseLoad(w.load, bodyweightKg, w)
      if (!parsed?.parseSuccess || parsed.value <= 0) continue
      const reps = topReps(w)
      const e1rm = reps !== null ? estimate1RM(parsed.value, reps) : parsed.value
      const prev = byWeek.get(w.week)
      if (!prev) {
        byWeek.set(w.week, { week: w.week, load: parsed.value, e1rm })
      } else {
        prev.load = Math.max(prev.load, parsed.value)
        prev.e1rm = Math.max(prev.e1rm, e1rm)
      }
    }

    const points = [...byWeek.values()].sort((a, b) => a.week - b.week)
    if (points.length === 0) {
      if (done.length > 0) untracked.push(name)
      continue
    }

    const val = (p: ExerciseWeekPoint) => (metric === 'e1rm' ? p.e1rm : p.load)
    const first = points[0]
    const last = points[points.length - 1]
    const ref = [...points].reverse().find(p => p.week <= last.week - 4)

    exercises.push({
      exercise: name,
      points,
      status: calculateExerciseProgression(muscleWorkouts, name, bodyweightKg).progressionStatus,
      changeSinceStart: points.length >= 2 ? pctChange(val(first), val(last)) : null,
      change4wk: ref ? pctChange(val(ref), val(last)) : null,
    })
  }

  exercises.sort((a, b) => b.points.length - a.points.length)

  return {
    muscle,
    exercises,
    untracked,
    avgChangeSinceStart: mean(
      exercises.map(e => e.changeSinceStart).filter((v): v is number => v !== null)
    ),
    avgChange4wk: mean(
      exercises.map(e => e.change4wk).filter((v): v is number => v !== null)
    ),
  }
}

/** Chart rows: one row per week, one key per exercise */
export function toChartRows(
  progression: MuscleLoadProgression,
  metric: LoadMetric
): Array<Record<string, number>> {
  const weeks = new Set<number>()
  progression.exercises.forEach(e => e.points.forEach(p => weeks.add(p.week)))
  return [...weeks]
    .sort((a, b) => a - b)
    .map(week => {
      const row: Record<string, number> = { week }
      progression.exercises.forEach(e => {
        const p = e.points.find(pt => pt.week === week)
        if (p) row[e.exercise] = Math.round((metric === 'e1rm' ? p.e1rm : p.load) * 10) / 10
      })
      return row
    })
}
