// Application configuration constants

export const APP_CONFIG = {
  name: 'Workout Tracker',
  description: 'Track your workouts with Google Sheets',
  version: '0.1.0',
} as const

export const GOOGLE_SHEETS_CONFIG = {
  spreadsheetId: process.env.GOOGLE_SHEET_ID || '',
  sheetName: 'Workouts', // Default sheet name
  dataStartRow: 2, // Row 2 (assuming row 1 is headers)
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
  ],
} as const

export const AUTH_CONFIG = {
  cookieName: 'workout_tracker_auth',
  cookieMaxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  tokenRefreshBuffer: 5 * 60 * 1000, // Refresh 5 minutes before expiry
} as const

export const API_CONFIG = {
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const

export const WORKOUT_TYPES = [
  'Upper Body',
  'Lower Body',
  'Full Body',
  'Core',
  'Cardio',
  'Flexibility',
  'Rest',
] as const

export const WORKOUT_SECTIONS = [
  'Warm-up',
  'Strength',
  'Accessory',
  'Core',
  'Cool-down',
  'Cardio',
] as const

export const DEFAULT_WORKOUT_VALUES = {
  sets: 3,
  reps: '10',
  rir: 2,
  rest: '60s',
  escalation: '',
  notes: '',
  done: false,
} as const
