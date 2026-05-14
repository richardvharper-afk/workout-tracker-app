'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { WeeklyVolume, getThresholdColor, getThresholdLabel } from '@/lib/metrics/weekly-volume'

interface WeeklyVolumeChartProps {
  data: WeeklyVolume[]
}

// Color palette for muscles (cycling through these)
const MUSCLE_COLORS = [
  '#22d3ee', // cyan
  '#a78bfa', // purple
  '#fb923c', // orange
  '#10b981', // green
  '#f472b6', // pink
  '#facc15', // yellow
  '#60a5fa', // blue
  '#f87171', // red
]

export function WeeklyVolumeChart({ data }: WeeklyVolumeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-tertiary">
        No workout data available. Complete workouts to see volume trends.
      </div>
    )
  }

  // Get goal muscles (those that appear in any week as isGoalMuscle=true)
  const goalMuscles = Array.from(
    new Set(data.flatMap(w => w.muscles.filter(m => m.isGoalMuscle).map(m => m.muscle)))
  ).sort()

  // Format data for stacked bar chart, grouping non-goal muscles as "Other"
  const chartData = data.map(wv => {
    const dataPoint: any = {
      week: `W${wv.week}`,
      weekNum: wv.week,
    }

    let otherSets = 0

    wv.muscles.forEach(m => {
      if (m.isGoalMuscle) {
        dataPoint[m.muscle] = m.sets
      } else {
        otherSets += m.sets
      }
    })

    if (otherSets > 0) {
      dataPoint['Other'] = otherSets
    }

    return dataPoint
  })

  // Display muscles: goal muscles + "Other"
  const displayMuscles = [...goalMuscles, 'Other']

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="week"
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
            label={{ value: 'Working Sets', angle: -90, position: 'insideLeft', style: { fill: 'rgba(255,255,255,0.5)' } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(20, 20, 30, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: any, name: any) => [value, name]}
            labelFormatter={(label) => `Week: ${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            iconType="square"
          />
          {displayMuscles.map((muscle, index) => (
            <Bar
              key={muscle}
              dataKey={muscle}
              stackId="a"
              fill={muscle === 'Other' ? '#6b7280' : MUSCLE_COLORS[index % MUSCLE_COLORS.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Threshold Guide */}
      <div className="mt-4 p-3 bg-glass-bg/30 rounded text-xs">
        <h4 className="font-semibold text-text-secondary mb-2">Volume Thresholds (Goal Muscles Only):</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getThresholdColor('under') }}></div>
            <span className="text-text-tertiary">{getThresholdLabel('under')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getThresholdColor('optimal') }}></div>
            <span className="text-text-tertiary">{getThresholdLabel('optimal')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getThresholdColor('high') }}></div>
            <span className="text-text-tertiary">{getThresholdLabel('high')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getThresholdColor('very-high') }}></div>
            <span className="text-text-tertiary">{getThresholdLabel('very-high')}</span>
          </div>
        </div>
      </div>

      {/* Current Week Summary - Goal Muscles Only */}
      {data.length > 0 && (
        <div className="mt-4 p-3 border border-accent-cyan/30 rounded">
          <h4 className="font-semibold text-text-primary mb-2">Week {data[data.length - 1].week} Summary (Goal Muscles):</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {data[data.length - 1].muscles.filter(m => m.isGoalMuscle).map(m => (
              <div key={m.muscle} className="flex justify-between">
                <span className="text-text-secondary">{m.muscle}:</span>
                <span className={`font-semibold ${
                  m.threshold === 'under' ? 'text-accent-amber' :
                  m.threshold === 'optimal' ? 'text-accent-green' :
                  m.threshold === 'high' ? 'text-accent-amber' :
                  m.threshold === 'very-high' ? 'text-red-400' :
                  'text-text-tertiary'
                }`}>
                  {m.sets} sets
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
