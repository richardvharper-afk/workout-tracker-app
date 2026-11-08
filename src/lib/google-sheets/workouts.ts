import { GoogleSheetsClient } from './client'
import { Workout, WorkoutFormData, WorkoutPerformanceData, WorkoutFilters } from '@/types/workout'
import { mapRowToWorkout, mapWorkoutToRow } from './mapper'
import { GOOGLE_SHEETS_CONFIG } from '@/constants/config'

/** What the caller believes lives at a row number. Used to detect stale row IDs. */
export type WorkoutIdentity = Pick<Workout, 'week' | 'day' | 'exercise'>

export class WorkoutMismatchError extends Error {
  constructor() {
    super('This row changed in the sheet. Refresh and try again.')
    this.name = 'WorkoutMismatchError'
  }
}

function assertSameWorkout(existing: Workout, expected?: WorkoutIdentity) {
  if (!expected) return
  if (
    existing.exercise.trim() !== expected.exercise.trim() ||
    existing.week !== expected.week ||
    existing.day !== expected.day
  ) {
    throw new WorkoutMismatchError()
  }
}

export class WorkoutsService {
  constructor(private client: GoogleSheetsClient) {}

  /**
   * Get all workouts with optional filtering
   */
  async getWorkouts(filters?: WorkoutFilters): Promise<Workout[]> {
    const rows = await this.client.getRows()

    let workouts = rows.map((row, index) =>
      mapRowToWorkout(row, index + GOOGLE_SHEETS_CONFIG.dataStartRow)
    )

    // Apply filters
    if (filters) {
      if (filters.week !== undefined) {
        workouts = workouts.filter(w => w.week === filters.week)
      }
      if (filters.day !== undefined) {
        workouts = workouts.filter(w => w.day === filters.day)
      }
      if (filters.type) {
        workouts = workouts.filter(w => w.type === filters.type)
      }
      if (filters.section) {
        workouts = workouts.filter(w => w.section === filters.section)
      }
      if (filters.done !== undefined) {
        workouts = workouts.filter(w => w.done === filters.done)
      }
    }

    return workouts
  }

  /**
   * Get a single workout by ID (row number)
   */
  async getWorkout(id: string): Promise<Workout | null> {
    const rowNumber = parseInt(id, 10)

    if (isNaN(rowNumber) || rowNumber < GOOGLE_SHEETS_CONFIG.dataStartRow) {
      return null
    }

    const row = await this.client.getRow(rowNumber)

    if (!row || row.length === 0) {
      return null
    }

    return mapRowToWorkout(row, rowNumber)
  }

  /**
   * Create a new workout
   */
  async createWorkout(data: WorkoutFormData): Promise<Workout> {
    const workout: Partial<Workout> = {
      ...data,
      done: false,
    }

    const row = mapWorkoutToRow(workout as Workout)
    const rowNumber = await this.client.appendRow(row)

    return {
      ...workout,
      id: rowNumber.toString(),
    } as Workout
  }

  /**
   * Update an existing workout
   */
  async updateWorkout(
    id: string,
    data: Partial<Workout>,
    expected?: WorkoutIdentity
  ): Promise<Workout> {
    const rowNumber = parseInt(id, 10)

    if (isNaN(rowNumber) || rowNumber < GOOGLE_SHEETS_CONFIG.dataStartRow) {
      throw new Error('Invalid workout ID')
    }

    // Get existing workout
    const existingWorkout = await this.getWorkout(id)

    if (!existingWorkout) {
      throw new Error('Workout not found')
    }

    assertSameWorkout(existingWorkout, expected)

    // lastSaved rules (editing a past workout must never move it on the calendar):
    // 1. An explicit lastSaved in the request wins (date override).
    // 2. Otherwise an existing timestamp is kept as-is.
    // 3. Otherwise stamp now, but only when the workout is being marked done.
    let lastSaved = existingWorkout.lastSaved
    if (data.lastSaved !== undefined) {
      lastSaved = data.lastSaved || undefined
    } else if (!existingWorkout.lastSaved && (data.done === true || existingWorkout.done)) {
      lastSaved = new Date().toISOString()
    }

    const updatedWorkout: Workout = {
      ...existingWorkout,
      ...data,
      id,
      lastSaved,
    }

    // Update the row
    const row = mapWorkoutToRow(updatedWorkout)
    await this.client.updateRow(rowNumber, row)

    return updatedWorkout
  }

  /**
   * Delete a workout
   */
  async deleteWorkout(id: string, expected?: WorkoutIdentity): Promise<void> {
    const rowNumber = parseInt(id, 10)

    if (isNaN(rowNumber) || rowNumber < GOOGLE_SHEETS_CONFIG.dataStartRow) {
      throw new Error('Invalid workout ID')
    }

    if (expected) {
      const existing = await this.getWorkout(id)
      if (!existing) throw new Error('Workout not found')
      assertSameWorkout(existing, expected)
    }

    await this.client.deleteRow(rowNumber)
  }
}
