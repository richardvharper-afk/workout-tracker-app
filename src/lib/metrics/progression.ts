import { Workout } from '@/types/workout'
import { parseLoad, ParsedLoad } from './load-parser'
import { parseDayNumber } from './join-helper'

export interface ExerciseSession {
  week: number
  day: number
  topSetReps: number | null
  parsedLoad: ParsedLoad | null
  actualRIR: number | null
  date?: string
  label: string // "W1.D1"
}

export interface ExerciseProgression {
  exercise: string
  sessions: ExerciseSession[]
  isAnchorLift: boolean
  weekCount: number
  progressionStatus: 'progressing' | 'stagnant' | 'regressing' | 'insufficient-data'
  stagnantSessions: number
}

/**
 * Calculate top set reps from Set1-5
 */
function getTopSetReps(workout: Workout): number | null {
  const sets = [workout.set1, workout.set2, workout.set3, workout.set4, workout.set5]
    .filter((s): s is number => s !== undefined && s !== null)

  if (sets.length === 0) return null
  return Math.max(...sets)
}

/**
 * Get actual RIR, applying convention for Week >= 3
 */
function getActualRIR(workout: Workout): number | null {
  if (workout.avgRir !== undefined && workout.avgRir !== null) {
    return workout.avgRir
  }

  // Convention: if Done=TRUE and Week >= 3 and avgRir is blank, assume RIR 0
  if (workout.done && workout.week >= 3) {
    return 0
  }

  return null
}

/**
 * Calculate progression for a single exercise
 */
export function calculateExerciseProgression(
  workouts: Workout[],
  exercise: string,
  bodyweightKg: number | undefined
): ExerciseProgression {
  // Filter to this exercise only, and only Done workouts
  const exerciseWorkouts = workouts
    .filter(w => w.exercise === exercise && w.done)
    .sort((a, b) => {
      if (a.week !== b.week) return a.week - b.week
      const dayA = parseDayNumber(a.day)
      const dayB = parseDayNumber(b.day)
      return dayA - dayB
    })

  // Build session data
  const sessions: ExerciseSession[] = exerciseWorkouts.map(workout => {
    const dayNum = parseDayNumber(workout.day)

    return {
      week: workout.week,
      day: dayNum,
      topSetReps: getTopSetReps(workout),
      parsedLoad: parseLoad(workout.load, bodyweightKg, workout),
      actualRIR: getActualRIR(workout),
      date: workout.lastSaved,
      label: `W${workout.week}.D${dayNum}`,
    }
  })

  // Count unique weeks
  const weekCount = new Set(exerciseWorkouts.map(w => w.week)).size

  // Determine if anchor lift (8+ weeks)
  const isAnchorLift = weekCount >= 8

  // Analyze progression status
  const { status, stagnantCount } = analyzeProgressionStatus(sessions)

  return {
    exercise,
    sessions,
    isAnchorLift,
    weekCount,
    progressionStatus: status,
    stagnantSessions: stagnantCount,
  }
}

/**
 * Analyze if exercise is progressing, stagnant, or regressing
 */
function analyzeProgressionStatus(sessions: ExerciseSession[]): {
  status: 'progressing' | 'stagnant' | 'regressing' | 'insufficient-data'
  stagnantCount: number
} {
  if (sessions.length < 3) {
    return { status: 'insufficient-data', stagnantCount: 0 }
  }

  // Look at last 3 sessions
  const recent = sessions.slice(-3)

  let stagnantCount = 0
  let hasProgression = false
  let hasRegression = false

  for (let i = 1; i < recent.length; i++) {
    const prev = recent[i - 1]
    const curr = recent[i]

    // Skip if missing data
    if (!prev.parsedLoad?.parseSuccess || !curr.parsedLoad?.parseSuccess) continue
    if (prev.topSetReps === null || curr.topSetReps === null) continue

    const loadProgressed = curr.parsedLoad.value > prev.parsedLoad.value
    const repsProgressed = curr.topSetReps > prev.topSetReps
    const loadSame = Math.abs(curr.parsedLoad.value - prev.parsedLoad.value) < 0.1
    const repsSame = curr.topSetReps === prev.topSetReps
    const rirSameOrBetter = (curr.actualRIR ?? 0) <= (prev.actualRIR ?? 0)

    // Progression = more load OR more reps at same/better RIR
    if (rirSameOrBetter && (loadProgressed || (loadSame && repsProgressed))) {
      hasProgression = true
    } else if (loadSame && repsSame) {
      stagnantCount++
    } else {
      hasRegression = true
    }
  }

  if (hasProgression) return { status: 'progressing', stagnantCount: 0 }
  if (stagnantCount >= 3) return { status: 'stagnant', stagnantCount }
  if (hasRegression) return { status: 'regressing', stagnantCount }

  return { status: 'insufficient-data', stagnantCount }
}

/**
 * Get all anchor lifts from workouts
 */
export function getAnchorLifts(
  workouts: Workout[],
  bodyweightKg: number | undefined
): ExerciseProgression[] {
  // Filter to Strength and Core exercises only
  const strengthCoreWorkouts = workouts.filter(
    w => w.section === 'Strength' || w.section === 'Core'
  )

  // Get unique exercises
  const exerciseNames = [...new Set(strengthCoreWorkouts.map(w => w.exercise))]

  // Calculate progression for each
  const progressions = exerciseNames.map(exercise =>
    calculateExerciseProgression(strengthCoreWorkouts, exercise, bodyweightKg)
  )

  // Filter to anchor lifts only (8+ weeks)
  return progressions
    .filter(p => p.isAnchorLift)
    .sort((a, b) => b.weekCount - a.weekCount) // Sort by frequency
}
