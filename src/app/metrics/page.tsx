'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Navigation } from '@/components/layout/Navigation'
import { Container } from '@/components/layout/Container'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { SessionLoadChart } from '@/components/metrics/SessionLoadChart'
import { WeeklyVolumeChart } from '@/components/metrics/WeeklyVolumeChart'
import { ProgressionChart } from '@/components/metrics/ProgressionChart'
import { Session } from '@/types/session'
import { Workout } from '@/types/workout'
import { BodyMetric } from '@/types/body-metrics'
import { calculateAllSessionLoads, calculateRollingAverage, calculateSessionLoadTrend } from '@/lib/metrics/session-load'
import { calculateWeeklyVolume, DEFAULT_GOAL_MUSCLES } from '@/lib/metrics/weekly-volume'
import { getAnchorLifts } from '@/lib/metrics/progression'

export default function MetricsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [bodyMetric, setBodyMetric] = useState<BodyMetric | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnchorLift, setSelectedAnchorLift] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch sessions, workouts, and body metrics in parallel
      const [sessionsRes, workoutsRes, bodyMetricsRes] = await Promise.all([
        fetch('/api/sheets/sessions'),
        fetch('/api/sheets/workouts'),
        fetch('/api/sheets/body-metrics/latest'),
      ])

      const [sessionsData, workoutsData, bodyMetricsData] = await Promise.all([
        sessionsRes.json(),
        workoutsRes.json(),
        bodyMetricsRes.json(),
      ])

      if (sessionsData.success) {
        setSessions(sessionsData.data || [])
      }

      if (workoutsData.success) {
        setWorkouts(workoutsData.data || [])
      }

      if (bodyMetricsData.success && bodyMetricsData.data) {
        setBodyMetric(bodyMetricsData.data)
      }

      if (!sessionsData.success || !workoutsData.success) {
        setError('Failed to load some data')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Calculate session load data
  const sessionLoadData = calculateAllSessionLoads(sessions)
  const sessionLoadWithAvg = calculateRollingAverage(sessionLoadData, 4)
  const trend = calculateSessionLoadTrend(sessionLoadData, 4)

  // Calculate weekly volume data
  const weeklyVolumeData = calculateWeeklyVolume(workouts, DEFAULT_GOAL_MUSCLES)

  // Calculate anchor lift progressions
  const anchorLifts = getAnchorLifts(workouts, bodyMetric?.bodyweight)

  // Auto-select first anchor lift if none selected
  if (anchorLifts.length > 0 && !selectedAnchorLift) {
    setSelectedAnchorLift(anchorLifts[0].exercise)
  }

  // Get currently selected progression
  const selectedProgression = anchorLifts.find(lift => lift.exercise === selectedAnchorLift)

  return (
    <div className="min-h-[100dvh] flex flex-col pb-20">
      <Header title="Training Metrics" />
      <Container className="flex-1 py-4 space-y-4">

        {/* Debug Info */}
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Debug Info</h3>
          <div className="text-xs space-y-1">
            <p className="text-text-secondary">Total workouts: {workouts.length}</p>
            <p className="text-text-secondary">Done workouts: {workouts.filter(w => w.done).length}</p>
            <p className="text-text-secondary">Strength/Core workouts: {workouts.filter(w => w.section === 'Strength' || w.section === 'Core').length}</p>
            <p className="text-text-secondary">Done Strength/Core: {workouts.filter(w => (w.section === 'Strength' || w.section === 'Core') && w.done).length}</p>
            <p className="text-text-secondary">Unique sections: {[...new Set(workouts.map(w => w.section))].join(', ')}</p>
            <p className="text-text-secondary">Unique muscles: {[...new Set(workouts.map(w => w.muscleGroup).filter(Boolean))].join(', ')}</p>
            <p className="text-text-secondary">Unique exercises: {[...new Set(workouts.map(w => w.exercise))].length}</p>
            <p className="text-text-secondary">Exercise frequencies: {
              Object.entries(
                workouts.reduce((acc, w) => {
                  const weeks = new Set(workouts.filter(wo => wo.exercise === w.exercise).map(wo => wo.week))
                  acc[w.exercise] = weeks.size
                  return acc
                }, {} as Record<string, number>)
              ).slice(0, 5).map(([ex, count]) => `${ex}=${count}`).join(', ')
            }</p>
            <p className="text-text-secondary">Bodyweight: {bodyMetric?.bodyweight ?? 'not set'} kg</p>
            <p className="text-text-secondary mt-2 font-semibold">Anchor Lift Details:</p>
            {anchorLifts.slice(0, 3).map(lift => {
              const sampleLoads = lift.sessions.slice(0, 3).map(s => {
                const workout = workouts.find(w => w.exercise === lift.exercise && w.week === s.week && w.day === s.day)
                return workout?.load || 'empty'
              })
              return (
                <div key={lift.exercise} className="text-text-secondary ml-2">
                  <p className="text-xs">
                    {lift.exercise}: {lift.sessions.length} sessions, {lift.sessions.filter(s => s.parsedLoad?.parseSuccess).length} with valid load, {lift.sessions.filter(s => s.topSetReps !== null).length} with reps
                  </p>
                  <p className="text-xs ml-2 text-accent-amber">Sample loads: {sampleLoads.join(', ')}</p>
                  <p className="text-xs ml-2 text-accent-cyan">
                    Valid for chart: {lift.sessions.filter(s => s.parsedLoad?.parseSuccess && s.topSetReps !== null).length}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-xl font-bold text-text-primary mb-4">
            New Metrics System (In Progress)
          </h2>
          <p className="text-text-secondary text-sm mb-4">
            This is a temporary page for building the new training metrics system.
            Your original Stats page remains unchanged.
          </p>

          <div className="space-y-3 text-sm">
            <div className="p-3 border border-accent-green/30 rounded">
              <h3 className="font-semibold text-text-primary mb-2">✅ Step 1 Complete</h3>
              <ul className="text-text-secondary space-y-1">
                <li>• Workouts↔Sessions join helper</li>
                <li>• Data integrity checks</li>
                <li>• RPE prompt in Session Summary</li>
              </ul>
            </div>

            <div className="p-3 border border-accent-cyan/30 rounded">
              <h3 className="font-semibold text-text-primary mb-2">⏳ Coming Next</h3>
              <ul className="text-text-secondary space-y-1">
                <li>• Session Load metric (RPE × Duration)</li>
                <li>• Weekly Volume by Muscle</li>
                <li>• Anchor Lift Progression</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Session Load Metric */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Session Load</h2>
              <p className="text-sm text-text-tertiary">RPE × Duration (minutes)</p>
            </div>
            {trend && (
              <div className="text-right">
                <p className="text-sm text-text-tertiary">4-Session Trend</p>
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

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : (
            <SessionLoadChart data={sessionLoadWithAvg} />
          )}
        </Card>

        {/* Weekly Volume by Muscle */}
        <Card padding="lg">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-text-primary">Weekly Volume by Muscle</h2>
            <p className="text-sm text-text-tertiary">Working sets (Strength + Core exercises marked Done)</p>
            <p className="text-xs text-text-tertiary mt-1">
              Goal muscles: {DEFAULT_GOAL_MUSCLES.join(', ')}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : (
            <WeeklyVolumeChart data={weeklyVolumeData} />
          )}
        </Card>

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

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : anchorLifts.length === 0 ? (
            <p className="text-text-tertiary text-sm">
              No anchor lifts found. Complete more Strength/Core workouts to track progression.
            </p>
          ) : selectedProgression ? (
            <ProgressionChart progression={selectedProgression} />
          ) : null}
        </Card>

      </Container>
      <Navigation />
    </div>
  )
}
