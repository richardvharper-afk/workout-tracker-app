import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/utils/auth'
import { GoogleSheetsClient } from '@/lib/google-sheets/client'
import { WorkoutsService, WorkoutMismatchError } from '@/lib/google-sheets/workouts'
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

    // Parse request body. `_expect` identifies the row the client thinks it is
    // editing; it is verified server-side and never written to the sheet.
    const { _expect: expected, ...body } = await request.json()

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
    const workout = await service.updateWorkout(id, body, expected)

    return NextResponse.json({
      success: true,
      data: workout,
    })
  } catch (error: any) {
    console.error('Error updating workout:', error)

    if (error instanceof WorkoutMismatchError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    }

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

    // Optional identity check body: { expect: { week, day, exercise } }
    let expected
    try {
      expected = (await request.json())?.expect
    } catch {
      expected = undefined
    }

    // Initialize Google Sheets client
    const client = new GoogleSheetsClient(googleAuth)
    await client.initialize(tokens)

    const service = new WorkoutsService(client)

    // Verifies the row still holds the expected workout, then deletes it
    await service.deleteWorkout(id, expected)

    return NextResponse.json({
      success: true,
      message: 'Workout deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting workout:', error?.message)

    if (error instanceof WorkoutMismatchError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    }

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
