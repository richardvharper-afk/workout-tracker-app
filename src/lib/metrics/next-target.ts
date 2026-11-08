import { Workout } from '@/types/workout'
import { parseLoad } from './load-parser'

export interface NextTarget {
  kind: 'increase-load' | 'add-rep' | 'hold' | 'reps-only'
  headline: string
  detail: string
}

const DEFAULT_STEP_KG = 2.5

/** "8-12" / "8–12" -> {8,12}; "10" -> {10,10}; time-based or free text -> null */
export function parseRepRange(reps: string): { min: number; max: number } | null {
  const text = (reps || '').trim()
  if (!text || /[a-z]/i.test(text)) return null
  const range = text.match(/^(\d+)\s*[-–]\s*(\d+)$/)
  if (range) return { min: +range[1], max: +range[2] }
  const single = text.match(/^(\d+)$/)
  return single ? { min: +single[1], max: +single[1] } : null
}

/** Load step from the plan's escalation text ("+2.5kg"), defaulting to 2.5kg */
export function parseEscalationStep(escalation: string | undefined): number {
  const m = (escalation || '').match(/\+\s*(\d+(?:[.,]\d+)?)\s*kg/i)
  if (!m) return DEFAULT_STEP_KG
  const n = parseFloat(m[1].replace(',', '.'))
  return n > 0 ? n : DEFAULT_STEP_KG
}

const fmt = (n: number) => String(Math.round(n * 10) / 10)

function actualSets(w: Workout): number[] {
  return [w.set1, w.set2, w.set3, w.set4, w.set5].filter(
    (s): s is number => s !== undefined && s !== null
  )
}

/** Most recent saved, completed instance of this exercise before `current` */
export function findPreviousInstance(current: Workout, all: Workout[]): Workout | null {
  const prior = all
    .filter(
      w =>
        w.exercise === current.exercise &&
        w.done &&
        w.lastSaved &&
        (w.week < current.week || (w.week === current.week && w.day < current.day))
    )
    .sort((a, b) => (b.week !== a.week ? b.week - a.week : b.day - a.day))
  return prior[0] ?? null
}

/**
 * Double-progression suggestion for the next time an exercise is performed.
 *  - Every set at the top of the rep range -> add the plan's load step.
 *  - Inside the range -> same load, one more rep on the weakest set.
 *  - Below the range -> hold the load and build back up.
 * Returns null when there is nothing sensible to suggest.
 */
export function suggestNextTarget(
  current: Workout,
  all: Workout[],
  bodyweightKg?: number
): NextTarget | null {
  if (current.done) return null

  const range = parseRepRange(current.reps)
  if (!range) return null

  const prev = findPreviousInstance(current, all)
  if (!prev) return null

  const sets = actualSets(prev)
  if (sets.length === 0) return null

  const label = `W${prev.week}·D${prev.day}`
  const setsText = sets.join('/')
  const weakest = Math.min(...sets)
  const allAtTop = weakest >= range.max && sets.length >= Math.min(prev.sets || sets.length, 5)

  const parsed = parseLoad(prev.load, bodyweightKg, prev)
  const hasWeight = !prev.isBodyweight && parsed?.parseSuccess && parsed.value > 0

  // Bodyweight / band / unparseable load: reps only
  if (!hasWeight) {
    if (allAtTop) {
      return {
        kind: 'reps-only',
        headline: 'Top of range: make it harder',
        detail: `Hit ${setsText} last time (${label}). Add load, tempo or a harder variation.`,
      }
    }
    const target = Math.min(range.max, weakest + 1)
    return {
      kind: 'reps-only',
      headline: `Aim for ${target} reps every set`,
      detail: `Last: ${setsText} (${label})`,
    }
  }

  const loadKg = parsed!.value

  if (allAtTop) {
    const step = parseEscalationStep(current.escalation)
    return {
      kind: 'increase-load',
      headline: `↑ ${fmt(loadKg + step)} kg · aim for ${range.min}+ reps`,
      detail: `Hit ${setsText} @ ${fmt(loadKg)} kg (${label}). Top of range, so add ${fmt(step)} kg.`,
    }
  }

  if (weakest >= range.min) {
    const target = Math.min(range.max, weakest + 1)
    return {
      kind: 'add-rep',
      headline: `${fmt(loadKg)} kg · aim for ${target} reps every set`,
      detail: `Last: ${setsText} @ ${fmt(loadKg)} kg (${label})`,
    }
  }

  return {
    kind: 'hold',
    headline: `Hold ${fmt(loadKg)} kg · build to ${range.min}+ reps`,
    detail: `Last: ${setsText} @ ${fmt(loadKg)} kg (${label}). Below ${range.min} reps on at least one set.`,
  }
}
