'use client'

import React, { useMemo } from 'react'
import { Workout } from '@/types/workout'

interface MuscleHeatmapProps {
  workouts: Workout[]
}

function getVolume(w: Workout): number {
  return [w.set1, w.set2, w.set3, w.set4, w.set5]
    .filter((s): s is number => s !== undefined && s !== null)
    .reduce((a, b) => a + b, 0)
}

// Normalize muscle group names to canonical keys
function normalizeMuscle(raw: string): string {
  const lower = raw.toLowerCase().trim()
  // Map common variations to canonical names
  const aliases: Record<string, string> = {
    'chest': 'chest',
    'pecs': 'chest',
    'pectorals': 'chest',
    'back': 'back',
    'lats': 'back',
    'upper back': 'back',
    'lower back': 'back',
    'traps': 'shoulders',
    'shoulders': 'shoulders',
    'delts': 'shoulders',
    'deltoids': 'shoulders',
    'biceps': 'biceps',
    'bicep': 'biceps',
    'triceps': 'triceps',
    'tricep': 'triceps',
    'arms': 'biceps',
    'forearms': 'forearms',
    'forearm': 'forearms',
    'quads': 'quads',
    'quadriceps': 'quads',
    'hamstrings': 'hamstrings',
    'hamstring': 'hamstrings',
    'hams': 'hamstrings',
    'glutes': 'glutes',
    'glute': 'glutes',
    'core': 'core',
    'abs': 'core',
    'abdominals': 'core',
    'obliques': 'core',
    'calves': 'calves',
    'calf': 'calves',
    'hip flexors': 'hip flexors',
    'hip': 'hip flexors',
    'hips': 'hip flexors',
  }
  return aliases[lower] || lower
}

// Color interpolation from dim to bright green based on intensity ratio
function getHeatColor(ratio: number): string {
  if (ratio === 0) return 'rgba(255,255,255,0.05)'
  // From dark teal to bright green
  const r = Math.round(0 + (0 - 0) * ratio)
  const g = Math.round(80 + (255 - 80) * ratio)
  const b = Math.round(80 + (148 - 80) * ratio)
  const alpha = 0.3 + ratio * 0.7
  return `rgba(${r},${g},${b},${alpha})`
}

// SVG paths for front-view muscle groups (simplified anatomical figure)
const MUSCLE_PATHS: Record<string, { paths: string[]; label: string; labelPos: [number, number] }> = {
  shoulders: {
    paths: [
      // Left shoulder
      'M 58,72 Q 48,68 42,78 Q 40,85 44,92 L 58,88 Z',
      // Right shoulder
      'M 142,72 Q 152,68 158,78 Q 160,85 156,92 L 142,88 Z',
    ],
    label: 'Shoulders',
    labelPos: [100, 65],
  },
  chest: {
    paths: [
      // Left chest
      'M 58,72 L 58,88 Q 60,102 80,105 L 100,106 L 100,72 Z',
      // Right chest
      'M 142,72 L 142,88 Q 140,102 120,105 L 100,106 L 100,72 Z',
    ],
    label: 'Chest',
    labelPos: [100, 90],
  },
  biceps: {
    paths: [
      // Left bicep
      'M 44,92 Q 38,105 36,120 Q 35,130 40,130 L 50,130 Q 54,118 55,105 L 58,88 Z',
      // Right bicep
      'M 156,92 Q 162,105 164,120 Q 165,130 160,130 L 150,130 Q 146,118 145,105 L 142,88 Z',
    ],
    label: 'Biceps',
    labelPos: [30, 110],
  },
  triceps: {
    paths: [
      // Left tricep (back of arm, shown slightly)
      'M 40,130 Q 36,138 35,148 L 44,148 Q 46,138 50,130 Z',
      // Right tricep
      'M 160,130 Q 164,138 165,148 L 156,148 Q 154,138 150,130 Z',
    ],
    label: 'Triceps',
    labelPos: [170, 140],
  },
  forearms: {
    paths: [
      // Left forearm
      'M 35,148 Q 32,165 34,180 L 44,180 Q 46,165 44,148 Z',
      // Right forearm
      'M 165,148 Q 168,165 166,180 L 156,180 Q 154,165 156,148 Z',
    ],
    label: 'Forearms',
    labelPos: [30, 165],
  },
  core: {
    paths: [
      // Abs area
      'M 80,106 Q 78,120 78,140 L 78,158 Q 88,162 100,163 Q 112,162 122,158 L 122,140 Q 122,120 120,106 L 100,106 Z',
    ],
    label: 'Core',
    labelPos: [100, 135],
  },
  quads: {
    paths: [
      // Left quad
      'M 78,158 Q 72,175 70,195 Q 68,215 72,230 L 88,230 Q 92,215 90,195 Q 90,175 88,162 Z',
      // Right quad
      'M 122,158 Q 128,175 130,195 Q 132,215 128,230 L 112,230 Q 108,215 110,195 Q 110,175 112,162 Z',
    ],
    label: 'Quads',
    labelPos: [100, 195],
  },
  hamstrings: {
    paths: [
      // Left hamstring (visible from front as inner thigh)
      'M 88,162 Q 92,175 92,195 Q 92,210 90,225 L 88,230 L 80,230 Q 78,220 80,210 Q 82,195 82,175 Q 82,168 80,160 Z',
      // Right hamstring
      'M 112,162 Q 108,175 108,195 Q 108,210 110,225 L 112,230 L 120,230 Q 122,220 120,210 Q 118,195 118,175 Q 118,168 120,160 Z',
    ],
    label: 'Hamstrings',
    labelPos: [100, 220],
  },
  glutes: {
    paths: [
      // Left glute
      'M 78,150 Q 70,155 68,162 Q 70,170 78,170 L 88,168 Q 85,158 80,152 Z',
      // Right glute
      'M 122,150 Q 130,155 132,162 Q 130,170 122,170 L 112,168 Q 115,158 120,152 Z',
    ],
    label: 'Glutes',
    labelPos: [100, 160],
  },
  calves: {
    paths: [
      // Left calf
      'M 72,232 Q 68,250 70,270 Q 72,285 76,290 L 86,290 Q 88,280 86,265 Q 84,250 88,232 Z',
      // Right calf
      'M 128,232 Q 132,250 130,270 Q 128,285 124,290 L 114,290 Q 112,280 114,265 Q 116,250 112,232 Z',
    ],
    label: 'Calves',
    labelPos: [100, 262],
  },
  back: {
    // Back muscles shown as upper back area visible from front
    paths: [],
    label: 'Back',
    labelPos: [100, 108],
  },
  'hip flexors': {
    paths: [
      // Left hip flexor
      'M 78,150 L 80,160 Q 84,165 88,168 L 88,158 Q 82,152 80,148 Z',
      // Right hip flexor
      'M 122,150 L 120,160 Q 116,165 112,168 L 112,158 Q 118,152 120,148 Z',
    ],
    label: 'Hip Flexors',
    labelPos: [100, 152],
  },
}

export function MuscleHeatmap({ workouts }: MuscleHeatmapProps) {
  const muscleVolumes = useMemo(() => {
    const volumes = new Map<string, number>()
    workouts.forEach(w => {
      if (!w.muscleGroup || !w.lastSaved) return
      const key = normalizeMuscle(w.muscleGroup)
      const vol = getVolume(w)
      volumes.set(key, (volumes.get(key) || 0) + vol)
    })
    return volumes
  }, [workouts])

  const maxMuscleVolume = useMemo(() => {
    let max = 0
    muscleVolumes.forEach(v => { if (v > max) max = v })
    return max
  }, [muscleVolumes])

  // Get sorted list for the legend
  const sortedMuscles = useMemo(() => {
    return Array.from(muscleVolumes.entries())
      .sort((a, b) => b[1] - a[1])
  }, [muscleVolumes])

  if (muscleVolumes.size === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Muscle Heatmap</h3>
        <p className="text-text-tertiary text-sm text-center py-8">
          Save workouts with muscle group data to see the heatmap
        </p>
      </div>
    )
  }

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Muscle Heatmap</h3>

      <div className="flex gap-4">
        {/* SVG Body */}
        <div className="flex-1 flex justify-center">
          <svg viewBox="25 40 150 270" className="w-full max-w-[180px] h-auto">
            {/* Body outline */}
            <path
              d="M 100,42 Q 85,42 82,55 Q 80,65 82,72 L 58,72 Q 48,68 42,78 Q 38,88 36,105 Q 32,130 35,148 Q 32,165 34,180 L 34,185 Q 38,182 44,180 Q 46,165 44,148 Q 46,138 50,130 Q 54,118 55,105 L 58,88 Q 60,102 80,105 L 78,106 Q 76,120 76,140 L 76,158 Q 68,162 65,170 Q 62,180 65,198 Q 66,220 70,230 Q 66,250 68,270 Q 70,288 74,295 L 88,295 Q 90,285 88,270 Q 86,255 88,232 Q 92,215 92,195 Q 92,175 88,162 Q 90,165 100,166 Q 110,165 112,162 Q 108,175 108,195 Q 108,215 112,232 Q 114,255 112,270 Q 110,285 112,295 L 126,295 Q 130,288 132,270 Q 134,250 130,230 Q 134,220 135,198 Q 138,180 135,170 Q 132,162 124,158 L 124,140 Q 124,120 122,106 L 120,105 Q 140,102 142,88 L 145,105 Q 146,118 150,130 Q 154,138 156,148 Q 154,165 156,180 Q 162,182 166,185 L 166,180 Q 168,165 165,148 Q 168,130 164,105 Q 162,88 158,78 Q 152,68 142,72 L 118,72 Q 120,65 118,55 Q 115,42 100,42 Z"
              fill="rgba(255,255,255,0.03)"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="0.8"
            />
            {/* Head */}
            <circle cx="100" cy="52" r="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />

            {/* Muscle group fills */}
            {Object.entries(MUSCLE_PATHS).map(([key, muscle]) => {
              const volume = muscleVolumes.get(key) || 0
              const ratio = maxMuscleVolume > 0 ? volume / maxMuscleVolume : 0
              const color = getHeatColor(ratio)
              return muscle.paths.map((path, i) => (
                <path
                  key={`${key}-${i}`}
                  d={path}
                  fill={color}
                  stroke={volume > 0 ? 'rgba(0,255,148,0.3)' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="0.5"
                />
              ))
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
          {sortedMuscles.map(([muscle, volume]) => {
            const ratio = maxMuscleVolume > 0 ? volume / maxMuscleVolume : 0
            return (
              <div key={muscle} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: getHeatColor(ratio) }}
                />
                <span className="text-[11px] text-text-secondary truncate capitalize">{muscle}</span>
                <span className="text-[10px] text-text-tertiary ml-auto shrink-0">{volume}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Gradient legend */}
      <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-text-tertiary">
        <span>Less</span>
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getHeatColor(0) }} />
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getHeatColor(0.33) }} />
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getHeatColor(0.66) }} />
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getHeatColor(1) }} />
        <span>More</span>
      </div>
    </div>
  )
}
