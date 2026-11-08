'use client'

import React, { useState, useMemo } from 'react'
import { Workout } from '@/types/workout'
import { Session } from '@/types/session'
import { BodyMetric } from '@/types/body-metrics'
import { MuscleHeatmap } from './MuscleHeatmap'
import { MuscleLoadProgressionChart } from './MuscleLoadProgressionChart'
import { BodyweightTrendChart } from './BodyweightTrendChart'
import { AlertsCard } from './AlertsCard'
import { RecentPRsCard } from './RecentPRsCard'
import { ProgressionCards } from './ProgressionCards'
import { Card } from '@/components/ui/Card'
import { SessionLoadChart } from '@/components/metrics/SessionLoadChart'
import { WeeklyVolumeChart } from '@/components/metrics/WeeklyVolumeChart'
import { CalorieEfficiencyChart } from '@/components/metrics/CalorieEfficiencyChart'
import { ProgressionChart } from '@/components/metrics/ProgressionChart'
import { calculateAllSessionLoads, calculateRollingAverage, calculateSessionLoadTrend } from '@/lib/metrics/session-load'
import { calculateWeeklyVolume, DEFAULT_GOAL_MUSCLES, PRIORITY_MUSCLES } from '@/lib/metrics/weekly-volume'
import { calculateMuscleLoadProgression } from '@/lib/metrics/muscle-progression'
import { computeAlerts } from '@/lib/metrics/alerts'
import { findPRHistory } from '@/lib/metrics/personal-records'
import { getAnchorLifts } from '@/lib/metrics/progression'

interface StatsOverviewProps {
  workouts: Workout[]
  sessions: Session[]
  bodyMetric: BodyMetric | null
  bodyMetrics: BodyMetric[]
}

export function StatsOverview({ workouts: allWorkouts, sessions, bodyMetric, bodyMetrics }: StatsOverviewProps) {
  const workouts = allWorkouts.filter(w => w.section !== 'Cool-down' && w.section !== 'Warm-up')

  // Calculate metrics data
  const sessionLoadData = calculateAllSessionLoads(sessions)
  const sessionLoadWithAvg = calculateRollingAverage(sessionLoadData, 4)
  const trend = calculateSessionLoadTrend(sessionLoadData, 4)
  const weeklyVolumeData = calculateWeeklyVolume(workouts, DEFAULT_GOAL_MUSCLES)
  const anchorLifts = getAnchorLifts(workouts, bodyMetric?.bodyweight)

  // State for anchor lift selection
  const [selectedAnchorLift, setSelectedAnchorLift] = useState<string | null>(null)

  // Default to the first anchor lift until the user picks one
  const effectiveAnchorLift = selectedAnchorLift ?? anchorLifts[0]?.exercise ?? null
  const selectedProgression = anchorLifts.find(lift => lift.exercise === effectiveAnchorLift)

  // Per-priority-muscle load progression (feeds the summary cards)
  const priorityProgressions = useMemo(
    () => PRIORITY_MUSCLES.map(m => calculateMuscleLoadProgression(workouts, m, bodyMetric?.bodyweight)),
    [workouts, bodyMetric?.bodyweight]
  )

  const alerts = useMemo(
    () => computeAlerts({ workouts, weeklyVolume: weeklyVolumeData, sessionLoads: sessionLoadData, bodyweightKg: bodyMetric?.bodyweight }),
    [workouts, weeklyVolumeData, sessionLoadData, bodyMetric?.bodyweight]
  )
  const prEvents = useMemo(
    () => findPRHistory(workouts, bodyMetric?.bodyweight),
    [workouts, bodyMetric?.bodyweight]
  )

  return (
    <div className="space-y-4">
      {/* Progression Cards */}
      <ProgressionCards
        sessions={sessions}
        bodyMetric={bodyMetric}
        bodyMetrics={bodyMetrics}
        sessionLoadData={sessionLoadData}
        weeklyVolumeData={weeklyVolumeData}
        priorityProgressions={priorityProgressions}
      />

      {/* Alerts (hidden when nothing is triggered) */}
      <AlertsCard alerts={alerts} />

      {/* Weekly Training Load */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Weekly Training Load</h2>
            <p className="text-sm text-text-tertiary">Sum of all sessions (RPE × Duration)</p>
          </div>
          {trend && (
            <div className="text-right">
              <p className="text-sm text-text-tertiary">4-Week Trend</p>
              <p className={`text-lg font-bold ${
                trend.changePercent > 0 ? 'text-accent-green' :
                trend.changePercent < 0 ? 'text-accent-pink' :
                'text-text-secondary'
              }`}>
                {trend.changePercent > 0 ? '+' : ''}{trend.changePercent}%
              </p>
            </div>
          )}
        </div>
        <SessionLoadChart data={sessionLoadWithAvg} />
      </Card>

      {/* Muscle Volume (priority muscles) + heatmap */}
      <Card padding="lg">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-text-primary">Muscle Volume</h2>
          <p className="text-sm text-text-tertiary">
            Working sets per week. Targets apply to priority muscles: chest, shoulders, back, biceps
          </p>
        </div>
        <WeeklyVolumeChart data={weeklyVolumeData} />
        <div className="mt-6 pt-4 border-t border-glass-border">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Muscle Heatmap</h3>
          <MuscleHeatmap workouts={workouts} bare />
        </div>
      </Card>

      {/* Muscle Load Progression */}
      <Card padding="lg">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-text-primary">Muscle Load Progression</h2>
          <p className="text-sm text-text-tertiary">Are your priority muscles getting stronger?</p>
        </div>
        <MuscleLoadProgressionChart workouts={workouts} bodyweightKg={bodyMetric?.bodyweight} />
      </Card>

      {/* Personal Records */}
      <Card padding="lg">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-text-primary">Recent PRs</h2>
          <p className="text-sm text-text-tertiary">New best load, reps at a load, or estimated 1RM</p>
        </div>
        <RecentPRsCard events={prEvents} />
      </Card>

      {/* Bodyweight Trend */}
      <Card padding="lg">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-text-primary">Bodyweight Trend</h2>
        </div>
        <BodyweightTrendChart bodyMetrics={bodyMetrics} />
      </Card>

      {/* Exercise Progression */}
      <Card padding="lg">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-text-primary">Exercise Progression</h2>
          <p className="text-sm text-text-tertiary mb-3">
            Strength & Core exercises appearing in 8+ weeks ({anchorLifts.length} found)
          </p>

          {anchorLifts.length > 0 && (
            <select
              value={effectiveAnchorLift || ''}
              onChange={(e) => setSelectedAnchorLift(e.target.value)}
              className="w-full px-3 py-2 bg-glass-bg border border-glass-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-cyan"
            >
              {anchorLifts.map(lift => (
                <option key={lift.exercise} value={lift.exercise}>
                  {lift.exercise} ({lift.weekCount} weeks)
                </option>
              ))}
            </select>
          )}
        </div>

        {anchorLifts.length === 0 ? (
          <p className="text-text-tertiary text-sm">
            No anchor lifts found. Complete more Strength/Core workouts to track progression.
          </p>
        ) : selectedProgression ? (
          <ProgressionChart progression={selectedProgression} />
        ) : null}
      </Card>
      {/* Calorie Efficiency */}
      <Card padding="lg">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-text-primary">Calorie Efficiency</h2>
          <p className="text-sm text-text-tertiary">Session intensity: calories burned per minute</p>
        </div>
        <CalorieEfficiencyChart sessions={sessions} />
      </Card>
    </div>
  )
}
