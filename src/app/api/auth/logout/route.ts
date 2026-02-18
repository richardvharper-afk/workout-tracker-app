import { NextRequest, NextResponse } from 'next/server'
import { googleAuth } from '@/lib/google-sheets/auth'
import { getTokensFromCookies, clearAuthCookie } from '@/lib/utils/cookies'

/**
 * Logout handler
 * Revokes the access token and clears the auth cookie
 */
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie')
    const tokens = getTokensFromCookies(cookieHeader)

    // Revoke token if it exists
    if (tokens?.access_token) {
      try {
        await googleAuth.revokeToken(tokens.access_token)
      } catch (error) {
        console.error('Error revoking token:', error)
        // Continue even if revocation fails
      }
    }

    // Create response
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    )

    // Clear auth cookie
    response.headers.set('Set-Cookie', clearAuthCookie())

    return response
  } catch (error: any) {
    console.error('Error during logout:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Logout failed' },
      { status: 500 }
    )
  }
}
