import { Workout, WorkoutType, WorkoutSection } from '@/types/workout'
import { SHEET_COLUMNS } from '@/types/sheets'

/**
 * Convert a sheet row to a Workout object
 */
export function mapRowToWorkout(row: any[], rowIndex: number): Workout {
  // Helper to safely parse numbers, handling formats like "Day 1", "Week 3"
  const parseNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0
    if (typeof value === 'number') return value
    const str = String(value)
    // Try direct parse first
    const direct = parseFloat(str)
    if (!isNaN(direct)) return direct
    // Extract number from strings like "Day 1", "Week 3"
    const match = str.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  // Helper to safely parse optional numbers
  const parseOptionalNumber = (value: any): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined
    const num = typeof value === 'string' ? parseFloat(value) : Number(value)
    return isNaN(num) ? undefined : num
  }

  // Helper to safely get string value
  const getString = (value: any): string => {
    if (value === null || value === undefined) return ''
    return String(value)
  }

  // Helper to parse boolean
  const parseBoolean = (value: any): boolean => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1'
    }
    return Boolean(value)
  }

  return {
    id: rowIndex.toString(),
    week: parseNumber(row[SHEET_COLUMNS.WEEK]),
    day: parseNumber(row[SHEET_COLUMNS.DAY]),
    _rawWeek: row[SHEET_COLUMNS.WEEK] !== undefined ? String(row[SHEET_COLUMNS.WEEK]) : undefined,
    _rawDay: row[SHEET_COLUMNS.DAY] !== undefined ? String(row[SHEET_COLUMNS.DAY]) : undefined,
    type: getString(row[SHEET_COLUMNS.TYPE]) as WorkoutType,
    section: getString(row[SHEET_COLUMNS.SECTION]) as WorkoutSection,
    exercise: getString(row[SHEET_COLUMNS.EXERCISE]),
    description: getString(row[SHEET_COLUMNS.DESCRIPTION]),
    sets: parseNumber(row[SHEET_COLUMNS.SETS]),
    reps: getString(row[SHEET_COLUMNS.REPS]),
    rir: parseNumber(row[SHEET_COLUMNS.RIR]),
    rest: getString(row[SHEET_COLUMNS.REST]),
    escalation: getString(row[SHEET_COLUMNS.ESCALATION]),
    notes: getString(row[SHEET_COLUMNS.NOTES]),
    set1: parseOptionalNumber(row[SHEET_COLUMNS.SET1]),
    set2: parseOptionalNumber(row[SHEET_COLUMNS.SET2]),
    set3: parseOptionalNumber(row[SHEET_COLUMNS.SET3]),
    set4: parseOptionalNumber(row[SHEET_COLUMNS.SET4]),
    set5: parseOptionalNumber(row[SHEET_COLUMNS.SET5]),
    load: getString(row[SHEET_COLUMNS.LOAD]) || undefined,
    avgRir: parseOptionalNumber(row[SHEET_COLUMNS.AVG_RIR]),
    done: parseBoolean(row[SHEET_COLUMNS.DONE]),
    lastSaved: getString(row[SHEET_COLUMNS.LAST_SAVED]) || undefined,
    videoUrl: getString(row[SHEET_COLUMNS.VIDEO_URL]) || undefined,
  }
}

/**
 * Convert a Workout object to a sheet row
 */
export function mapWorkoutToRow(workout: Workout): any[] {
  const row = new Array(22).fill('') // Initialize with 22 empty cells

  // Helper to format optional values
  const formatOptional = (value: any): string => {
    return value !== undefined && value !== null ? String(value) : ''
  }

  row[SHEET_COLUMNS.WEEK] = workout._rawWeek ?? workout.week
  row[SHEET_COLUMNS.DAY] = workout._rawDay ?? workout.day
  row[SHEET_COLUMNS.TYPE] = workout.type
  row[SHEET_COLUMNS.SECTION] = workout.section
  row[SHEET_COLUMNS.EXERCISE] = workout.exercise
  row[SHEET_COLUMNS.DESCRIPTION] = workout.description || ''
  row[SHEET_COLUMNS.SETS] = workout.sets
  row[SHEET_COLUMNS.REPS] = workout.reps
  row[SHEET_COLUMNS.RIR] = workout.rir
  row[SHEET_COLUMNS.REST] = workout.rest
  row[SHEET_COLUMNS.ESCALATION] = workout.escalation || ''
  row[SHEET_COLUMNS.NOTES] = workout.notes || ''
  row[SHEET_COLUMNS.SET1] = formatOptional(workout.set1)
  row[SHEET_COLUMNS.SET2] = formatOptional(workout.set2)
  row[SHEET_COLUMNS.SET3] = formatOptional(workout.set3)
  row[SHEET_COLUMNS.SET4] = formatOptional(workout.set4)
  row[SHEET_COLUMNS.SET5] = formatOptional(workout.set5)
  row[SHEET_COLUMNS.LOAD] = workout.load || ''
  row[SHEET_COLUMNS.AVG_RIR] = formatOptional(workout.avgRir)
  row[SHEET_COLUMNS.DONE] = workout.done ? 'TRUE' : 'FALSE'
  row[SHEET_COLUMNS.LAST_SAVED] = workout.lastSaved || new Date().toISOString()
  row[SHEET_COLUMNS.VIDEO_URL] = workout.videoUrl || ''

  return row
}

/**
 * Calculate average RIR from set values
 */
export function calculateAvgRir(
  set1?: number,
  set2?: number,
  set3?: number,
  set4?: number,
  set5?: number,
  plannedSets: number = 3
): number | undefined {
  const sets = [set1, set2, set3, set4, set5].filter(
    (s): s is number => s !== undefined && s !== null
  )

  if (sets.length === 0) return undefined

  const total = sets.reduce((sum, s) => sum + s, 0)
  return Math.round((total / sets.length) * 10) / 10 // Round to 1 decimal
}

/**
 * Validate workout data before creating/updating
 */
export function validateWorkout(workout: Partial<Workout>): string[] {
  const errors: string[] = []

  if (!workout.exercise || workout.exercise.trim() === '') {
    errors.push('Exercise name is required')
  }

  if (!workout.type) {
    errors.push('Workout type is required')
  }

  if (!workout.section) {
    errors.push('Workout section is required')
  }

  if (workout.week !== undefined && (workout.week < 1 || workout.week > 52)) {
    errors.push('Week must be between 1 and 52')
  }

  if (workout.day !== undefined && (workout.day < 1 || workout.day > 7)) {
    errors.push('Day must be between 1 and 7')
  }

  if (workout.sets !== undefined && (workout.sets < 1 || workout.sets > 10)) {
    errors.push('Sets must be between 1 and 10')
  }

  if (workout.rir !== undefined && (workout.rir < 0 || workout.rir > 10)) {
    errors.push('RIR must be between 0 and 10')
  }

  return errors
}
