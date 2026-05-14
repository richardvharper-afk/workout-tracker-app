'use client'

import React from 'react'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ExerciseProgression } from '@/lib/metrics/progression'

interface ProgressionChartProps {
  progression: ExerciseProgression
}

export function ProgressionChart({ progression }: ProgressionChartProps) {
  const { exercise, sessions, progressionStatus, stagnantSessions } = progression

  // Filter sessions with valid load data
  const chartData = sessions
    .filter(s => s.parsedLoad?.parseSuccess && s.topSetReps !== null)
    .map(s => ({
      label: `W${s.week}`,
      week: s.week,
      load: s.parsedLoad!.value,
      reps: s.topSetReps,
      rir: s.actualRIR,
      isBWRelative: s.parsedLoad!.isBWRelative,
    }))

  if (chartData.length === 0) {
    return (
      <div className="p-4 border border-glass-border rounded">
        <h3 className="font-semibold text-text-primary mb-2">{exercise}</h3>
        <p className="text-text-tertiary text-sm">
          Insufficient data - need parseable load values to track progression
        </p>
      </div>
    )
  }

  const hasBWRelative = chartData.some(d => d.isBWRelative)

  return (
    <div className="p-4 border border-glass-border rounded">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-text-primary">{exercise}</h3>
          <p className="text-xs text-text-tertiary">
            {progression.weekCount} weeks • {sessions.length} sessions
          </p>
          {hasBWRelative && (
            <p className="text-xs text-accent-amber mt-1">
              ⓘ BW-relative estimate
            </p>
          )}
        </div>
        <div className="text-right">
          <span className={`text-xs font-semibold px-2 py-1 rounded ${
            progressionStatus === 'progressing' ? 'bg-accent-green/20 text-accent-green' :
            progressionStatus === 'stagnant' ? 'bg-accent-amber/20 text-accent-amber' :
            progressionStatus === 'regressing' ? 'bg-red-400/20 text-red-400' :
            'bg-glass-bg text-text-tertiary'
          }`}>
            {progressionStatus === 'progressing' && '↗ Progressing'}
            {progressionStatus === 'stagnant' && `⚠ Stagnant (${stagnantSessions} sessions)`}
            {progressionStatus === 'regressing' && '↘ Regressing'}
            {progressionStatus === 'insufficient-data' && 'Insufficient data'}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="label"
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '11px' }}
          />
          <YAxis
            yAxisId="left"
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '11px' }}
            label={{ value: 'Load (kg)', angle: -90, position: 'insideLeft', style: { fill: 'rgba(255,255,255,0.5)', fontSize: '11px' } }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '11px' }}
            label={{ value: 'Reps', angle: 90, position: 'insideRight', style: { fill: 'rgba(255,255,255,0.5)', fontSize: '11px' } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(20, 20, 30, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
            }}
            formatter={(value: any, name: string) => {
              if (name === 'load') return [`${value} kg`, 'Load']
              if (name === 'reps') return [value, 'Top Set Reps']
              return [value, name]
            }}
            labelFormatter={(label) => `Session: ${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            iconType="line"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="load"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={{ fill: '#22d3ee', r: 4 }}
            name="Load"
          />
          <Bar
            yAxisId="right"
            dataKey="reps"
            fill="#a78bfa"
            opacity={0.7}
            name="Top Set Reps"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-3 text-xs">
        <p className="text-text-primary">
          <span className="font-semibold">Progression rule:</span> More load at same reps/RIR, OR same load at more reps/same RIR
        </p>
        {progressionStatus === 'stagnant' && (
          <p className="text-accent-amber mt-1">
            ⚠ No progress in {stagnantSessions}+ consecutive sessions
          </p>
        )}
      </div>
    </div>
  )
}
