import { GoogleSheetsClient } from './client'
import { GoogleSheetsAuth } from './auth'
import { GoogleAuthTokens, BODY_METRICS_COLUMNS } from '@/types/sheets'
import { BodyMetric, BodyMetricFormData } from '@/types/body-metrics'
import { parseDecimal } from '@/lib/utils/number'
import { normaliseDateString } from '@/lib/utils/dates'
import { parseISO, format } from 'date-fns'

const SHEET_NAME = 'Body Metrics'

/**
 * Convert a sheet row to a BodyMetric object
 */
function mapRowToBodyMetric(row: any[], rowIndex: number): BodyMetric {
  const parseOptionalNumber = (value: any): number | undefined => parseDecimal(value)

  const getString = (value: any): string => {
    if (value === null || value === undefined) return ''
    return String(value)
  }

  const metric = {
    id: rowIndex.toString(),
    date: normaliseDateString(row[BODY_METRICS_COLUMNS.DATE]),
    bodyweight: parseOptionalNumber(row[BODY_METRICS_COLUMNS.BODYWEIGHT]),
    waist: parseOptionalNumber(row[BODY_METRICS_COLUMNS.WAIST]),
    chest: parseOptionalNumber(row[BODY_METRICS_COLUMNS.CHEST]),
    shoulders: parseOptionalNumber(row[BODY_METRICS_COLUMNS.SHOULDERS]),
    leftBicep: parseOptionalNumber(row[BODY_METRICS_COLUMNS.LEFT_BICEP]),
    rightBicep: parseOptionalNumber(row[BODY_METRICS_COLUMNS.RIGHT_BICEP]),
    hips: parseOptionalNumber(row[BODY_METRICS_COLUMNS.HIPS]),
    notes: getString(row[BODY_METRICS_COLUMNS.NOTES]) || undefined,
  }

  return metric
}

/**
 * Convert a BodyMetric object to a sheet row
 */
function mapBodyMetricToRow(metric: BodyMetric): any[] {
  const row = new Array(9).fill('')

  // Send real numbers (not strings) so Sheets stores them as numeric values
  // regardless of the spreadsheet locale (en-ZA uses a comma decimal separator).
  const formatOptional = (value: any): number | string => {
    return typeof value === 'number' && !isNaN(value) ? value : ''
  }

  row[BODY_METRICS_COLUMNS.DATE] = metric.date
  row[BODY_METRICS_COLUMNS.BODYWEIGHT] = formatOptional(metric.bodyweight)
  row[BODY_METRICS_COLUMNS.WAIST] = formatOptional(metric.waist)
  row[BODY_METRICS_COLUMNS.CHEST] = formatOptional(metric.chest)
  row[BODY_METRICS_COLUMNS.SHOULDERS] = formatOptional(metric.shoulders)
  row[BODY_METRICS_COLUMNS.LEFT_BICEP] = formatOptional(metric.leftBicep)
  row[BODY_METRICS_COLUMNS.RIGHT_BICEP] = formatOptional(metric.rightBicep)
  row[BODY_METRICS_COLUMNS.HIPS] = formatOptional(metric.hips)
  row[BODY_METRICS_COLUMNS.NOTES] = metric.notes || ''

  return row
}


export class BodyMetricsService {
  private client: GoogleSheetsClient
  private auth: GoogleSheetsAuth

  constructor() {
    this.auth = new GoogleSheetsAuth()
    this.client = new GoogleSheetsClient(this.auth)
  }

  /**
   * Initialize the service with auth tokens
   */
  async initialize(tokens: GoogleAuthTokens): Promise<void> {
    await this.client.initialize(tokens)
  }

  /**
   * Get all body metrics entries
   */
  async getAllMetrics(): Promise<BodyMetric[]> {
    const rows = await this.client.getRows(`${SHEET_NAME}!A2:J`)
    return rows.map((row, index) => mapRowToBodyMetric(row, index + 2))
  }

  /**
   * Get the latest body metric entry with actual data
   */
  async getLatestMetric(): Promise<BodyMetric | null> {
    const metrics = await this.getAllMetrics()
    if (metrics.length === 0) return null

    // Sort by date descending, only include entries with at least bodyweight
    const sorted = metrics
      .filter(m => m.date && m.bodyweight !== undefined)
      .sort((a, b) => {
        const dateA = parseISO(a.date)
        const dateB = parseISO(b.date)
        return dateB.getTime() - dateA.getTime()
      })

    return sorted[0] || null
  }

  /**
   * Create or update body metrics for today
   */
  async saveMetrics(
    formData: BodyMetricFormData,
    _programStartDate?: Date
  ): Promise<BodyMetric> {
    const dateString = format(new Date(), 'yyyy-MM-dd')

    // Single read of the sheet: used to find today's row and the next empty row
    const allMetrics = await this.getAllMetrics()
    const existing = allMetrics.find(m => m.date === dateString) || null

    const metric: BodyMetric = {
      id: existing?.id || '',
      date: dateString,
      bodyweight: formData.bodyweight,
      waist: formData.waist,
      chest: formData.chest,
      shoulders: formData.shoulders,
      leftBicep: formData.leftBicep,
      rightBicep: formData.rightBicep,
      hips: formData.hips,
      notes: formData.notes,
    }

    const row = mapBodyMetricToRow(metric)

    if (existing) {
      await this.client.updateRow(parseInt(existing.id), row, SHEET_NAME)
      metric.id = existing.id
    } else {
      // Header is row 1, so the first data row is 2
      const maxId = allMetrics.length > 0
        ? Math.max(...allMetrics.map(m => parseInt(m.id) || 0))
        : 1
      const newRowIndex = maxId + 1
      await this.client.updateRow(newRowIndex, row, SHEET_NAME)
      metric.id = newRowIndex.toString()
    }

    return metric
  }
}
