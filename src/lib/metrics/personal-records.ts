import { Workout } from '@/types/workout'
import { normalizeMuscle } from '@/lib/utils/muscles'
import { parseLoad } from './load-parser'
import { estimate1RM } from './muscle-progression'

export type PRType = 'load' | 'reps' | 'e1rm'

export interface PREvent {
  workoutId: string
  exercise: string
  muscle: string // normalised, '' when unknown
  type: PRType
  label: string // "Load PR" | "Rep PR" | "Est. 1RM PR"
  value: string
  previous: string
  week: number
  day: number
  date?: string // lastSaved
}

const PR_SECTIONS = new Set(['Strength', 'Accessory', 'Core'])
const fmt = (n: number) => String(Math.round(n * 10) / 10)

interface ExerciseBest {
  bestLoad: number
  bestE1rm: number
  repsAtLoad: Map<string, number>
}

/**
 * Walk the training history in order and emit an event every time a best is beaten.
 * The first logged entry of an exercise sets the baseline and is never a PR.
 * At most one event per entry: Load PR > Rep PR (same load) > Est. 1RM PR.
 * Bodyweight exercises only produce Rep PRs (their load depends on bodyweight).
 */
export function findPRHistory(workouts: Workout[], bodyweightKg?: number): PREvent[] {
  const entries = workouts
    .filter(w => w.done && w.lastSaved && PR_SECTIONS.has(w.section))
    .sort((a, b) =>
      a.week !== b.week ? a.week - b.week : a.day !== b.day ? a.day - b.day : (parseInt(a.id) || 0) - (parseInt(b.id) || 0)
    )

  const bests = new Map<string, ExerciseBest>()
  const events: PREvent[] = []

  for (const w of entries) {
    const sets = [w.set1, w.set2, w.set3, w.set4, w.set5].filter(
      (s): s is number => s !== undefined && s !== null
    )
    const topReps = sets.length ? Math.max(...sets) : null
    const parsed = parseLoad(w.load, bodyweightKg, w)
    const isBW = !!w.isBodyweight

    // Rep-PR key: normalised load (or the raw load text for bodyweight work)
    let key: string
    let loadKg = 0
    if (isBW) {
      key = (w.load || 'BW').trim().toLowerCase()
    } else {
      if (!parsed?.parseSuccess || parsed.value <= 0) continue
      loadKg = parsed.value
      key = fmt(loadKg)
    }
    if (isBW && topReps === null) continue

    const base = {
      workoutId: w.id,
      exercise: w.exercise,
      muscle: w.muscleGroup ? normalizeMuscle(w.muscleGroup) : '',
      week: w.week,
      day: w.day,
      date: w.lastSaved,
    }

    const e1rm = !isBW && topReps !== null ? estimate1RM(loadKg, topReps) : loadKg
    const prior = bests.get(w.exercise)

    if (!prior) {
      const repsAtLoad = new Map<string, number>()
      if (topReps !== null) repsAtLoad.set(key, topReps)
      bests.set(w.exercise, { bestLoad: loadKg, bestE1rm: e1rm, repsAtLoad })
      continue
    }

    let event: PREvent | null = null
    const prevRepsAtLoad = prior.repsAtLoad.get(key)

    if (!isBW && loadKg > prior.bestLoad + 0.001) {
      event = {
        ...base, type: 'load', label: 'Load PR',
        value: `${fmt(loadKg)} kg`, previous: `${fmt(prior.bestLoad)} kg`,
      }
    } else if (topReps !== null && prevRepsAtLoad !== undefined && topReps > prevRepsAtLoad) {
      event = {
        ...base, type: 'reps', label: 'Rep PR',
        value: isBW ? `${topReps} reps` : `${topReps} reps @ ${fmt(loadKg)} kg`,
        previous: `${prevRepsAtLoad} reps`,
      }
    } else if (!isBW && topReps !== null && e1rm > prior.bestE1rm + 0.05) {
      event = {
        ...base, type: 'e1rm', label: 'Est. 1RM PR',
        value: `${fmt(e1rm)} kg`, previous: `${fmt(prior.bestE1rm)} kg`,
      }
    }

    if (event) events.push(event)

    prior.bestLoad = Math.max(prior.bestLoad, loadKg)
    prior.bestE1rm = Math.max(prior.bestE1rm, e1rm)
    if (topReps !== null) prior.repsAtLoad.set(key, Math.max(prevRepsAtLoad ?? 0, topReps))
  }

  return events
}

/** Most recent first */
export function recentPRs(events: PREvent[], limit = 8): PREvent[] {
  return [...events]
    .sort((a, b) => (b.week !== a.week ? b.week - a.week : b.day - a.day))
    .slice(0, limit)
}
