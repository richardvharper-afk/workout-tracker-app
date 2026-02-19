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
} as const

export const TOTAL_COLUMNS = 22
