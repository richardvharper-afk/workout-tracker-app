'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { ExerciseProgressData } from '@/lib/utils/stats'

const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

interface ExerciseProgressChartProps {
  data: ExerciseProgressData[]
}

export function ExerciseProgressChart({ data }: ExerciseProgressChartProps) {
  const [selectedExercise, setSelectedExercise] = useState(data[0]?.exercise || '')

  const exerciseData = data.find(d => d.exercise === selectedExercise)

  const chartData = exerciseData?.weeks.map(w => ({
    week: w.week,
    load: parseFloat(w.load) || 0,
    reps: w.reps,
  })) || []

  if (data.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Exercise Progress</h3>
        <p className="text-text-tertiary text-sm text-center py-8">
          Complete workouts to track exercise progress
        </p>
      </div>
    )
  }

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Exercise Progress</h3>

      <select
        value={selectedExercise}
        onChange={(e) => setSelectedExercise(e.target.value)}
        className="input mb-4 text-sm"
      >
        {data.map(d => (
          <option key={d.exercise} value={d.exercise}>
            {d.exercise}
          </option>
        ))}
      </select>

      {chartData.length > 0 ? (
        <div className="h-48">
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
              <Line
                type="monotone"
                dataKey="load"
                stroke="#00d4ff"
                strokeWidth={2}
                dot={{ fill: '#00d4ff', r: 3 }}
                name="Load"
              />
              <Line
                type="monotone"
                dataKey="reps"
                stroke="#7b61ff"
                strokeWidth={2}
                dot={{ fill: '#7b61ff', r: 3 }}
                name="Reps"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-text-tertiary text-sm text-center py-8">
          No data for this exercise yet
        </p>
      )}
    </div>
  )
}
