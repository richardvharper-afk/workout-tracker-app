import { GoogleSheetsClient } from './client'
import { GoogleSheetsAuth } from './auth'
import { GoogleAuthTokens, BODY_METRICS_COLUMNS } from '@/types/sheets'
import { BodyMetric, BodyMetricFormData } from '@/types/body-metrics'
import { parseISO, format, startOfWeek, differenceInWeeks } from 'date-fns'

const SHEET_NAME = 'Body Metrics'

/**
 * Convert a sheet row to a BodyMetric object
 */
function mapRowToBodyMetric(row: any[], rowIndex: number): BodyMetric {
  console.log('mapRowToBodyMetric - raw row:', row, 'rowIndex:', rowIndex)

  const parseOptionalNumber = (value: any): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined
    // Handle European decimal format (comma instead of period)
    const normalized = typeof value === 'string' ? value.replace(',', '.') : value
    const num = typeof normalized === 'string' ? parseFloat(normalized) : Number(normalized)
    return isNaN(num) ? undefined : num
  }

  const getString = (value: any): string => {
    if (value === null || value === undefined) return ''
    return String(value)
  }

  const metric = {
    id: rowIndex.toString(),
    week: parseOptionalNumber(row[BODY_METRICS_COLUMNS.WEEK]) || 0,
    date: getString(row[BODY_METRICS_COLUMNS.DATE]),
    bodyweight: parseOptionalNumber(row[BODY_METRICS_COLUMNS.BODYWEIGHT]),
    waist: parseOptionalNumber(row[BODY_METRICS_COLUMNS.WAIST]),
    chest: parseOptionalNumber(row[BODY_METRICS_COLUMNS.CHEST]),
    shoulders: parseOptionalNumber(row[BODY_METRICS_COLUMNS.SHOULDERS]),
    leftBicep: parseOptionalNumber(row[BODY_METRICS_COLUMNS.LEFT_BICEP]),
    rightBicep: parseOptionalNumber(row[BODY_METRICS_COLUMNS.RIGHT_BICEP]),
    hips: parseOptionalNumber(row[BODY_METRICS_COLUMNS.HIPS]),
    notes: getString(row[BODY_METRICS_COLUMNS.NOTES]) || undefined,
  }

  console.log('mapRowToBodyMetric - mapped metric:', metric)
  return metric
}

/**
 * Convert a BodyMetric object to a sheet row
 */
function mapBodyMetricToRow(metric: BodyMetric): any[] {
  const row = new Array(10).fill('')

  const formatOptional = (value: any): string => {
    return value !== undefined && value !== null ? String(value) : ''
  }

  row[BODY_METRICS_COLUMNS.WEEK] = metric.week
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

/**
 * Calculate week number based on date and program start date
 */
function calculateWeekNumber(date: Date, programStartDate: Date): number {
  const weeksDiff = differenceInWeeks(date, programStartDate)
  return weeksDiff + 1 // Week 1 starts at program start
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
    console.log('Body Metrics - raw rows from sheet:', rows)
    return rows.map((row, index) => mapRowToBodyMetric(row, index + 2))
  }

  /**
   * Get the most recent body metric on or before a given date
   */
  async getMetricOnOrBeforeDate(targetDate: Date): Promise<BodyMetric | null> {
    const metrics = await this.getAllMetrics()

    // Filter metrics on or before target date and sort descending
    const validMetrics = metrics
      .filter(m => {
        if (!m.date) return false
        const metricDate = parseISO(m.date)
        return metricDate <= targetDate
      })
      .sort((a, b) => {
        const dateA = parseISO(a.date)
        const dateB = parseISO(b.date)
        return dateB.getTime() - dateA.getTime()
      })

    return validMetrics[0] || null
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
   * Find existing entry for today's date, or return null
   */
  async findEntryForDate(date: Date): Promise<BodyMetric | null> {
    const dateString = format(date, 'yyyy-MM-dd')
    const metrics = await this.getAllMetrics()
    return metrics.find(m => m.date === dateString) || null
  }

  /**
   * Create or update body metrics for today
   */
  async saveMetrics(
    formData: BodyMetricFormData,
    programStartDate: Date
  ): Promise<BodyMetric> {
    const today = new Date()
    const dateString = format(today, 'yyyy-MM-dd')
    const weekNumber = calculateWeekNumber(today, programStartDate)

    // Check if entry exists for today
    const existing = await this.findEntryForDate(today)

    const metric: BodyMetric = {
      id: existing?.id || '',
      week: weekNumber,
      date: dateString,
      bodyweight: formData.bodyweight,
      waist: formData.waist,
      chest: formData.chest,
      shoulders: formData.shoulders,
      leftBicep: formData.leftBicep,
      hips: formData.hips,
      notes: formData.notes,
    }

    const row = mapBodyMetricToRow(metric)

    if (existing) {
      // Update existing row
      await this.client.updateRow(parseInt(existing.id), row)
      metric.id = existing.id
    } else {
      // Append new row
      const newRowIndex = await this.client.appendRow(row)
      metric.id = newRowIndex.toString()
    }

    return metric
  }
}
