import { NextRequest, NextResponse } from 'next/server'
import { SessionsService } from '@/lib/google-sheets/sessions'
import { requireAuth } from '@/lib/utils/auth'
import { SessionFormData } from '@/types/session'

/**
 * GET /api/sheets/sessions
 * Fetch sessions, optionally filtered by week and/or day
 */
export async function GET(request: NextRequest) {
  try {
    const tokens = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const week = searchParams.get('week')
    const day = searchParams.get('day')

    const service = new SessionsService()
    await service.initialize(tokens)

    if (week && day) {
      // Get specific session
      const session = await service.getSession(parseInt(week), parseInt(day))
      return NextResponse.json({
        success: true,
        data: session,
      })
    } else {
      // Get all sessions
      const sessions = await service.getAllSessions()
      return NextResponse.json({
        success: true,
        data: sessions,
      })
    }
  } catch (error: any) {
    console.error('GET /api/sheets/sessions error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sessions' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

/**
 * POST /api/sheets/sessions
 * Create or update a session
 */
export async function POST(request: NextRequest) {
  try {
    const tokens = await requireAuth(request)
    const body = await request.json()
    const { week, day, ...formData } = body as { week: number; day: number } & SessionFormData

    if (!week || !day) {
      return NextResponse.json(
        { success: false, error: 'Week and day are required' },
        { status: 400 }
      )
    }

    const service = new SessionsService()
    await service.initialize(tokens)

    const session = await service.saveSession(week, day, formData)

    return NextResponse.json({
      success: true,
      data: session,
    })
  } catch (error: any) {
    console.error('POST /api/sheets/sessions error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save session' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
