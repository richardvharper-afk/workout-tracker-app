import { Workout } from '@/types/workout'

export function parseReps(reps: string): number {
  if (reps.includes('-')) {
    const [low, high] = reps.split('-').map(Number)
    return Math.round((low + high) / 2)
  }
  return parseInt(reps) || 0
}

export function calculateStreak(workouts: Workout[]): number {
  // Group workouts by week-day, check consecutive days with completed exercises
  const dayKeys = new Map<string, boolean>()

  workouts.forEach(w => {
    const key = `${w.week}-${w.day}`
    if (!dayKeys.has(key)) {
      dayKeys.set(key, true)
    }
    if (!w.done) {
      dayKeys.set(key, false)
    }
  })

  // Sort by week then day descending
  const sorted = Array.from(dayKeys.entries())
    .map(([key, allDone]) => {
      const [week, day] = key.split('-').map(Number)
      return { week, day, allDone }
    })
    .sort((a, b) => b.week !== a.week ? b.week - a.week : b.day - a.day)

  let streak = 0
  for (const entry of sorted) {
    if (entry.allDone) {
      streak++
    } else {
      break
    }
  }

  return streak
}

export function calculateWeeklyVolume(workouts: Workout[]): number {
  // Get the max week and calculate volume for it
  const maxWeek = Math.max(...workouts.map(w => w.week), 0)
  const currentWeekWorkouts = workouts.filter(w => w.week === maxWeek && w.done)

  return currentWeekWorkouts.reduce((sum, w) => {
    return sum + w.sets * parseReps(w.reps)
  }, 0)
}

export interface WeeklyVolumeData {
  week: number
  sets: number
  reps: number
  volume: number
}

export function groupVolumeByWeek(workouts: Workout[]): WeeklyVolumeData[] {
  const weekMap = new Map<number, { sets: number; reps: number; volume: number }>()

  workouts.forEach(w => {
    if (!w.done) return
    const existing = weekMap.get(w.week) || { sets: 0, reps: 0, volume: 0 }
    const repCount = parseReps(w.reps)
    existing.sets += w.sets
    existing.reps += repCount * w.sets
    existing.volume += w.sets * repCount
    weekMap.set(w.week, existing)
  })

  return Array.from(weekMap.entries())
    .map(([week, data]) => ({ week, ...data }))
    .sort((a, b) => a.week - b.week)
}

export interface ExerciseProgressData {
  exercise: string
  weeks: { week: number; load: string; reps: number }[]
}

export function groupByExercise(workouts: Workout[]): ExerciseProgressData[] {
  const exerciseMap = new Map<string, Map<number, { load: string; reps: number }>>()

  workouts.forEach(w => {
    if (!w.done) return
    if (!exerciseMap.has(w.exercise)) {
      exerciseMap.set(w.exercise, new Map())
    }
    const weekMap = exerciseMap.get(w.exercise)!
    weekMap.set(w.week, {
      load: w.load || '',
      reps: parseReps(w.reps),
    })
  })

  return Array.from(exerciseMap.entries())
    .map(([exercise, weekMap]) => ({
      exercise,
      weeks: Array.from(weekMap.entries())
        .map(([week, data]) => ({ week, ...data }))
        .sort((a, b) => a.week - b.week),
    }))
    .filter(e => e.weeks.length > 0)
    .sort((a, b) => a.exercise.localeCompare(b.exercise))
}

export function calculateCompletionRate(workouts: Workout[]): number {
  if (workouts.length === 0) return 0
  const completed = workouts.filter(w => w.done).length
  return Math.round((completed / workouts.length) * 100)
}
