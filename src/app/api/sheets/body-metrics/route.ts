import { NextRequest, NextResponse } from 'next/server'
import { BodyMetricsService } from '@/lib/google-sheets/body-metrics'
import { requireAuth } from '@/lib/utils/auth'
import { BodyMetricFormData } from '@/types/body-metrics'
import { parseISO } from 'date-fns'

/**
 * GET /api/sheets/body-metrics
 * Fetch all body metrics entries
 */
export async function GET(request: NextRequest) {
  try {
    const tokens = await requireAuth(request)
    const service = new BodyMetricsService()
    await service.initialize(tokens)

    const metrics = await service.getAllMetrics()

    return NextResponse.json({
      success: true,
      data: metrics,
    })
  } catch (error: any) {
    console.error('GET /api/sheets/body-metrics error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch body metrics' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

/**
 * POST /api/sheets/body-metrics
 * Create or update body metrics for today
 */
export async function POST(request: NextRequest) {
  try {
    const tokens = await requireAuth(request)
    const body = await request.json()
    const formData = body as BodyMetricFormData & { programStartDate?: string }

    // Default program start date to first week of current year if not provided
    const programStartDate = formData.programStartDate
      ? parseISO(formData.programStartDate)
      : new Date(new Date().getFullYear(), 0, 1) // Jan 1 of current year

    const service = new BodyMetricsService()
    await service.initialize(tokens)

    const metric = await service.saveMetrics(formData, programStartDate)

    return NextResponse.json({
      success: true,
      data: metric,
    })
  } catch (error: any) {
    console.error('POST /api/sheets/body-metrics error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save body metrics' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
