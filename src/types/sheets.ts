// Google Sheets related types

export interface SheetConfig {
  spreadsheetId: string
  sheetName: string
  range: string
}

export interface SheetRow {
  values: any[]
  rowIndex: number
}

export interface SheetUpdateRequest {
  range: string
  values: any[][]
}

export interface SheetAppendRequest {
  range: string
  values: any[][]
  valueInputOption?: 'RAW' | 'USER_ENTERED'
}

export interface GoogleAuthTokens {
  access_token: string
  refresh_token?: string
  expiry_date?: number
  token_type?: string
  scope?: string
}

export interface OAuthCallbackParams {
  code?: string
  error?: string
  state?: string
}

// Column indices for the workout sheet (0-based)
export const SHEET_COLUMNS = {
  WEEK: 0,
  DAY: 1,
  TYPE: 2,
  SECTION: 3,
  EXERCISE: 4,
  DESCRIPTION: 5,
  SETS: 6,
  REPS: 7,
  RIR: 8,
  REST: 9,
  ESCALATION: 10,
  NOTES: 11,
  SET1: 12,
  SET2: 13,
  SET3: 14,
  SET4: 15,
  SET5: 16,
  LOAD: 17,
  AVG_RIR: 18,
  DONE: 19,
  LAST_SAVED: 20,
  VIDEO_URL: 21,
  ROW_INDEX: 22,
  MUSCLE_GROUP: 23,
  IS_BODYWEIGHT: 24,
  OWN_NOTE: 25,
} as const

export const TOTAL_COLUMNS = 26

// Body Metrics sheet column indices (0-based)
export const BODY_METRICS_COLUMNS = {
  DATE: 0,
  BODYWEIGHT: 1,
  WAIST: 2,
  CHEST: 3,
  SHOULDERS: 4,
  LEFT_BICEP: 5,
  RIGHT_BICEP: 6,
  HIPS: 7,
  NOTES: 8,
} as const

export const BODY_METRICS_TOTAL_COLUMNS = 9

// Sessions sheet column indices (0-based)
export const SESSIONS_COLUMNS = {
  WEEK: 0,
  DAY: 1,
  DURATION: 2,
  CALORIES: 3,
  RPE: 4,
  DATE: 5,
} as const

export const SESSIONS_TOTAL_COLUMNS = 6
