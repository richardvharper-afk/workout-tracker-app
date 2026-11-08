import { Workout, WorkoutType, WorkoutSection } from '@/types/workout'
import { SHEET_COLUMNS } from '@/types/sheets'
import { parseDecimal } from '@/lib/utils/number'

/**
 * Convert a sheet row to a Workout object
 */
export function mapRowToWorkout(row: any[], rowIndex: number): Workout {
  // Helper to safely parse numbers, handling formats like "Day 1", "Week 3"
  const parseNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0
    if (typeof value === 'number') return value
    const str = String(value)
    // Try direct parse first (accepts comma or period decimals)
    const direct = parseDecimal(str)
    if (direct !== undefined) return direct
    // Extract number from strings like "Day 1", "Week 3"
    const match = str.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  // Helper to safely parse optional numbers
  const parseOptionalNumber = (value: any): number | undefined => {
    return parseDecimal(value)
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
    rowIndex: getString(row[SHEET_COLUMNS.ROW_INDEX]) || undefined,
    muscleGroup: getString(row[SHEET_COLUMNS.MUSCLE_GROUP]) || undefined,
    isBodyweight: getString(row[SHEET_COLUMNS.IS_BODYWEIGHT]).trim().toLowerCase() === 'yes',
    ownNote: getString(row[SHEET_COLUMNS.OWN_NOTE]) || undefined,
  }
}

/**
 * Convert a Workout object to a sheet row
 */
export function mapWorkoutToRow(workout: Workout): any[] {
  const row = new Array(26).fill('') // Initialize with 26 empty cells

  // Helper to format optional values
  // Send real numbers (not strings) so Sheets stores numeric cells regardless of
  // the spreadsheet locale (en-ZA uses a comma decimal separator).
  const formatOptional = (value: any): number | string => {
    return typeof value === 'number' && !isNaN(value) ? value : ''
  }

  // Load is free text ("22.5kg", "BW"), but a bare number must stay numeric
  const formatLoad = (value: string | undefined): number | string => {
    if (!value) return ''
    const n = /^\s*\d+([.,]\d+)?\s*$/.test(value) ? parseDecimal(value) : undefined
    return n !== undefined ? n : value
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
  row[SHEET_COLUMNS.LOAD] = formatLoad(workout.load)
  row[SHEET_COLUMNS.AVG_RIR] = formatOptional(workout.avgRir)
  row[SHEET_COLUMNS.DONE] = workout.done ? 'TRUE' : 'FALSE'
  row[SHEET_COLUMNS.LAST_SAVED] = workout.lastSaved || ''
  row[SHEET_COLUMNS.VIDEO_URL] = workout.videoUrl || ''
  row[SHEET_COLUMNS.ROW_INDEX] = workout.rowIndex || ''
  row[SHEET_COLUMNS.MUSCLE_GROUP] = workout.muscleGroup || ''
  row[SHEET_COLUMNS.IS_BODYWEIGHT] = workout.isBodyweight ? 'yes' : 'no'
  row[SHEET_COLUMNS.OWN_NOTE] = workout.ownNote || ''

  return row
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
