import { Workout } from '@/types/workout'
import { Session } from '@/types/session'

/**
 * Parse day number from Workout.day field
 * Handles both "Day 1" text format and numeric format
 */
export function parseDayNumber(day: string | number): number {
  if (typeof day === 'number') return day
  // Extract numeric part from "Day 1", "Day 2", etc.
  const match = String(day).match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

/**
 * Create a week-day key for joining
 */
function makeKey(week: number, day: number): string {
  return `${week}-${day}`
}

/**
 * Join workouts to sessions on (Week, Day)
 * Returns array of { workout, session } where session may be null if not found
 */
export interface WorkoutWithSession {
  workout: Workout
  session: Session | null
}

export function joinWorkoutsToSessions(
  workouts: Workout[],
  sessions: Session[]
): WorkoutWithSession[] {
  // Create session lookup map using Week + Day
  const sessionMap = new Map<string, Session>()
  sessions.forEach(session => {
    const key = makeKey(session.week, session.day)
    sessionMap.set(key, session)
  })

  // Join workouts to sessions
  return workouts.map(workout => {
    const dayNum = parseDayNumber(workout.day)
    const key = makeKey(workout.week, dayNum)
    const session = sessionMap.get(key) || null
    return { workout, session }
  })
}

/**
 * Group workouts by (Week, Day) session
 * Returns map of "week-day" -> array of workouts
 */
export function groupWorkoutsBySession(workouts: Workout[]): Map<string, Workout[]> {
  const grouped = new Map<string, Workout[]>()

  workouts.forEach(workout => {
    const dayNum = parseDayNumber(workout.day)
    const key = makeKey(workout.week, dayNum)

    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(workout)
  })

  return grouped
}

/**
 * Get unique (Week, Day) combinations from workouts
 */
export function getUniqueSessionKeys(workouts: Workout[]): Array<{ week: number; day: number }> {
  const keys = new Set<string>()
  const result: Array<{ week: number; day: number }> = []

  workouts.forEach(workout => {
    const dayNum = parseDayNumber(workout.day)
    const key = makeKey(workout.week, dayNum)

    if (!keys.has(key)) {
      keys.add(key)
      result.push({ week: workout.week, day: dayNum })
    }
  })

  return result.sort((a, b) => (a.week !== b.week ? a.week - b.week : a.day - b.day))
}
