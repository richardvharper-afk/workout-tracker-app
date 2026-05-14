import { GoogleSheetsClient } from './client'
import { GoogleSheetsAuth } from './auth'
import { GoogleAuthTokens, SESSIONS_COLUMNS } from '@/types/sheets'
import { Session, SessionFormData } from '@/types/session'
import { format } from 'date-fns'

const SHEET_NAME = 'Sessions'

/**
 * Convert a sheet row to a Session object
 */
function mapRowToSession(row: any[], rowIndex: number): Session {
  const parseOptionalNumber = (value: any): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined
    // Handle European decimal format (comma instead of period)
    const normalized = typeof value === 'string' ? value.replace(',', '.') : value
    const num = typeof normalized === 'string' ? parseFloat(normalized) : Number(normalized)
    return isNaN(num) ? undefined : num
  }

  const parseNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0
    if (typeof value === 'number') return value
    const num = parseInt(String(value))
    return isNaN(num) ? 0 : num
  }

  const getString = (value: any): string => {
    if (value === null || value === undefined) return ''
    return String(value)
  }

  return {
    id: rowIndex.toString(),
    week: parseNumber(row[SESSIONS_COLUMNS.WEEK]),
    day: parseNumber(row[SESSIONS_COLUMNS.DAY]),
    duration: parseOptionalNumber(row[SESSIONS_COLUMNS.DURATION]),
    calories: parseOptionalNumber(row[SESSIONS_COLUMNS.CALORIES]),
    rpe: parseOptionalNumber(row[SESSIONS_COLUMNS.RPE]),
    date: getString(row[SESSIONS_COLUMNS.DATE]) || undefined,
  }
}

/**
 * Convert a Session object to a sheet row
 */
function mapSessionToRow(session: Session): any[] {
  const row = new Array(6).fill('')

  const formatOptional = (value: any): string => {
    return value !== undefined && value !== null ? String(value) : ''
  }

  row[SESSIONS_COLUMNS.WEEK] = session.week
  row[SESSIONS_COLUMNS.DAY] = session.day
  row[SESSIONS_COLUMNS.DURATION] = formatOptional(session.duration)
  row[SESSIONS_COLUMNS.CALORIES] = formatOptional(session.calories)
  row[SESSIONS_COLUMNS.RPE] = formatOptional(session.rpe)
  row[SESSIONS_COLUMNS.DATE] = session.date || ''

  return row
}

export class SessionsService {
  private client: GoogleSheetsClient
  private auth: GoogleSheetsAuth

  constructor() {
    this.auth = new GoogleSheetsAuth()
    this.client = new GoogleSheetsClient(this.auth)
  }

  /**
   * Initialize the service with auth tokens
   */
  async initialize(tokens: GoogleAuthTokens): Promise<void> {
    await this.client.initialize(tokens)
  }

  /**
   * Get all sessions
   */
  async getAllSessions(): Promise<Session[]> {
    const rows = await this.client.getRows(`${SHEET_NAME}!A2:F`)
    return rows.map((row, index) => mapRowToSession(row, index + 2))
  }

  /**
   * Find session by week and day
   */
  async getSession(week: number, day: number): Promise<Session | null> {
    const sessions = await this.getAllSessions()
    return sessions.find(s => s.week === week && s.day === day) || null
  }

  /**
   * Create or update session for a specific week+day
   */
  async saveSession(
    week: number,
    day: number,
    formData: SessionFormData
  ): Promise<Session> {
    console.log('saveSession called with:', { week, day, formData })

    // Check if session exists
    const existing = await this.getSession(week, day)
    console.log('Existing session:', existing)

    const session: Session = {
      id: existing?.id || '',
      week,
      day,
      duration: formData.duration,
      calories: formData.calories,
      rpe: formData.rpe,
      date: format(new Date(), 'yyyy-MM-dd'), // Auto-populate current date
    }
    console.log('Session to save:', session)

    const row = mapSessionToRow(session)
    console.log('Mapped row:', row)

    if (existing) {
      // Update existing row in Sessions sheet
      console.log('Updating existing session at row:', existing.id)
      await this.client.updateRow(parseInt(existing.id), row, SHEET_NAME)
      session.id = existing.id
    } else {
      // Append new row to Sessions sheet
      console.log('Appending new session to Sessions sheet')
      const newRowIndex = await this.client.appendRow(row, SHEET_NAME)
      console.log('New row index:', newRowIndex)
      session.id = newRowIndex.toString()
    }

    return session
  }
}
