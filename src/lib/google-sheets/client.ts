import { google, sheets_v4 } from 'googleapis'
import { GoogleSheetsAuth } from './auth'
import { GoogleAuthTokens, SheetUpdateRequest, SheetAppendRequest } from '@/types/sheets'
import { GOOGLE_SHEETS_CONFIG } from '@/constants/config'

export class GoogleSheetsClient {
  private auth: GoogleSheetsAuth
  private sheets: sheets_v4.Sheets | null = null

  constructor(auth: GoogleSheetsAuth) {
    this.auth = auth
  }

  /**
   * Initialize the Google Sheets API client with credentials
   */
  async initialize(tokens: GoogleAuthTokens): Promise<void> {
    // Check if token needs refresh
    if (this.auth.isTokenExpired(tokens.expiry_date) && tokens.refresh_token) {
      try {
        const newTokens = await this.auth.refreshAccessToken(tokens.refresh_token)
        this.auth.setCredentials(newTokens)
      } catch (error) {
        console.error('Failed to refresh token:', error)
        throw new Error('Authentication failed. Please log in again.')
      }
    } else {
      this.auth.setCredentials(tokens)
    }

    this.sheets = google.sheets({ version: 'v4', auth: this.auth.getClient() })
  }

  /**
   * Get all rows from the spreadsheet
   */
  async getRows(range?: string): Promise<any[][]> {
    if (!this.sheets) {
      throw new Error('Sheets client not initialized')
    }

    const fullRange = range || `${GOOGLE_SHEETS_CONFIG.sheetName}!A${GOOGLE_SHEETS_CONFIG.dataStartRow}:V`

    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.sheets!.spreadsheets.values.get({
          spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
          range: fullRange,
        })
      })

      return response.data.values || []
    } catch (error: any) {
      console.error('Error getting rows:', error)
      throw this.handleApiError(error)
    }
  }

  /**
   * Get a single row by row number
   */
  async getRow(rowNumber: number): Promise<any[]> {
    if (!this.sheets) {
      throw new Error('Sheets client not initialized')
    }

    const range = `${GOOGLE_SHEETS_CONFIG.sheetName}!A${rowNumber}:V${rowNumber}`

    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.sheets!.spreadsheets.values.get({
          spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
          range,
        })
      })

      const rows = response.data.values || []
      return rows[0] || []
    } catch (error: any) {
      console.error('Error getting row:', error)
      throw this.handleApiError(error)
    }
  }

  /**
   * Update a row in the spreadsheet
   */
  async updateRow(rowNumber: number, values: any[]): Promise<void> {
    if (!this.sheets) {
      throw new Error('Sheets client not initialized')
    }

    const range = `${GOOGLE_SHEETS_CONFIG.sheetName}!A${rowNumber}:V${rowNumber}`

    try {
      await this.retryWithBackoff(async () => {
        return await this.sheets!.spreadsheets.values.update({
          spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [values],
          },
        })
      })
    } catch (error: any) {
      console.error('Error updating row:', error)
      throw this.handleApiError(error)
    }
  }

  /**
   * Append a new row to the spreadsheet
   */
  async appendRow(values: any[]): Promise<number> {
    if (!this.sheets) {
      throw new Error('Sheets client not initialized')
    }

    const range = `${GOOGLE_SHEETS_CONFIG.sheetName}!A:V`

    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.sheets!.spreadsheets.values.append({
          spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [values],
          },
        })
      })

      // Extract row number from the update range (e.g., "Workouts!A10:V10")
      const updatedRange = response.data.updates?.updatedRange || ''
      const match = updatedRange.match(/!A(\d+):/)
      const rowNumber = match ? parseInt(match[1], 10) : -1

      return rowNumber
    } catch (error: any) {
      console.error('Error appending row:', error)
      throw this.handleApiError(error)
    }
  }

  /**
   * Delete a row from the spreadsheet
   */
  async deleteRow(rowNumber: number): Promise<void> {
    if (!this.sheets) {
      throw new Error('Sheets client not initialized')
    }

    try {
      // Get sheet ID first
      const sheetMetadata = await this.sheets.spreadsheets.get({
        spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
      })

      const sheet = sheetMetadata.data.sheets?.find(
        s => s.properties?.title === GOOGLE_SHEETS_CONFIG.sheetName
      )

      if (!sheet?.properties?.sheetId) {
        throw new Error('Sheet not found')
      }

      await this.retryWithBackoff(async () => {
        return await this.sheets!.spreadsheets.batchUpdate({
          spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
          requestBody: {
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: sheet.properties!.sheetId,
                    dimension: 'ROWS',
                    startIndex: rowNumber - 1, // 0-indexed
                    endIndex: rowNumber,
                  },
                },
              },
            ],
          },
        })
      })
    } catch (error: any) {
      console.error('Error deleting row:', error)
      throw this.handleApiError(error)
    }
  }

  /**
   * Retry with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: any

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error: any) {
        lastError = error

        // Don't retry on authentication errors
        if (error.code === 401 || error.code === 403) {
          throw error
        }

        // Don't retry on the last attempt
        if (i === maxRetries - 1) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  /**
   * Handle API errors and convert to user-friendly messages
   */
  private handleApiError(error: any): Error {
    if (error.code === 401) {
      return new Error('Authentication failed. Please log in again.')
    }
    if (error.code === 403) {
      return new Error('Access denied. Please check your permissions.')
    }
    if (error.code === 429) {
      return new Error('Rate limit exceeded. Please try again later.')
    }
    if (error.code === 404) {
      return new Error('Spreadsheet not found.')
    }
    if (error.code >= 500) {
      return new Error('Google Sheets service error. Please try again later.')
    }

    return new Error(error.message || 'An unexpected error occurred.')
  }
}
