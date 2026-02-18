'use client'

import React, { useState } from 'react'
import { Workout, WorkoutFilters } from '@/types/workout'
import { DayCard } from './DayCard'
import { Select } from '@/components/ui/Select'
import { WORKOUT_TYPES } from '@/constants/config'

interface WorkoutListProps {
  workouts: Workout[]
  showFilters?: boolean
}

export function WorkoutList({ workouts, showFilters = true }: WorkoutListProps) {
  const [filters, setFilters] = useState<WorkoutFilters>({})

  // Apply filters
  let filteredWorkouts = workouts

  if (filters.week) {
    filteredWorkouts = filteredWorkouts.filter(w => w.week === filters.week)
  }
  if (filters.day) {
    filteredWorkouts = filteredWorkouts.filter(w => w.day === filters.day)
  }
  if (filters.type) {
    filteredWorkouts = filteredWorkouts.filter(w => w.type === filters.type)
  }
  if (filters.done !== undefined) {
    filteredWorkouts = filteredWorkouts.filter(w => w.done === filters.done)
  }

  // Get unique weeks and days
  const weeks = Array.from(new Set(workouts.map(w => w.week))).sort((a, b) => a - b)
  const days = Array.from(new Set(workouts.map(w => w.day))).sort((a, b) => a - b)

  // Group by week-day
  const grouped = filteredWorkouts.reduce<Record<string, Workout[]>>((acc, w) => {
    const key = `${w.week}-${w.day}`
    if (!acc[key]) acc[key] = []
    acc[key].push(w)
    return acc
  }, {})

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const [aw, ad] = a.split('-').map(Number)
    const [bw, bd] = b.split('-').map(Number)
    return aw !== bw ? aw - bw : ad - bd
  })

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="glass-card p-4 space-y-3">
          <h3 className="text-sm font-medium text-text-secondary mb-2">Filters</h3>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Week"
              options={[
                { value: '', label: 'All Weeks' },
                ...weeks.map(w => ({ value: w, label: `Week ${w}` })),
              ]}
              value={filters.week || ''}
              onChange={(e) =>
                setFilters({ ...filters, week: e.target.value ? Number(e.target.value) : undefined })
              }
            />
            <Select
              label="Day"
              options={[
                { value: '', label: 'All Days' },
                ...days.map(d => ({ value: d, label: `Day ${d}` })),
              ]}
              value={filters.day || ''}
              onChange={(e) =>
                setFilters({ ...filters, day: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              options={[
                { value: '', label: 'All Types' },
                ...WORKOUT_TYPES.map(t => ({ value: t, label: t })),
              ]}
              value={filters.type || ''}
              onChange={(e) =>
                setFilters({ ...filters, type: e.target.value as any })
              }
            />
            <Select
              label="Status"
              options={[
                { value: '', label: 'All' },
                { value: 'false', label: 'Incomplete' },
                { value: 'true', label: 'Complete' },
              ]}
              value={filters.done === undefined ? '' : filters.done.toString()}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  done: e.target.value === '' ? undefined : e.target.value === 'true',
                })
              }
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sortedKeys.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-text-tertiary">No workouts found</p>
          </div>
        ) : (
          sortedKeys.map(key => {
            const [week, day] = key.split('-').map(Number)
            return (
              <DayCard
                key={key}
                week={week}
                day={day}
                workouts={grouped[key]}
              />
            )
          })
        )}
      </div>

      {filteredWorkouts.length > 0 && (
        <p className="text-sm text-text-tertiary text-center py-2">
          Showing {filteredWorkouts.length} of {workouts.length} workouts
        </p>
      )}
    </div>
  )
}
