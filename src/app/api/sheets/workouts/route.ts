import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/utils/auth'
import { GoogleSheetsClient } from '@/lib/google-sheets/client'
import { WorkoutsService } from '@/lib/google-sheets/workouts'
import { googleAuth } from '@/lib/google-sheets/auth'
import { validateWorkout } from '@/lib/google-sheets/mapper'
import { WorkoutFormData, WorkoutFilters } from '@/types/workout'

/**
 * GET /api/sheets/workouts
 * Fetch all workouts with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const tokens = requireAuth(request)
    if (!tokens) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Initialize Google Sheets client
    const client = new GoogleSheetsClient(googleAuth)
    await client.initialize(tokens)

    const service = new WorkoutsService(client)

    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const filters: WorkoutFilters = {}

    const week = searchParams.get('week')
    if (week) filters.week = parseInt(week, 10)

    const day = searchParams.get('day')
    if (day) filters.day = parseInt(day, 10)

    const type = searchParams.get('type')
    if (type) filters.type = type as any

    const section = searchParams.get('section')
    if (section) filters.section = section as any

    const done = searchParams.get('done')
    if (done) filters.done = done === 'true'

    // Fetch workouts
    const workouts = await service.getWorkouts(filters)

    return NextResponse.json({
      success: true,
      data: workouts,
      metadata: {
        total: workouts.length,
        filtered: Object.keys(filters).length > 0 ? workouts.length : workouts.length,
      },
    })
  } catch (error: any) {
    console.error('Error fetching workouts:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch workouts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sheets/workouts
 * Create a new workout
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const tokens = requireAuth(request)
    if (!tokens) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const workoutData: WorkoutFormData = body

    // Validate workout data
    const errors = validateWorkout(workoutData)
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    // Initialize Google Sheets client
    const client = new GoogleSheetsClient(googleAuth)
    await client.initialize(tokens)

    const service = new WorkoutsService(client)

    // Create workout
    const workout = await service.createWorkout(workoutData)

    return NextResponse.json(
      { success: true, data: workout },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating workout:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create workout' },
      { status: 500 }
    )
  }
}
