'use client'

import React, { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Workout } from '@/types/workout'
import {
  calculateMuscleLoadProgression,
  toChartRows,
  LoadMetric,
  MuscleExerciseProgress,
} from '@/lib/metrics/muscle-progression'
import { PRIORITY_MUSCLES } from '@/lib/metrics/weekly-volume'

interface Props {
  workouts: Workout[]
  bodyweightKg?: number
}

const MORE_MUSCLES = ['triceps', 'core', 'quads', 'hamstrings', 'glutes', 'calves']

const CHART_COLORS = ['#00d4ff', '#7b61ff', '#00ff94', '#ffb800', '#ff3b6d', '#60a5fa', '#f472b6']

const STATUS: Record<MuscleExerciseProgress['status'], { label: string; cls: string }> = {
  progressing: { label: '↗ Progressing', cls: 'bg-accent-green/20 text-accent-green' },
  stagnant: { label: '⚠ Stagnant', cls: 'bg-accent-amber/20 text-accent-amber' },
  regressing: { label: '↘ Regressing', cls: 'bg-accent-pink/20 text-accent-pink' },
  'insufficient-data': { label: 'Not enough data', cls: 'bg-glass-bg text-text-tertiary' },
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function fmtPct(v: number | null): string {
  if (v === null) return '--'
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
}

function pctColor(v: number | null): string {
  if (v === null) return 'text-text-tertiary'
  if (v > 0) return 'text-accent-green'
  if (v < 0) return 'text-accent-pink'
  return 'text-text-secondary'
}

export function MuscleLoadProgressionChart({ workouts, bodyweightKg }: Props) {
  const [muscle, setMuscle] = useState<string>(PRIORITY_MUSCLES[0])
  const [metric, setMetric] = useState<LoadMetric>('load')
  const [showMore, setShowMore] = useState(false)

  const progression = useMemo(
    () => calculateMuscleLoadProgression(workouts, muscle, bodyweightKg, metric),
    [workouts, muscle, bodyweightKg, metric]
  )
  const rows = useMemo(() => toChartRows(progression, metric), [progression, metric])

  const tabs = showMore ? [...PRIORITY_MUSCLES, ...MORE_MUSCLES] : PRIORITY_MUSCLES
  const unit = metric === 'e1rm' ? 'est. 1RM (kg)' : 'top-set load (kg)'

  return (
    <div>
      {/* Muscle tabs */}
      <div className="flex flex-wrap gap-1 mb-3">
        {tabs.map(m => (
          <button
            key={m}
            onClick={() => setMuscle(m)}
            className={`px-3 py-2 min-h-[44px] rounded text-xs font-medium transition-all ${
              muscle === m
                ? 'bg-accent-cyan/20 text-accent-cyan'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {cap(m)}
          </button>
        ))}
        <button
          onClick={() => {
            if (showMore && !PRIORITY_MUSCLES.includes(muscle)) setMuscle(PRIORITY_MUSCLES[0])
            setShowMore(!showMore)
          }}
          className="px-3 py-2 min-h-[44px] rounded text-xs font-medium text-text-tertiary hover:text-text-secondary"
        >
          {showMore ? 'Less' : 'More…'}
        </button>
      </div>

      {/* Metric toggle */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-text-tertiary">Weekly best, {unit}</p>
        <div className="flex gap-1">
          {([['load', 'Load'], ['e1rm', 'Est. 1RM']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                metric === key
                  ? 'bg-accent-cyan/20 text-accent-cyan'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {progression.exercises.length === 0 ? (
        <p className="text-text-tertiary text-sm text-center py-8">
          No loads logged for {muscle} yet. Save a load on completed {muscle} exercises to track progression.
        </p>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="glass-card p-3 text-center">
              <p className={`text-xl font-bold ${pctColor(progression.avgChangeSinceStart)}`}>
                {fmtPct(progression.avgChangeSinceStart)}
              </p>
              <p className="text-xs text-text-tertiary mt-1">Avg change since start</p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className={`text-xl font-bold ${pctColor(progression.avgChange4wk)}`}>
                {fmtPct(progression.avgChange4wk)}
              </p>
              <p className="text-xs text-text-tertiary mt-1">Avg change, last 4 wks</p>
            </div>
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={rows} margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="week"
                tickFormatter={(w) => `W${w}`}
                stroke="#6a6a7f"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#6a6a7f"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={40}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(19,19,27,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#e8e8f2',
                  fontSize: 12,
                }}
                labelFormatter={(w) => `Week ${w}`}
                formatter={(v: any, name: any) => [`${v} kg`, name]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="line" />
              {progression.exercises.map((e, i) => (
                <Line
                  key={e.exercise}
                  type="monotone"
                  dataKey={e.exercise}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {/* Per-exercise breakdown */}
          <div className="mt-4 space-y-2">
            {progression.exercises.map((e, i) => (
              <div
                key={e.exercise}
                className="flex items-center justify-between gap-2 py-2 border-t border-glass-border"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-xs text-text-primary truncate">{e.exercise}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold ${pctColor(e.changeSinceStart)}`}>
                    {fmtPct(e.changeSinceStart)}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS[e.status].cls}`}>
                    {STATUS[e.status].label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {progression.untracked.length > 0 && (
            <p className="text-xs text-text-tertiary mt-3">
              Not tracked (no quantifiable load): {progression.untracked.join(', ')}
            </p>
          )}
        </>
      )}
    </div>
  )
}
