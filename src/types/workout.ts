// Core Workout type matching Excel columns
export interface Workout {
  id: string // Row number in sheet
  week: number // Column 0
  day: number // Column 1
  _rawWeek?: string // Original cell value (e.g., "Week 1")
  _rawDay?: string // Original cell value (e.g., "Day 1")
  type: WorkoutType // Column 2
  section: WorkoutSection // Column 3
  exercise: string // Column 4
  description: string // Column 5
  sets: number // Column 6
  reps: string // Column 7 (can be "8-12" or "10")
  rir: number // Column 8 (Reps In Reserve)
  rest: string // Column 9 (e.g., "60s", "90s")
  escalation: string // Column 10
  notes: string // Column 11
  // Actual performance tracking
  set1?: number // Column 12
  set2?: number // Column 13
  set3?: number // Column 14
  set4?: number // Column 15
  set5?: number // Column 16
  load?: string // Column 17 (weight or variation)
  avgRir?: number // Column 18 (average RIR from sets)
  done: boolean // Column 19
  lastSaved?: string // Column 20 (ISO timestamp)
  videoUrl?: string // Column 21
  rowIndex?: string // Column 22 (position index)
  muscleGroup?: string // Column 23 (priority muscle group)
  isBodyweight?: boolean // Column 24
}

export type WorkoutType =
  | 'Upper Body'
  | 'Lower Body'
  | 'Full Body'
  | 'Core'
  | 'Cardio'
  | 'Flexibility'
  | 'Rest'

export type WorkoutSection =
  | 'Warm-up'
  | 'Strength'
  | 'Accessory'
  | 'Core'
  | 'Cool-down'
  | 'Cardio'

// Form data for creating/editing workouts
export interface WorkoutFormData {
  week: number
  day: number
  type: WorkoutType
  section: WorkoutSection
  exercise: string
  description?: string
  sets: number
  reps: string
  rir: number
  rest: string
  escalation?: string
  notes?: string
}

// Form data for updating workout performance
export interface WorkoutPerformanceData {
  set1?: number
  set2?: number
  set3?: number
  set4?: number
  set5?: number
  load?: string
  avgRir?: number
  done: boolean
  notes?: string
}

// Filter options for workout list
export interface WorkoutFilters {
  week?: number
  day?: number
  type?: WorkoutType
  section?: WorkoutSection
  done?: boolean
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    total: number
    filtered: number
  }
}

export interface WorkoutListResponse {
  workouts: Workout[]
  metadata: {
    total: number
    filtered: number
  }
}
