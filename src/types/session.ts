// Session type for tracking session-level workout data

export interface Session {
  id: string // Row number in sheet
  week: number
  day: number
  duration?: number // minutes
  calories?: number // from Apple Watch
  rpe?: number // Rate of Perceived Exertion (1-10)
  date?: string // ISO date string (YYYY-MM-DD)
}

// Form data for creating/updating sessions
export interface SessionFormData {
  duration?: number
  calories?: number
  rpe?: number
}

// API response types
export interface SessionResponse {
  success: boolean
  data?: Session
  error?: string
}

export interface SessionsListResponse {
  success: boolean
  data?: Session[]
  error?: string
}
