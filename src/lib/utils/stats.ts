import { Workout } from '@/types/workout'
import { normalizeMuscle } from '@/lib/utils/muscles'

export function parseReps(reps: string): number {
  if (reps.includes('-')) {
    const [low, high] = reps.split('-').map(Number)
    return Math.round((low + high) / 2)
  }
  return parseInt(reps) || 0
}

export function parseMaxReps(reps: string): number {
  // Extract highest number from reps string: "5-7" -> 7, "3min total" -> 3, "10" -> 10
  const numbers = reps.match(/\d+/g)
  if (!numbers) return 0
  return Math.max(...numbers.map(Number))
}

/**
 * Parse load string to extract numeric weight value.
 * Handles various formats: "135", "135 lbs", "20kg", "BW+10", etc.
 * Returns null if no valid number found.
 */
export function parseLoad(loadString: string | undefined): number | null {
  if (!loadString || loadString.trim() === '') return null

  // Remove common units and clean the string
  const cleaned = loadString.toLowerCase()
    .replace(/\s*lbs?\s*/g, ' ')
    .replace(/\s*kgs?\s*/g, ' ')
    .replace(/\s*pounds?\s*/g, ' ')
    .replace(/bw\+?/g, '')
    .trim()

  // Extract all numbers (including decimals)
  const numberMatch = cleaned.match(/\d+\.?\d*/)
  if (!numberMatch) {
    // Log warning in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[parseLoad] Unable to parse load string: "${loadString}"`)
    }
    return null
  }

  const parsed = parseFloat(numberMatch[0])
  if (isNaN(parsed) || parsed < 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[parseLoad] Invalid number in load string: "${loadString}" -> ${parsed}`)
    }
    return null
  }

  return parsed
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

export function groupVolumeByWeek(workouts: Workout[], bodyweightKg?: number): WeeklyVolumeData[] {
  const weekMap = new Map<number, { sets: number; reps: number; volume: number }>()

  workouts.forEach(w => {
    if (!w.lastSaved) return
    const existing = weekMap.get(w.week) || { sets: 0, reps: 0, volume: 0 }
    const actualSets = [w.set1, w.set2, w.set3, w.set4, w.set5]
      .filter((s): s is number => s !== undefined && s !== null)
    const totalReps = actualSets.reduce((a, b) => a + b, 0)
    existing.sets += actualSets.length
    existing.reps += totalReps
    existing.volume += calculateWorkoutVolume(w, bodyweightKg)
    weekMap.set(w.week, existing)
  })

  return Array.from(weekMap.entries())
    .map(([week, data]) => ({ week, ...data }))
    .sort((a, b) => a.week - b.week)
}

export interface ExerciseProgressData {
  exercise: string
  weeks: { week: number; volume: number; peakRep: number; targetVolume: number }[]
}

export function groupByExercise(workouts: Workout[], bodyweightKg?: number): ExerciseProgressData[] {
  const exerciseMap = new Map<string, Map<number, { volume: number; peakRep: number; targetVolume: number }>>()

  workouts.forEach(w => {
    if (!w.lastSaved) return
    const sets = [w.set1, w.set2, w.set3, w.set4, w.set5]
      .filter((s): s is number => s !== undefined && s !== null)
    if (sets.length === 0) return

    const volume = calculateWorkoutVolume(w, bodyweightKg)
    const peakRep = Math.max(...sets)
    const targetReps = w.sets * parseMaxReps(w.reps || '')
    const loadNum = parseLoad(w.load)
    let targetVolume: number
    if (w.isBodyweight) {
      const bw = bodyweightKg ?? 0
      const added = loadNum ?? 0
      targetVolume = targetReps * (bw + added)
    } else if (loadNum !== null) {
      targetVolume = targetReps * loadNum
    } else {
      targetVolume = targetReps
    }

    if (!exerciseMap.has(w.exercise)) {
      exerciseMap.set(w.exercise, new Map())
    }
    const weekMap = exerciseMap.get(w.exercise)!
    const existing = weekMap.get(w.week)
    if (existing) {
      existing.volume += volume
      existing.peakRep = Math.max(existing.peakRep, peakRep)
      existing.targetVolume += targetVolume
    } else {
      weekMap.set(w.week, { volume, peakRep, targetVolume })
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

export function groupVolumeByType(workouts: Workout[], bodyweightKg?: number): { data: VolumeByTypeWeek[]; types: string[] } {
  const savedWorkouts = workouts.filter(w => w.lastSaved)
  const typeSet = new Set<string>()
  const weekMap = new Map<number, Map<string, number>>()

  savedWorkouts.forEach(w => {
    const vol = calculateWorkoutVolume(w, bodyweightKg)
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

export interface MuscleVolumeData {
  muscle: string
  volume: number
}

export function groupVolumeByMuscle(workouts: Workout[]): MuscleVolumeData[] {
  const volumes = new Map<string, number>()

  workouts.forEach(w => {
    if (!w.muscleGroup || !w.lastSaved) return
    const key = normalizeMuscle(w.muscleGroup)
    volumes.set(key, (volumes.get(key) || 0) + w.sets)
  })

  return Array.from(volumes.entries())
    .map(([muscle, volume]) => ({ muscle, volume }))
    .sort((a, b) => b.volume - a.volume)
}

export function getPersonalRecords(workouts: Workout[], bodyweightKg?: number): Map<string, { maxLoad: string; maxLoadNum: number; week: number; day: number }> {
  const records = new Map<string, { maxLoad: string; maxLoadNum: number; week: number; day: number }>()

  workouts.forEach(w => {
    if (!w.lastSaved) return

    let effectiveLoad: number
    let displayLoad: string

    if (w.isBodyweight) {
      const bw = bodyweightKg ?? 0
      const added = parseLoad(w.load) ?? 0
      effectiveLoad = bw + added
      displayLoad = added > 0 ? `BW+${added}` : 'BW'
      if (effectiveLoad === 0) return
    } else {
      const parsed = parseLoad(w.load)
      if (parsed === null || parsed === 0) return
      effectiveLoad = parsed
      displayLoad = w.load || `${parsed}`
    }

    const existing = records.get(w.exercise)
    if (!existing || effectiveLoad > existing.maxLoadNum) {
      records.set(w.exercise, { maxLoad: displayLoad, maxLoadNum: effectiveLoad, week: w.week, day: w.day })
    }
  })

  return records
}

export function calculateCompletionRate(workouts: Workout[]): number {
  if (workouts.length === 0) return 0
  const completed = workouts.filter(w => w.done).length
  return Math.round((completed / workouts.length) * 100)
}

export function calculateWorkoutVolume(w: Workout, bodyweightKg?: number): number {
  const totalReps = [w.set1, w.set2, w.set3, w.set4, w.set5]
    .filter((s): s is number => s != null)
    .reduce((a, b) => a + b, 0)
  if (totalReps === 0) return 0

  const loadNum = parseLoad(w.load)

  if (w.isBodyweight) {
    const bw = bodyweightKg ?? 0
    const added = loadNum ?? 0
    return totalReps * (bw + added)
  }

  if (loadNum !== null) {
    return totalReps * loadNum
  }

  return totalReps // fallback
}
