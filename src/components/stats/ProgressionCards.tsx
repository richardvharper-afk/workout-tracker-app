'use client'

import React from 'react'
import { Workout } from '@/types/workout'
import { Session } from '@/types/session'
import { BodyMetric } from '@/types/body-metrics'
import { StatCard } from './StatCard'
import { ExerciseProgression } from '@/lib/metrics/progression'
import { parseISO, differenceInDays } from 'date-fns'

interface ProgressionCardsProps {
  workouts: Workout[]
  sessions: Session[]
  bodyMetric: BodyMetric | null
  bodyMetrics: BodyMetric[]
  sessionLoadData: any[]
  weeklyVolumeData: any[]
  anchorLifts: ExerciseProgression[]
}

export function ProgressionCards({
  workouts,
  sessions,
  bodyMetric,
  bodyMetrics,
  sessionLoadData,
  weeklyVolumeData,
  anchorLifts,
}: ProgressionCardsProps) {
  // 1. Bodyweight with change (4 weeks ago)
  const currentBodyweight = bodyMetric?.bodyweight
  const fourWeeksAgo = bodyMetric?.date ? bodyMetrics
    .filter(m => m.bodyweight && m.date)
    .filter(m => {
      const daysDiff = differenceInDays(parseISO(bodyMetric.date), parseISO(m.date))
      return daysDiff >= 28
    })
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())[0]
    : null
  const bodyweightChange = currentBodyweight && fourWeeksAgo?.bodyweight
    ? currentBodyweight - fourWeeksAgo.bodyweight
    : null

  // 2. Training Load 4-week average with trend
  const recentLoads = sessionLoadData.slice(-4)
  const avgLoad = recentLoads.length > 0
    ? Math.round(recentLoads.reduce((sum, d) => sum + d.sessionLoad, 0) / recentLoads.length)
    : null
  const previousLoads = sessionLoadData.slice(-8, -4)
  const prevAvgLoad = previousLoads.length > 0
    ? Math.round(previousLoads.reduce((sum, d) => sum + d.sessionLoad, 0) / previousLoads.length)
    : null
  const loadTrend = avgLoad && prevAvgLoad ? Math.round(((avgLoad - prevAvgLoad) / prevAvgLoad) * 100) : null

  // 3. Volume Status (this week)
  const latestWeekWithData = [...weeklyVolumeData].reverse().find(w => w.muscles.length > 0)
  const goalMuscles = latestWeekWithData?.muscles.filter((m: any) => m.isGoalMuscle) || []
  const optimalCount = goalMuscles.filter((m: any) => m.threshold === 'optimal').length
  const underCount = goalMuscles.filter((m: any) => m.threshold === 'under').length
  const highCount = goalMuscles.filter((m: any) => m.threshold === 'high' || m.threshold === 'very-high').length
  const volumeStatus = optimalCount >= underCount && optimalCount >= highCount ? 'Optimal' :
    underCount > 0 ? `${underCount} Under` :
    highCount > 0 ? `${highCount} High` : '--'
  const volumeColor = optimalCount >= underCount && optimalCount >= highCount ? 'green' :
    underCount > 0 ? 'amber' : 'purple'

  // 4. Consistency (sessions per week average)
  const weeksSessions = new Map<number, number>()
  sessions.forEach(s => {
    weeksSessions.set(s.week, (weeksSessions.get(s.week) || 0) + 1)
  })
  const avgSessionsPerWeek = weeksSessions.size > 0
    ? (sessions.length / weeksSessions.size).toFixed(1)
    : '--'

  // 5. Strongest Lift (top anchor lift with most progression)
  const strongestLift = anchorLifts
    .filter(lift => lift.sessions.length >= 2)
    .map(lift => {
      const validSessions = lift.sessions.filter(s => s.parsedLoad?.parseSuccess && s.topSetReps !== null)
      if (validSessions.length < 2) return null

      const firstSession = validSessions[0]
      const lastSession = validSessions[validSessions.length - 1]
      const loadIncrease = lastSession.parsedLoad!.value - firstSession.parsedLoad!.value
      const percentIncrease = (loadIncrease / firstSession.parsedLoad!.value) * 100

      return {
        exercise: lift.exercise,
        percentIncrease: Math.round(percentIncrease),
      }
    })
    .filter(Boolean)
    .sort((a, b) => b!.percentIncrease - a!.percentIncrease)[0]

  // 6. Volume Trend (this week vs 4-week average)
  const thisWeekVolume = latestWeekWithData?.totalSets || 0
  const last4Weeks = weeklyVolumeData.slice(-4)
  const avgVolume = last4Weeks.length > 0
    ? Math.round(last4Weeks.reduce((sum: number, w: any) => sum + w.totalSets, 0) / last4Weeks.length)
    : null
  const volumeTrend = thisWeekVolume && avgVolume ? Math.round(((thisWeekVolume - avgVolume) / avgVolume) * 100) : null

  // 7. Efficiency (this week vs overall average)
  const validSessions = sessions.filter(s => s.duration && s.calories && s.duration > 0)
  const overallAvgEfficiency = validSessions.length > 0
    ? validSessions.reduce((sum, s) => sum + (s.calories! / s.duration!), 0) / validSessions.length
    : null
  const thisWeekSessions = validSessions.filter(s => s.week === latestWeekWithData?.week)
  const thisWeekEfficiency = thisWeekSessions.length > 0
    ? thisWeekSessions.reduce((sum, s) => sum + (s.calories! / s.duration!), 0) / thisWeekSessions.length
    : null
  const efficiencyDiff = thisWeekEfficiency && overallAvgEfficiency
    ? ((thisWeekEfficiency - overallAvgEfficiency) / overallAvgEfficiency) * 100
    : null

  // 8. Adherence streak (consecutive weeks with 3+ sessions)
  const sortedWeeks = Array.from(weeksSessions.entries()).sort((a, b) => b[0] - a[0])
  let streak = 0
  for (const [_, count] of sortedWeeks) {
    if (count >= 3) {
      streak++
    } else {
      break
    }
  }

  return (
    <>
      {/* Row 1: Key Metrics Snapshot */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          value={currentBodyweight ? `${currentBodyweight}kg` : '--'}
          label="Bodyweight"
          subtitle={bodyweightChange !== null ? `${bodyweightChange > 0 ? '+' : ''}${bodyweightChange.toFixed(1)}kg (4wk)` : undefined}
          color={bodyweightChange === null ? 'gray' : bodyweightChange > 0 ? 'amber' : bodyweightChange < 0 ? 'green' : 'gray'}
        />
        <StatCard
          value={avgLoad !== null ? avgLoad.toString() : '--'}
          label="Avg Training Load"
          subtitle={loadTrend !== null ? `${loadTrend > 0 ? '↗' : loadTrend < 0 ? '↘' : '→'} ${loadTrend > 0 ? '+' : ''}${loadTrend}%` : '4-week avg'}
          color={loadTrend === null ? 'gray' : loadTrend > 0 ? 'green' : loadTrend < 0 ? 'pink' : 'gray'}
        />
        <StatCard
          value={volumeStatus}
          label="Volume Status"
          subtitle={latestWeekWithData ? `Week ${latestWeekWithData.week}` : undefined}
          color={volumeColor as any}
        />
        <StatCard
          value={avgSessionsPerWeek}
          label="Consistency"
          subtitle="sessions/week"
          color="cyan"
        />
      </div>

      {/* Row 2: Progression Indicators */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          value={strongestLift ? `+${strongestLift.percentIncrease}%` : '--'}
          label="Strongest Lift"
          subtitle={strongestLift?.exercise}
          color={strongestLift ? 'green' : 'gray'}
        />
        <StatCard
          value={volumeTrend !== null ? `${volumeTrend > 0 ? '+' : ''}${volumeTrend}%` : '--'}
          label="Volume Trend"
          subtitle="vs 4-week avg"
          color={volumeTrend === null ? 'gray' : volumeTrend > 5 ? 'amber' : volumeTrend < -5 ? 'pink' : 'green'}
        />
        <StatCard
          value={efficiencyDiff !== null ? `${efficiencyDiff > 0 ? '+' : ''}${efficiencyDiff.toFixed(0)}%` : '--'}
          label="Efficiency"
          subtitle="vs overall avg"
          color={efficiencyDiff === null ? 'gray' : efficiencyDiff > 0 ? 'green' : 'pink'}
        />
        <StatCard
          value={streak > 0 ? `${streak} wk${streak > 1 ? 's' : ''}` : '--'}
          label="Adherence Streak"
          subtitle="3+ sessions/wk"
          color={streak >= 4 ? 'green' : streak >= 2 ? 'cyan' : 'gray'}
        />
      </div>
    </>
  )
}
