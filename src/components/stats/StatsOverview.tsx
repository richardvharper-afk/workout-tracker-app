'use client'

import React, { useState } from 'react'
import { Workout } from '@/types/workout'
import { Session } from '@/types/session'
import { BodyMetric } from '@/types/body-metrics'
import { MuscleHeatmap } from './MuscleHeatmap'
import { ProgressionCards } from './ProgressionCards'
import { Card } from '@/components/ui/Card'
import { SessionLoadChart } from '@/components/metrics/SessionLoadChart'
import { WeeklyVolumeChart } from '@/components/metrics/WeeklyVolumeChart'
import { CalorieEfficiencyChart } from '@/components/metrics/CalorieEfficiencyChart'
import { ProgressionChart } from '@/components/metrics/ProgressionChart'
import { calculateAllSessionLoads, calculateRollingAverage, calculateSessionLoadTrend } from '@/lib/metrics/session-load'
import { calculateWeeklyVolume, DEFAULT_GOAL_MUSCLES } from '@/lib/metrics/weekly-volume'
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

  // Auto-select first anchor lift if none selected
  if (anchorLifts.length > 0 && !selectedAnchorLift) {
    setSelectedAnchorLift(anchorLifts[0].exercise)
  }

  const selectedProgression = anchorLifts.find(lift => lift.exercise === selectedAnchorLift)

  return (
    <div className="space-y-4">
      {/* Progression Cards */}
      <ProgressionCards
        workouts={workouts}
        sessions={sessions}
        bodyMetric={bodyMetric}
        bodyMetrics={bodyMetrics}
        sessionLoadData={sessionLoadData}
        weeklyVolumeData={weeklyVolumeData}
        anchorLifts={anchorLifts}
      />

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

      {/* Weekly Volume by Muscle */}
      <Card padding="lg">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-text-primary">Weekly Volume by Muscle</h2>
          <p className="text-sm text-text-tertiary">Working sets (Strength + Core exercises marked Done)</p>
        </div>
        <WeeklyVolumeChart data={weeklyVolumeData} />
      </Card>

      {/* Calorie Efficiency */}
      <Card padding="lg">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-text-primary">Calorie Efficiency</h2>
          <p className="text-sm text-text-tertiary">Session intensity: calories burned per minute</p>
        </div>
        <CalorieEfficiencyChart sessions={sessions} />
      </Card>

      {/* Muscle heatmap */}
      <MuscleHeatmap workouts={workouts} />

      {/* Anchor Lift Progression */}
      <Card padding="lg">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-text-primary">Anchor Lift Progression</h2>
          <p className="text-sm text-text-tertiary mb-3">
            Strength & Core exercises appearing in 8+ weeks ({anchorLifts.length} found)
          </p>

          {anchorLifts.length > 0 && (
            <select
              value={selectedAnchorLift || ''}
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
    </div>
  )
}
