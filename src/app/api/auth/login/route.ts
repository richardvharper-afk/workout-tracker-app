import { NextRequest, NextResponse } from 'next/server'
import { googleAuth } from '@/lib/google-sheets/auth'

/**
 * Login handler
 * Redirects to Google OAuth consent screen
 */
export async function GET(request: NextRequest) {
  try {
    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(7)

    // Get OAuth URL
    const authUrl = googleAuth.getAuthUrl(state)

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Error generating auth URL:', error)
    return NextResponse.redirect(
      new URL(
        `/?error=${encodeURIComponent(error.message || 'login_failed')}`,
        request.url
      )
    )
  }
}
