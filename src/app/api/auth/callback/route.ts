import { NextRequest, NextResponse } from 'next/server'
import { googleAuth } from '@/lib/google-sheets/auth'
import { createAuthCookie } from '@/lib/utils/cookies'

/**
 * OAuth callback handler
 * Handles the redirect from Google OAuth consent screen
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  // Check for OAuth errors
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  // Check if we have the authorization code
  if (!code) {
    return NextResponse.redirect(
      new URL('/?error=missing_code', request.url)
    )
  }

  try {
    // Exchange authorization code for tokens
    const tokens = await googleAuth.getTokensFromCode(code)

    if (!tokens.access_token) {
      throw new Error('No access token received')
    }

    // Create response with redirect to workouts page
    const response = NextResponse.redirect(new URL('/workouts', request.url))

    // Set auth cookie with tokens
    response.headers.set('Set-Cookie', createAuthCookie(tokens))

    return response
  } catch (error: any) {
    console.error('Error exchanging code for tokens:', error)
    return NextResponse.redirect(
      new URL(
        `/?error=${encodeURIComponent(error.message || 'authentication_failed')}`,
        request.url
      )
    )
  }
}
