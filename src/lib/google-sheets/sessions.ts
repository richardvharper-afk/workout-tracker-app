import { GoogleSheetsClient } from './client'
import { GoogleSheetsAuth } from './auth'
import { GoogleAuthTokens, SESSIONS_COLUMNS } from '@/types/sheets'
import { Session, SessionFormData } from '@/types/session'
import { format } from 'date-fns'
import { parseDecimal } from '@/lib/utils/number'
import { normaliseDateString } from '@/lib/utils/dates'

const SHEET_NAME = 'Sessions'

/**
 * Convert a sheet row to a Session object
 */
function mapRowToSession(row: any[], rowIndex: number): Session {
  const parseOptionalNumber = (value: any): number | undefined => parseDecimal(value)

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
    date: normaliseDateString(row[SESSIONS_COLUMNS.DATE]) || undefined,
  }
}

/**
 * Convert a Session object to a sheet row
 */
function mapSessionToRow(session: Session): any[] {
  const row = new Array(6).fill('')

  // Real numbers, not strings: avoids locale mis-parsing of decimals (en-ZA)
  const formatOptional = (value: any): number | string => {
    return typeof value === 'number' && !isNaN(value) ? value : ''
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
    const existing = await this.getSession(week, day)

    const session: Session = {
      id: existing?.id || '',
      week,
      day,
      duration: formData.duration,
      calories: formData.calories,
      rpe: formData.rpe,
      // Explicit override wins; otherwise keep the original date so re-saving a
      // past session doesn't re-date it to today.
      date: formData.date || existing?.date || format(new Date(), 'yyyy-MM-dd'),
    }

    const row = mapSessionToRow(session)

    if (existing) {
      await this.client.updateRow(parseInt(existing.id), row, SHEET_NAME)
      session.id = existing.id
    } else {
      const newRowIndex = await this.client.appendRow(row, SHEET_NAME)
      session.id = newRowIndex.toString()
    }

    return session
  }
}
