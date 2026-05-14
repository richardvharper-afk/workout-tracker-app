import { NextRequest, NextResponse } from 'next/server'
import { BodyMetricsService } from '@/lib/google-sheets/body-metrics'
import { requireAuth } from '@/lib/utils/auth'

/**
 * GET /api/sheets/body-metrics/latest
 * Get the most recent body metrics entry
 */
export async function GET(request: NextRequest) {
  try {
    const tokens = await requireAuth(request)
    const service = new BodyMetricsService()
    await service.initialize(tokens)

    const metric = await service.getLatestMetric()

    return NextResponse.json({
      success: true,
      data: metric,
    })
  } catch (error: any) {
    console.error('GET /api/sheets/body-metrics/latest error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch latest body metric' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
