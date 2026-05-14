import { Workout } from '@/types/workout'
import { Session } from '@/types/session'
import { parseDayNumber, getUniqueSessionKeys } from './join-helper'

export interface MissingSessionData {
  week: number
  day: number
  completedExercises: number
  hasAnyTimestamp: boolean
  earliestTimestamp?: string
  latestTimestamp?: string
}

/**
 * Find sessions where workouts are Done=TRUE but no Sessions row exists
 */
export function findMissingSessions(
  workouts: Workout[],
  sessions: Session[]
): MissingSessionData[] {
  // Get all completed workout sessions (at least one exercise Done=TRUE)
  const completedSessions = new Map<string, Workout[]>()

  workouts
    .filter(w => w.done)
    .forEach(workout => {
      const dayNum = parseDayNumber(workout.day)
      const key = `${workout.week}-${dayNum}`

      if (!completedSessions.has(key)) {
        completedSessions.set(key, [])
      }
      completedSessions.get(key)!.push(workout)
    })

  // Build session lookup
  const sessionSet = new Set<string>()
  sessions.forEach(session => {
    sessionSet.add(`${session.week}-${session.day}`)
  })

  // Find missing sessions
  const missing: MissingSessionData[] = []

  completedSessions.forEach((exercises, key) => {
    if (!sessionSet.has(key)) {
      const [week, day] = key.split('-').map(Number)

      // Get timestamps
      const timestamps = exercises
        .map(e => e.lastSaved)
        .filter((ts): ts is string => !!ts)
        .sort()

      missing.push({
        week,
        day,
        completedExercises: exercises.length,
        hasAnyTimestamp: timestamps.length > 0,
        earliestTimestamp: timestamps[0],
        latestTimestamp: timestamps[timestamps.length - 1],
      })
    }
  })

  return missing.sort((a, b) => (a.week !== b.week ? a.week - b.week : a.day - b.day))
}

/**
 * Check if a specific session has incomplete data
 */
export function isSessionIncomplete(session: Session | null | undefined): boolean {
  if (!session) return true
  // Session is incomplete if missing RPE or duration
  return session.rpe === undefined || session.duration === undefined
}

/**
 * Get summary of data quality issues
 */
export function getDataQualitySummary(workouts: Workout[], sessions: Session[]) {
  const missingSessions = findMissingSessions(workouts, sessions)
  const incompleteSessions = sessions.filter(isSessionIncomplete)

  return {
    missingSessions,
    incompleteSessions,
    hasIssues: missingSessions.length > 0 || incompleteSessions.length > 0,
    totalIssues: missingSessions.length + incompleteSessions.length,
  }
}
