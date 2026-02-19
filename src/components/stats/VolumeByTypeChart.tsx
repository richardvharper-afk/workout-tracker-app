'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { VolumeByTypeWeek } from '@/lib/utils/stats'

const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const Legend = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

const TYPE_COLORS: Record<string, string> = {
  'Upper Body': '#00d4ff',
  'Lower Body': '#7b61ff',
  'Full Body': '#00ff94',
  'Core': '#ffb800',
  'Cardio': '#ff5ca0',
  'Flexibility': '#a78bfa',
  'Rest': '#6a6a7f',
}

interface VolumeByTypeChartProps {
  data: VolumeByTypeWeek[]
  types: string[]
}

export function VolumeByTypeChart({ data, types }: VolumeByTypeChartProps) {
  if (data.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Volume by Type</h3>
        <p className="text-text-tertiary text-sm text-center py-8">
          Save workouts to see volume by type
        </p>
      </div>
    )
  }

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Volume by Type</h3>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
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
              wrapperStyle={{ fontSize: 11, color: '#9a9ab0' }}
            />
            {types.map(type => (
              <Bar
                key={type}
                dataKey={type}
                stackId="volume"
                fill={TYPE_COLORS[type] || '#6a6a7f'}
                radius={types.indexOf(type) === types.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
