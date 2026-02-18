import { NextRequest } from 'next/server'
import { getTokensFromCookies } from './cookies'
import { GoogleAuthTokens } from '@/types/sheets'

/**
 * Get authenticated user's tokens from request
 */
export function getAuthTokens(request: NextRequest): GoogleAuthTokens | null {
  const cookieHeader = request.headers.get('cookie')
  return getTokensFromCookies(cookieHeader)
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(request: NextRequest): boolean {
  const tokens = getAuthTokens(request)
  return tokens !== null && !!tokens.access_token
}

/**
 * Require authentication for API routes
 * Returns tokens if authenticated, null otherwise
 */
export function requireAuth(request: NextRequest): GoogleAuthTokens | null {
  const tokens = getAuthTokens(request)

  if (!tokens || !tokens.access_token) {
    return null
  }

  return tokens
}
