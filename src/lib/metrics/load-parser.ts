import { Workout } from '@/types/workout'

export interface ParsedLoad {
  value: number
  isBWRelative: boolean
  parseSuccess: boolean
  pattern?: string
}

/**
 * Parse load from freeform text
 * Returns null if parse failed
 */
export function parseLoad(
  loadText: string | undefined,
  bodyweightKg: number | undefined,
  exercise: Workout
): ParsedLoad | null {
  // Special case: empty load for bodyweight exercises
  if (!loadText || loadText.trim() === '') {
    if (exercise.isBodyweight) {
      const bwComponent = getBodyweightComponent(bodyweightKg, exercise)
      if (bwComponent === null) return null

      return {
        value: bwComponent,
        isBWRelative: true,
        parseSuccess: true,
        pattern: 'BW-implicit',
      }
    }
    return null
  }

  const cleaned = loadText.trim().toLowerCase()

  // Pattern 1: Band entries - cannot quantify
  if (cleaned.includes('band')) {
    return {
      value: 0,
      isBWRelative: false,
      parseSuccess: false,
      pattern: 'band',
    }
  }

  // Pattern 2: "BW + Nkg" or "BW + N kg"
  const bwPlusMatch = cleaned.match(/bw\s*\+\s*(\d+(?:\.\d+)?)\s*kg/i)
  if (bwPlusMatch) {
    const addedLoad = parseFloat(bwPlusMatch[1])
    const bwComponent = getBodyweightComponent(bodyweightKg, exercise)
    if (bwComponent === null) return null

    return {
      value: bwComponent + addedLoad,
      isBWRelative: true,
      parseSuccess: true,
      pattern: 'BW+N',
    }
  }

  // Pattern 3: "BW" alone
  if (cleaned === 'bw' || cleaned === 'bodyweight') {
    const bwComponent = getBodyweightComponent(bodyweightKg, exercise)
    if (bwComponent === null) return null

    return {
      value: bwComponent,
      isBWRelative: true,
      parseSuccess: true,
      pattern: 'BW',
    }
  }

  // Pattern 4: "Nkg single DB" or "N kg single DB"
  const singleDbMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*kg\s*single\s*db/i)
  if (singleDbMatch) {
    return {
      value: parseFloat(singleDbMatch[1]),
      isBWRelative: false,
      parseSuccess: true,
      pattern: 'single-db',
    }
  }

  // Pattern 5: "Nkg per DB" or "N kg per DB"
  const perDbMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*kg\s*per\s*db/i)
  if (perDbMatch) {
    return {
      value: parseFloat(perDbMatch[1]),
      isBWRelative: false,
      parseSuccess: true,
      pattern: 'per-db',
    }
  }

  // Pattern 6: "Nkg" or "N kg" plain
  const plainMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*kg/i)
  if (plainMatch) {
    const addedLoad = parseFloat(plainMatch[1])

    // For bodyweight exercises, plain kg values are ADDED load
    if (exercise.isBodyweight) {
      const bwComponent = getBodyweightComponent(bodyweightKg, exercise)
      if (bwComponent === null) return null

      return {
        value: bwComponent + addedLoad,
        isBWRelative: true,
        parseSuccess: true,
        pattern: 'BW+plain',
      }
    }

    // For non-bodyweight exercises, it's absolute load
    return {
      value: addedLoad,
      isBWRelative: false,
      parseSuccess: true,
      pattern: 'plain',
    }
  }

  // Pattern 7: Plain number without unit (assume kg)
  const plainNumberMatch = cleaned.match(/^(\d+(?:\.\d+)?)$/)
  if (plainNumberMatch) {
    const addedLoad = parseFloat(plainNumberMatch[1])

    // For bodyweight exercises, plain numbers are ADDED load
    if (exercise.isBodyweight) {
      const bwComponent = getBodyweightComponent(bodyweightKg, exercise)
      if (bwComponent === null) return null

      return {
        value: bwComponent + addedLoad,
        isBWRelative: true,
        parseSuccess: true,
        pattern: 'BW+plain-number',
      }
    }

    // For non-bodyweight exercises, it's absolute load
    return {
      value: addedLoad,
      isBWRelative: false,
      parseSuccess: true,
      pattern: 'plain-number',
    }
  }

  // Parse failed - couldn't match any pattern
  return {
    value: 0,
    isBWRelative: false,
    parseSuccess: false,
    pattern: 'unknown',
  }
}

/**
 * Get bodyweight component based on exercise type
 */
function getBodyweightComponent(
  bodyweightKg: number | undefined,
  exercise: Workout
): number | null {
  if (!bodyweightKg) return null

  // Check if it's a bodyweight exercise
  if (!exercise.isBodyweight) return bodyweightKg

  const exerciseName = exercise.exercise.toLowerCase()

  // Push pattern (pressing movements) - 67%
  if (
    exerciseName.includes('push') ||
    exerciseName.includes('press') && !exerciseName.includes('pull')
  ) {
    return bodyweightKg * 0.67
  }

  // Dip variants - 75%
  if (exerciseName.includes('dip')) {
    return bodyweightKg * 0.75
  }

  // Pull pattern (pull-ups, chin-ups, rows) - 100%
  if (
    exerciseName.includes('pull') ||
    exerciseName.includes('chin') ||
    exerciseName.includes('row')
  ) {
    return bodyweightKg * 1.0
  }

  // Default to 100% for other bodyweight exercises
  return bodyweightKg
}

/**
 * Check if exercise is likely a push movement
 */
export function isPushExercise(exerciseName: string): boolean {
  const name = exerciseName.toLowerCase()
  return (
    name.includes('push') ||
    (name.includes('press') && !name.includes('pull'))
  )
}

/**
 * Check if exercise is likely a pull movement
 */
export function isPullExercise(exerciseName: string): boolean {
  const name = exerciseName.toLowerCase()
  return (
    name.includes('pull') ||
    name.includes('chin') ||
    name.includes('row')
  )
}

/**
 * Check if exercise is a dip variant
 */
export function isDipExercise(exerciseName: string): boolean {
  return exerciseName.toLowerCase().includes('dip')
}
