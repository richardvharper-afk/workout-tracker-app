import { Session } from '@/types/session'

export interface SessionLoadData {
  week: number
  day: number
  sessionLoad: number
  rpe: number
  duration: number
  label: string // e.g. "W1.D1"
  date?: string
}

export interface SessionLoadWithAverage extends SessionLoadData {
  rollingAverage?: number
}

/**
 * Calculate session load for a single session
 * Formula: RPE × Duration (minutes)
 */
export function calculateSessionLoad(session: Session): number | null {
  if (session.rpe === undefined || session.duration === undefined) {
    return null
  }
  return session.rpe * session.duration
}

/**
 * Calculate session load for all sessions
 * Returns array sorted by week, day
 */
export function calculateAllSessionLoads(sessions: Session[]): SessionLoadData[] {
  const loads: SessionLoadData[] = []

  sessions.forEach(session => {
    const sessionLoad = calculateSessionLoad(session)

    // Skip sessions with missing RPA or duration
    if (sessionLoad === null) return

    loads.push({
      week: session.week,
      day: session.day,
      sessionLoad,
      rpe: session.rpe!,
      duration: session.duration!,
      label: `W${session.week}.D${session.day}`,
      date: session.date,
    })
  })

  // Sort by week, then day
  return loads.sort((a, b) => (a.week !== b.week ? a.week - b.week : a.day - b.day))
}

/**
 * Calculate 4-session rolling average
 */
export function calculateRollingAverage(
  loads: SessionLoadData[],
  window: number = 4
): SessionLoadWithAverage[] {
  return loads.map((load, index) => {
    // Calculate rolling average for current position
    const start = Math.max(0, index - window + 1)
    const slice = loads.slice(start, index + 1)
    const sum = slice.reduce((acc, l) => acc + l.sessionLoad, 0)
    const avg = sum / slice.length

    return {
      ...load,
      rollingAverage: Math.round(avg),
    }
  })
}

/**
 * Get interpretation for session load value
 */
export function interpretSessionLoad(sessionLoad: number): {
  category: 'low' | 'moderate' | 'hard' | 'very-high'
  label: string
  color: string
} {
  if (sessionLoad < 400) {
    return {
      category: 'low',
      label: 'Light session',
      color: 'text-text-tertiary',
    }
  }
  if (sessionLoad < 600) {
    return {
      category: 'moderate',
      label: 'Moderate working block',
      color: 'text-accent-cyan',
    }
  }
  if (sessionLoad < 800) {
    return {
      category: 'hard',
      label: 'Hard working block',
      color: 'text-accent-green',
    }
  }
  return {
    category: 'very-high',
    label: 'Very high - check recovery',
    color: 'text-accent-amber',
  }
}

/**
 * Calculate trend over last N sessions
 */
export function calculateSessionLoadTrend(
  loads: SessionLoadData[],
  lastN: number = 4
): {
  current: number
  previous: number
  change: number
  changePercent: number
} | null {
  if (loads.length < 2) return null

  const recent = loads.slice(-lastN)
  const beforeRecent = loads.slice(Math.max(0, loads.length - lastN * 2), -lastN)

  if (recent.length === 0 || beforeRecent.length === 0) return null

  const currentAvg = recent.reduce((sum, l) => sum + l.sessionLoad, 0) / recent.length
  const previousAvg = beforeRecent.reduce((sum, l) => sum + l.sessionLoad, 0) / beforeRecent.length

  const change = currentAvg - previousAvg
  const changePercent = Math.round((change / previousAvg) * 100)

  return {
    current: Math.round(currentAvg),
    previous: Math.round(previousAvg),
    change: Math.round(change),
    changePercent,
  }
}
