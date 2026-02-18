'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { WeeklyVolumeData } from '@/lib/utils/stats'

const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

interface VolumeChartProps {
  data: WeeklyVolumeData[]
}

type MetricKey = 'sets' | 'reps' | 'volume'

export function VolumeChart({ data }: VolumeChartProps) {
  const [metric, setMetric] = useState<MetricKey>('volume')

  const metrics: { key: MetricKey; label: string }[] = [
    { key: 'sets', label: 'Sets' },
    { key: 'reps', label: 'Reps' },
    { key: 'volume', label: 'Volume' },
  ]

  if (data.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Weekly Volume</h3>
        <p className="text-text-tertiary text-sm text-center py-8">
          Complete workouts to see volume trends
        </p>
      </div>
    )
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Weekly Volume</h3>
        <div className="flex gap-1">
          {metrics.map(m => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                metric === m.key
                  ? 'bg-accent-cyan/20 text-accent-cyan'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#7b61ff" stopOpacity={0.05} />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey={metric}
              stroke="#00d4ff"
              fill="url(#volumeGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
