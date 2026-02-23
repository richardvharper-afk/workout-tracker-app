'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { MuscleVolumeData } from '@/lib/utils/stats'

const RadarChart = dynamic(() => import('recharts').then(m => m.RadarChart), { ssr: false })
const Radar = dynamic(() => import('recharts').then(m => m.Radar), { ssr: false })
const PolarGrid = dynamic(() => import('recharts').then(m => m.PolarGrid), { ssr: false })
const PolarAngleAxis = dynamic(() => import('recharts').then(m => m.PolarAngleAxis), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

interface MuscleBalanceChartProps {
  data: MuscleVolumeData[]
}

export function MuscleBalanceChart({ data }: MuscleBalanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Muscle Balance</h3>
        <p className="text-text-tertiary text-sm text-center py-8">
          Save workouts with muscle group data to see balance
        </p>
      </div>
    )
  }

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Muscle Balance</h3>
      <div className="w-full" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis
              dataKey="muscle"
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
              className="capitalize"
            />
            <Radar
              dataKey="volume"
              stroke="rgb(0, 255, 148)"
              fill="rgb(0, 210, 255)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
