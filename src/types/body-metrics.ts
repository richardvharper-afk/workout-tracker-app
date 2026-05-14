// Body Metrics type for tracking physical measurements over time

export interface BodyMetric {
  id: string // Row number in sheet
  week: number // Program week number
  date: string // ISO date string (YYYY-MM-DD)
  bodyweight?: number // kg
  waist?: number // cm
  chest?: number // cm
  shoulders?: number // cm
  leftBicep?: number // cm
  rightBicep?: number // cm
  hips?: number // cm
  notes?: string
}

// Form data for creating/updating body metrics
export interface BodyMetricFormData {
  bodyweight?: number
  waist?: number
  chest?: number
  shoulders?: number
  leftBicep?: number
  rightBicep?: number
  hips?: number
  notes?: string
}

// API response types
export interface BodyMetricResponse {
  success: boolean
  data?: BodyMetric
  error?: string
}

export interface BodyMetricsListResponse {
  success: boolean
  data?: BodyMetric[]
  error?: string
}
