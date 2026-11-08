'use client'

import React from 'react'
import { Session } from '@/types/session'
import { BodyMetric } from '@/types/body-metrics'
import { StatCard } from './StatCard'
import { MuscleLoadProgression } from '@/lib/metrics/muscle-progression'
import { PRIORITY_MUSCLES } from '@/lib/metrics/weekly-volume'
import { parseISO, differenceInDays } from 'date-fns'

interface ProgressionCardsProps {
  sessions: Session[]
  bodyMetric: BodyMetric | null
  bodyMetrics: BodyMetric[]
  sessionLoadData: any[]
  weeklyVolumeData: any[]
  priorityProgressions: MuscleLoadProgression[]
}

export function ProgressionCards({
  sessions,
  bodyMetric,
  bodyMetrics,
  sessionLoadData,
  weeklyVolumeData,
  priorityProgressions,
}: ProgressionCardsProps) {
  // 1. Bodyweight with change: vs ~4 weeks ago, falling back to the earliest entry
  const currentBodyweight = bodyMetric?.bodyweight
  const withWeight = bodyMetrics
    .filter(m => m.bodyweight !== undefined && m.date)
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
  let bwReference: BodyMetric | undefined
  let bwLabel = '4wk'
  if (bodyMetric?.date) {
    bwReference = [...withWeight]
      .reverse()
      .find(m => differenceInDays(parseISO(bodyMetric.date), parseISO(m.date)) >= 28)
    if (!bwReference && withWeight.length > 1 && withWeight[0].date !== bodyMetric.date) {
      bwReference = withWeight[0]
      bwLabel = 'since start'
    }
  }
  const bodyweightChange =
    currentBodyweight !== undefined && bwReference?.bodyweight !== undefined
      ? currentBodyweight - bwReference.bodyweight
      : null

  // 2. Training load 4-week average with trend
  const recentLoads = sessionLoadData.slice(-4)
  const avgLoad = recentLoads.length > 0
    ? Math.round(recentLoads.reduce((sum, d) => sum + d.sessionLoad, 0) / recentLoads.length)
    : null
  const previousLoads = sessionLoadData.slice(-8, -4)
  const prevAvgLoad = previousLoads.length > 0
    ? Math.round(previousLoads.reduce((sum, d) => sum + d.sessionLoad, 0) / previousLoads.length)
    : null
  const loadTrend = avgLoad && prevAvgLoad ? Math.round(((avgLoad - prevAvgLoad) / prevAvgLoad) * 100) : null

  // 3. Priority muscles on target (latest week with data; absent muscle = 0 sets = not on target)
  const latestWeek = [...weeklyVolumeData].reverse().find(w => w.muscles.length > 0)
  const onTarget = PRIORITY_MUSCLES.filter(muscle => {
    const m = latestWeek?.muscles.find((x: any) => x.muscle === muscle)
    return m?.threshold === 'optimal'
  }).length

  // 4. Priority muscle load change (avg of per-muscle averages)
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
  const change4wk = avg(
    priorityProgressions.map(p => p.avgChange4wk).filter((v): v is number => v !== null)
  )
  const changeStart = avg(
    priorityProgressions.map(p => p.avgChangeSinceStart).filter((v): v is number => v !== null)
  )
  const loadChange = change4wk ?? changeStart
  const loadChangeLabel = change4wk !== null ? 'last 4 wks' : 'since start'

  // 5. Consistency (sessions per week average)
  const weeksSessions = new Map<number, number>()
  sessions.forEach(s => {
    weeksSessions.set(s.week, (weeksSessions.get(s.week) || 0) + 1)
  })
  const avgSessionsPerWeek = weeksSessions.size > 0
    ? (sessions.length / weeksSessions.size).toFixed(1)
    : '--'

  // 6. Adherence streak (consecutive most-recent weeks with 3+ sessions)
  const sortedWeeks = Array.from(weeksSessions.entries()).sort((a, b) => b[0] - a[0])
  let streak = 0
  for (const [, count] of sortedWeeks) {
    if (count >= 3) streak++
    else break
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        value={currentBodyweight !== undefined ? `${currentBodyweight}kg` : '--'}
        label="Bodyweight"
        subtitle={bodyweightChange !== null ? `${bodyweightChange > 0 ? '+' : ''}${bodyweightChange.toFixed(1)}kg (${bwLabel})` : undefined}
        color={bodyweightChange === null ? 'gray' : bodyweightChange > 0 ? 'amber' : bodyweightChange < 0 ? 'green' : 'gray'}
      />
      <StatCard
        value={avgLoad !== null ? avgLoad.toString() : '--'}
        label="Avg Training Load"
        subtitle={loadTrend !== null ? `${loadTrend > 0 ? '↗' : loadTrend < 0 ? '↘' : '→'} ${loadTrend > 0 ? '+' : ''}${loadTrend}%` : '4-week avg'}
        color={loadTrend === null ? 'gray' : loadTrend > 0 ? 'green' : loadTrend < 0 ? 'pink' : 'gray'}
      />
      <StatCard
        value={latestWeek ? `${onTarget}/${PRIORITY_MUSCLES.length}` : '--'}
        label="Priority Muscles On Target"
        subtitle={latestWeek ? `Week ${latestWeek.week} · 10–20 sets` : undefined}
        color={!latestWeek ? 'gray' : onTarget === PRIORITY_MUSCLES.length ? 'green' : onTarget >= 2 ? 'amber' : 'pink'}
      />
      <StatCard
        value={loadChange !== null ? `${loadChange > 0 ? '+' : ''}${loadChange.toFixed(1)}%` : '--'}
        label="Priority Muscle Load"
        subtitle={loadChange !== null ? loadChangeLabel : undefined}
        color={loadChange === null ? 'gray' : loadChange > 0 ? 'green' : loadChange < 0 ? 'pink' : 'gray'}
      />
      <StatCard
        value={avgSessionsPerWeek}
        label="Consistency"
        subtitle="sessions/week"
        color="cyan"
      />
      <StatCard
        value={streak > 0 ? `${streak} wk${streak > 1 ? 's' : ''}` : '--'}
        label="Adherence Streak"
        subtitle="3+ sessions/wk"
        color={streak >= 4 ? 'green' : streak >= 2 ? 'cyan' : 'gray'}
      />
    </div>
  )
}
