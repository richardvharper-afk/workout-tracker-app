import { GoogleSheetsClient } from './client'
import { Workout, WorkoutFormData, WorkoutPerformanceData, WorkoutFilters } from '@/types/workout'
import { mapRowToWorkout, mapWorkoutToRow } from './mapper'
import { GOOGLE_SHEETS_CONFIG } from '@/constants/config'

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
      lastSaved: new Date().toISOString(),
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
  async updateWorkout(id: string, data: Partial<Workout>): Promise<Workout> {
    const rowNumber = parseInt(id, 10)

    if (isNaN(rowNumber) || rowNumber < GOOGLE_SHEETS_CONFIG.dataStartRow) {
      throw new Error('Invalid workout ID')
    }

    // Get existing workout
    const existingWorkout = await this.getWorkout(id)

    if (!existingWorkout) {
      throw new Error('Workout not found')
    }

    // Merge with updates
    const updatedWorkout: Workout = {
      ...existingWorkout,
      ...data,
      id,
      lastSaved: new Date().toISOString(),
    }

    // Update the row
    const row = mapWorkoutToRow(updatedWorkout)
    await this.client.updateRow(rowNumber, row)

    return updatedWorkout
  }

  /**
   * Update workout performance (during workout)
   */
  async updateWorkoutPerformance(
    id: string,
    data: WorkoutPerformanceData
  ): Promise<Workout> {
    return this.updateWorkout(id, {
      ...data,
      lastSaved: new Date().toISOString(),
    })
  }

  /**
   * Delete a workout
   */
  async deleteWorkout(id: string): Promise<void> {
    const rowNumber = parseInt(id, 10)

    if (isNaN(rowNumber) || rowNumber < GOOGLE_SHEETS_CONFIG.dataStartRow) {
      throw new Error('Invalid workout ID')
    }

    await this.client.deleteRow(rowNumber)
  }

  /**
   * Mark workout as done
   */
  async markWorkoutDone(id: string, done: boolean = true): Promise<Workout> {
    return this.updateWorkout(id, {
      done,
      lastSaved: new Date().toISOString(),
    })
  }

  /**
   * Get workouts for a specific week
   */
  async getWorkoutsForWeek(week: number): Promise<Workout[]> {
    return this.getWorkouts({ week })
  }

  /**
   * Get workouts for a specific day
   */
  async getWorkoutsForDay(week: number, day: number): Promise<Workout[]> {
    return this.getWorkouts({ week, day })
  }

  /**
   * Get incomplete workouts
   */
  async getIncompleteWorkouts(): Promise<Workout[]> {
    return this.getWorkouts({ done: false })
  }
}
