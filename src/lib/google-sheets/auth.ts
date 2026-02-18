import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { GOOGLE_SHEETS_CONFIG } from '@/constants/config'
import { GoogleAuthTokens } from '@/types/sheets'

export class GoogleSheetsAuth {
  private oauth2Client: OAuth2Client

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback`
    )
  }

  /**
   * Generate OAuth URL for user consent
   */
  getAuthUrl(state?: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [...GOOGLE_SHEETS_CONFIG.scopes],
      prompt: 'consent', // Force consent to get refresh token
      state: state || undefined,
    })
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string): Promise<GoogleAuthTokens> {
    const { tokens } = await this.oauth2Client.getToken(code)

    if (!tokens.access_token) {
      throw new Error('No access token received from Google')
    }

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || undefined,
      token_type: tokens.token_type || undefined,
      scope: tokens.scope || undefined,
    }
  }

  /**
   * Set credentials on the OAuth client
   */
  setCredentials(tokens: GoogleAuthTokens): void {
    this.oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      token_type: tokens.token_type,
      scope: tokens.scope,
    })
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleAuthTokens> {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    })

    const { credentials } = await this.oauth2Client.refreshAccessToken()

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token')
    }

    return {
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || refreshToken,
      expiry_date: credentials.expiry_date || undefined,
      token_type: credentials.token_type || undefined,
      scope: credentials.scope || undefined,
    }
  }

  /**
   * Check if token is expired or about to expire
   */
  isTokenExpired(expiryDate?: number): boolean {
    if (!expiryDate) return true

    const now = Date.now()
    const bufferTime = 5 * 60 * 1000 // 5 minutes buffer

    return now >= (expiryDate - bufferTime)
  }

  /**
   * Get the configured OAuth client
   */
  getClient(): OAuth2Client {
    return this.oauth2Client
  }

  /**
   * Revoke token (logout)
   */
  async revokeToken(token: string): Promise<void> {
    await this.oauth2Client.revokeToken(token)
  }
}

// Singleton instance
export const googleAuth = new GoogleSheetsAuth()
