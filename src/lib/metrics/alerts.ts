import { Workout } from '@/types/workout'
import { calculateExerciseProgression } from './progression'
import { WeeklyVolume, PRIORITY_MUSCLES } from './weekly-volume'
import { SessionLoadData } from './session-load'
import { normalizeMuscle } from '@/lib/utils/muscles'

export interface TrainingAlert {
  id: string
  severity: 'warning' | 'info'
  title: string
  detail: string
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Exercises (by name) currently stagnant: no progress over the last 3 comparisons */
export function findStagnantExercises(
  workouts: Workout[],
  bodyweightKg?: number
): Array<{ exercise: string; sessions: number; muscle: string }> {
  const trained = workouts.filter(
    w => (w.section === 'Strength' || w.section === 'Accessory' || w.section === 'Core') && w.done
  )
  const names = [...new Set(trained.map(w => w.exercise))]
  const out: Array<{ exercise: string; sessions: number; muscle: string }> = []

  for (const exercise of names) {
    if (trained.filter(w => w.exercise === exercise).length < 4) continue
    const p = calculateExerciseProgression(trained, exercise, bodyweightKg)
    if (p.progressionStatus === 'stagnant') {
      const muscle = trained.find(w => w.exercise === exercise)?.muscleGroup
      out.push({ exercise, sessions: p.stagnantSessions, muscle: muscle ? normalizeMuscle(muscle) : '' })
    }
  }
  return out.sort((a, b) => b.sessions - a.sessions || a.exercise.localeCompare(b.exercise))
}

export function computeAlerts(input: {
  workouts: Workout[]
  weeklyVolume: WeeklyVolume[]
  sessionLoads: SessionLoadData[]
  bodyweightKg?: number
}): TrainingAlert[] {
  const { workouts, weeklyVolume, sessionLoads, bodyweightKg } = input
  const alerts: TrainingAlert[] = []

  // 1. Plateaus
  findStagnantExercises(workouts, bodyweightKg)
    .slice(0, 4)
    .forEach(s =>
      alerts.push({
        id: `stagnant-${s.exercise}`,
        severity: 'warning',
        title: `${s.exercise} has stalled`,
        detail: `No load or rep progress in ${s.sessions} sessions${s.muscle ? ` (${s.muscle})` : ''}. Try a deload, a new rep range or a variation.`,
      })
    )

  // 2. Training load spike: latest week vs the 3 weeks before it
  if (sessionLoads.length >= 3) {
    const latest = sessionLoads[sessionLoads.length - 1]
    const prior = sessionLoads.slice(-4, -1)
    const avg = prior.reduce((sum, d) => sum + d.sessionLoad, 0) / prior.length
    if (avg > 0) {
      const pct = ((latest.sessionLoad - avg) / avg) * 100
      if (pct >= 25) {
        alerts.push({
          id: 'load-spike',
          severity: 'warning',
          title: `Training load up ${Math.round(pct)}%`,
          detail: `Week ${latest.week} is well above your ${prior.length}-week average. Watch recovery and sleep.`,
        })
      }
    }
  }

  // 3. Priority muscles: low for 2 weeks, or very high this week
  const withData = weeklyVolume.filter(w => w.muscles.length > 0)
  if (withData.length >= 2) {
    const [prev, last] = withData.slice(-2)
    const setsFor = (wk: WeeklyVolume, muscle: string) => wk.muscles.find(m => m.muscle === muscle)?.sets ?? 0

    PRIORITY_MUSCLES.forEach(muscle => {
      if (setsFor(prev, muscle) < 10 && setsFor(last, muscle) < 10) {
        alerts.push({
          id: `low-volume-${muscle}`,
          severity: 'info',
          title: `${cap(muscle)} volume is low`,
          detail: `Under 10 sets in weeks ${prev.week} and ${last.week} (${setsFor(prev, muscle)} and ${setsFor(last, muscle)}).`,
        })
      }
      if (last.muscles.find(m => m.muscle === muscle)?.threshold === 'very-high') {
        alerts.push({
          id: `very-high-${muscle}`,
          severity: 'warning',
          title: `${cap(muscle)} volume is very high`,
          detail: `${setsFor(last, muscle)} sets in week ${last.week}. Over 25 sets risks overreaching.`,
        })
      }
    })
  }

  return alerts.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'warning' ? -1 : 1))
}
