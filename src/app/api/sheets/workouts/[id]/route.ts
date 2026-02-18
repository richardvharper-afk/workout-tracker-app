import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/utils/auth'
import { GoogleSheetsClient } from '@/lib/google-sheets/client'
import { WorkoutsService } from '@/lib/google-sheets/workouts'
import { googleAuth } from '@/lib/google-sheets/auth'
import { validateWorkout } from '@/lib/google-sheets/mapper'

/**
 * GET /api/sheets/workouts/[id]
 * Fetch a single workout by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const tokens = requireAuth(request)
    if (!tokens) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Initialize Google Sheets client
    const client = new GoogleSheetsClient(googleAuth)
    await client.initialize(tokens)

    const service = new WorkoutsService(client)

    // Fetch workout
    const workout = await service.getWorkout(id)

    if (!workout) {
      return NextResponse.json(
        { success: false, error: 'Workout not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: workout,
    })
  } catch (error: any) {
    console.error('Error fetching workout:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch workout' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/sheets/workouts/[id]
 * Update an existing workout
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const tokens = requireAuth(request)
    if (!tokens) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Parse request body
    const body = await request.json()

    // Only run full validation if this is a full workout update (has exercise field)
    // Skip validation for partial/performance updates (set1-5, load, done, etc.)
    if (body.exercise !== undefined) {
      const errors = validateWorkout(body)
      if (errors.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: errors },
          { status: 400 }
        )
      }
    }

    // Initialize Google Sheets client
    const client = new GoogleSheetsClient(googleAuth)
    await client.initialize(tokens)

    const service = new WorkoutsService(client)

    // Update workout
    const workout = await service.updateWorkout(id, body)

    return NextResponse.json({
      success: true,
      data: workout,
    })
  } catch (error: any) {
    console.error('Error updating workout:', error)

    // Handle not found errors
    if (error.message === 'Workout not found') {
      return NextResponse.json(
        { success: false, error: 'Workout not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update workout' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sheets/workouts/[id]
 * Delete a workout
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const tokens = requireAuth(request)
    if (!tokens) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Initialize Google Sheets client
    const client = new GoogleSheetsClient(googleAuth)
    await client.initialize(tokens)

    const service = new WorkoutsService(client)

    // Delete workout
    await service.deleteWorkout(id)

    return NextResponse.json({
      success: true,
      message: 'Workout deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting workout:', error)

    // Handle not found errors
    if (error.message === 'Workout not found') {
      return NextResponse.json(
        { success: false, error: 'Workout not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete workout' },
      { status: 500 }
    )
  }
}
