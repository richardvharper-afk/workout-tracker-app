import { GoogleAuthTokens } from '@/types/sheets'
import { AUTH_CONFIG } from '@/constants/config'

/**
 * Serialize tokens for storage in cookies
 */
export function serializeTokens(tokens: GoogleAuthTokens): string {
  return Buffer.from(JSON.stringify(tokens)).toString('base64')
}

/**
 * Deserialize tokens from cookie value
 */
export function deserializeTokens(value: string): GoogleAuthTokens | null {
  try {
    const json = Buffer.from(value, 'base64').toString('utf-8')
    return JSON.parse(json)
  } catch (error) {
    console.error('Failed to deserialize tokens:', error)
    return null
  }
}

/**
 * Create cookie header for setting auth tokens
 */
export function createAuthCookie(tokens: GoogleAuthTokens): string {
  const serialized = serializeTokens(tokens)
  const maxAge = AUTH_CONFIG.cookieMaxAge

  return `${AUTH_CONFIG.cookieName}=${serialized}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`
}

/**
 * Create cookie header for clearing auth tokens
 */
export function clearAuthCookie(): string {
  return `${AUTH_CONFIG.cookieName}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
}

/**
 * Get auth tokens from request cookies
 */
export function getTokensFromCookies(cookieHeader: string | null): GoogleAuthTokens | null {
  if (!cookieHeader) return null

  const cookies = parseCookies(cookieHeader)
  const tokenValue = cookies[AUTH_CONFIG.cookieName]

  if (!tokenValue) return null

  return deserializeTokens(tokenValue)
}

/**
 * Parse cookie header into object
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=')
    const value = rest.join('=').trim()
    if (name) {
      cookies[name.trim()] = value
    }
  })

  return cookies
}
