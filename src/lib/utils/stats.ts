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

function sumWeekVolume(weekWorkouts: Workout[]): number {
  return weekWorkouts.reduce((sum, w) => {
    const actualReps = [w.set1, w.set2, w.set3, w.set4, w.set5]
      .filter((s): s is number => s !== undefined && s !== null)
      .reduce((a, b) => a + b, 0)
    return sum + actualReps
  }, 0)
}

export function calculateVolumeChange(workouts: Workout[]): number | null {
  // Calculate % volume change between the latest two weeks with saved data
  const savedWorkouts = workouts.filter(w => w.lastSaved)
  if (savedWorkouts.length === 0) return null

  const weeks = [...new Set(savedWorkouts.map(w => w.week))].sort((a, b) => b - a)
  if (weeks.length < 2) return null

  const currentVolume = sumWeekVolume(savedWorkouts.filter(w => w.week === weeks[0]))
  const prevVolume = sumWeekVolume(savedWorkouts.filter(w => w.week === weeks[1]))

  if (prevVolume === 0) return null
  return Math.round(((currentVolume - prevVolume) / prevVolume) * 100)
}

export function calculateDaysCompletedRate(workouts: Workout[]): number {
  // Calculate % of training days where all exercises are marked done
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

  const totalDays = dayKeys.size
  if (totalDays === 0) return 0
  const completedDays = Array.from(dayKeys.values()).filter(v => v).length
  return Math.round((completedDays / totalDays) * 100)
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
    if (!w.lastSaved) return
    const existing = weekMap.get(w.week) || { sets: 0, reps: 0, volume: 0 }
    const actualSets = [w.set1, w.set2, w.set3, w.set4, w.set5]
      .filter((s): s is number => s !== undefined && s !== null)
    const totalReps = actualSets.reduce((a, b) => a + b, 0)
    existing.sets += actualSets.length
    existing.reps += totalReps
    existing.volume += totalReps
    weekMap.set(w.week, existing)
  })

  return Array.from(weekMap.entries())
    .map(([week, data]) => ({ week, ...data }))
    .sort((a, b) => a.week - b.week)
}

export interface ExerciseProgressData {
  exercise: string
  weeks: { week: number; volume: number; peakRep: number }[]
}

export function groupByExercise(workouts: Workout[]): ExerciseProgressData[] {
  const exerciseMap = new Map<string, Map<number, { volume: number; peakRep: number }>>()

  workouts.forEach(w => {
    if (!w.lastSaved) return
    const sets = [w.set1, w.set2, w.set3, w.set4, w.set5]
      .filter((s): s is number => s !== undefined && s !== null)
    if (sets.length === 0) return

    const volume = sets.reduce((a, b) => a + b, 0)
    const peakRep = Math.max(...sets)

    if (!exerciseMap.has(w.exercise)) {
      exerciseMap.set(w.exercise, new Map())
    }
    const weekMap = exerciseMap.get(w.exercise)!
    const existing = weekMap.get(w.week)
    if (existing) {
      existing.volume += volume
      existing.peakRep = Math.max(existing.peakRep, peakRep)
    } else {
      weekMap.set(w.week, { volume, peakRep })
    }
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

export interface VolumeByTypeWeek {
  week: number
  [type: string]: number // dynamic keys for each workout type
}

export function groupVolumeByType(workouts: Workout[]): { data: VolumeByTypeWeek[]; types: string[] } {
  const savedWorkouts = workouts.filter(w => w.lastSaved)
  const typeSet = new Set<string>()
  const weekMap = new Map<number, Map<string, number>>()

  savedWorkouts.forEach(w => {
    const vol = [w.set1, w.set2, w.set3, w.set4, w.set5]
      .filter((s): s is number => s !== undefined && s !== null)
      .reduce((a, b) => a + b, 0)
    if (vol === 0) return

    typeSet.add(w.type)
    if (!weekMap.has(w.week)) weekMap.set(w.week, new Map())
    const typeMap = weekMap.get(w.week)!
    typeMap.set(w.type, (typeMap.get(w.type) || 0) + vol)
  })

  const types = Array.from(typeSet).sort()
  const data = Array.from(weekMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([week, typeMap]) => {
      const row: VolumeByTypeWeek = { week }
      types.forEach(t => { row[t] = typeMap.get(t) || 0 })
      return row
    })

  return { data, types }
}

export function calculateCompletionRate(workouts: Workout[]): number {
  if (workouts.length === 0) return 0
  const completed = workouts.filter(w => w.done).length
  return Math.round((completed / workouts.length) * 100)
}
