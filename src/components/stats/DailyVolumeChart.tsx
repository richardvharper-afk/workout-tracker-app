'use client'

import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Workout } from '@/types/workout'

const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const Legend = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

const DAY_COLORS = [
  '#00d4ff', // Day 1 - cyan
  '#7b61ff', // Day 2 - purple
  '#00e676', // Day 3 - green
  '#ffab40', // Day 4 - amber
  '#ff5c8a', // Day 5 - pink
  '#40c4ff', // Day 6 - light blue
  '#e040fb', // Day 7 - magenta
]

interface DailyVolumeChartProps {
  workouts: Workout[]
}

export function DailyVolumeChart({ workouts }: DailyVolumeChartProps) {
  const { chartData, days } = useMemo(() => {
    // Get all unique weeks and days, sorted
    const weeks = [...new Set(workouts.map(w => w.week))].sort((a, b) => a - b)
    const days = [...new Set(workouts.map(w => w.day))].sort((a, b) => a - b)

    // Build chart data: one entry per week, with a volume key per day
    const chartData = weeks.map(week => {
      const entry: Record<string, number> = { week }
      days.forEach(day => {
        const dayWorkouts = workouts.filter(
          w => w.week === week && w.day === day && w.lastSaved
        )
        const volume = dayWorkouts.reduce((sum, w) => {
          const reps = w.reps.includes('-')
            ? Math.round((parseInt(w.reps.split('-')[0]) + parseInt(w.reps.split('-')[1])) / 2)
            : parseInt(w.reps) || 0
          return sum + w.sets * reps
        }, 0)
        if (volume > 0) {
          entry[`day${day}`] = volume
        }
      })
      return entry
    })

    // Only include weeks that have at least one day with data
    const filtered = chartData.filter(entry =>
      days.some(d => (entry[`day${d}`] ?? 0) > 0)
    )

    return { chartData: filtered, days }
  }, [workouts])

  if (chartData.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Daily Volume by Week</h3>
        <p className="text-text-tertiary text-sm text-center py-8">
          Complete workouts to see daily volume trends
        </p>
      </div>
    )
  }

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Daily Volume by Week</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="week"
              tickFormatter={(v) => `W${v}`}
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
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(19,19,27,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#e8e8f2',
                fontSize: 12,
              }}
              labelFormatter={(v) => `Week ${v}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
            />
            {days.map((day, i) => (
              <Line
                key={day}
                type="monotone"
                dataKey={`day${day}`}
                name={`Day ${day}`}
                stroke={DAY_COLORS[i % DAY_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
