'use client'

import React, { useState, useMemo } from 'react'
import { Workout } from '@/types/workout'
import { CalendarDay } from './CalendarDay'
import { DayDetailModal } from './DayDetailModal'

interface CalendarProps {
  workouts: Workout[]
  onRefetch?: () => void
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function formatMonth(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function Calendar({ workouts, onRefetch }: CalendarProps) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Debug: log workouts for week 14 day 3
  const w14d3 = workouts.filter(w => w.week === 14 && w.day === 3)
  if (w14d3.length > 0) {
    console.log('Week 14 Day 3 workouts:', w14d3.length)
    console.log('IDs:', w14d3.map(w => `${w.id}:${w.exercise}`))
  }

  // Schedule: Day 1 = Monday, Day 2 = Wednesday, Day 3 = Friday
  const DAY_OFFSETS: Record<number, number> = { 1: 0, 2: 2, 3: 4 }

  // Map workouts to calendar days:
  // 1. Find calendar dates from saved workouts (lastSaved)
  // 2. For each date, include ALL exercises from that week+day (saved and unsaved)
  // 3. Place planned (fully unsaved) days using Mon/Wed/Fri schedule
  const workoutsByDay = useMemo(() => {
    // Debug: check for duplicate IDs in source data
    const idCounts = new Map<string, number>()
    workouts.forEach(w => {
      idCounts.set(w.id, (idCounts.get(w.id) || 0) + 1)
    })
    const duplicateIds = Array.from(idCounts.entries()).filter(([_, count]) => count > 1)
    if (duplicateIds.length > 0) {
      console.warn('Duplicate workout IDs detected:', duplicateIds)
    }

    const map: Record<string, Workout[]> = {}

    // Infer Week 1 Monday from a saved workout
    // Find the earliest saved workout to minimize drift from edited timestamps
    let week1Monday: Date | null = null
    const savedWithDates = workouts
      .filter(w => w.lastSaved && DAY_OFFSETS[w.day] !== undefined)
      .sort((a, b) => (a.week * 10 + a.day) - (b.week * 10 + b.day)) // Sort by week then day

    if (savedWithDates.length > 0) {
      const saved = savedWithDates[0] // Use earliest week+day combo
      const savedDate = new Date(saved.lastSaved!)
      savedDate.setHours(0, 0, 0, 0)
      const totalOffset = (saved.week - 1) * 7 + (DAY_OFFSETS[saved.day] ?? 0)
      week1Monday = new Date(savedDate)
      week1Monday.setDate(savedDate.getDate() - totalOffset)
      console.log(`Inferred week1Monday from W${saved.week}D${saved.day} on ${savedDate.toDateString()}: ${week1Monday.toDateString()}`)
    }

    // Track which week+day combos have a calendar date from saved data
    // key: "week-day", value: calendar day number
    const weekDayToCalendarDay: Record<string, number> = {}
    const placedWorkouts = new Set<string>() // Track which workouts we've already placed

    // First pass: place saved workouts and record their calendar dates
    workouts.forEach(w => {
      if (!w.lastSaved) return
      const date = new Date(w.lastSaved)
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const dayNum = date.getDate()
        const key = String(dayNum)
        if (!map[key]) map[key] = []
        map[key].push(w)
        weekDayToCalendarDay[`${w.week}-${w.day}`] = dayNum
        placedWorkouts.add(w.id) // Mark as placed
        if (w.week === 15 && w.day === 3) {
          console.log(`First pass placed W15D3 ${w.exercise} on day ${dayNum}`)
        }
      }
    })

    // Second pass: place unsaved workouts using Mon/Wed/Fri schedule only
    // Do NOT co-locate them with saved workouts from the same day number,
    // as saved dates may have been edited and moved
    workouts.forEach(w => {
      if (placedWorkouts.has(w.id)) return // Skip if already placed

      const wdKey = `${w.week}-${w.day}`
      let dayNum: number | null = null

      // Only use schedule calculation for unsaved workouts
      if (week1Monday && DAY_OFFSETS[w.day] !== undefined) {
        // Account for rest week after W12 (gap week of May 4-10, 2026)
        const hasRestWeek = w.week > 12
        const restWeekOffset = hasRestWeek ? 7 : 0

        const totalOffset = (w.week - 1) * 7 + DAY_OFFSETS[w.day] + restWeekOffset
        const date = new Date(week1Monday)
        date.setDate(week1Monday.getDate() + totalOffset)
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          dayNum = date.getDate()
          if (w.week === 15 && w.day === 3) {
            console.log(`Placing W${w.week}D${w.day} ${w.exercise} on day ${dayNum}`, { week1Monday: week1Monday.toDateString(), totalOffset, restWeekOffset, calculatedDate: date.toDateString() })
          }
        }
      }

      if (dayNum !== null) {
        const key = String(dayNum)
        if (!map[key]) map[key] = []
        map[key].push(w)
        placedWorkouts.add(w.id)
      }
    })

    // Deduplicate workouts by ID in each day
    Object.keys(map).forEach(dayKey => {
      const beforeCount = map[dayKey].length
      const seen = new Set<string>()
      map[dayKey] = map[dayKey].filter(w => {
        if (seen.has(w.id)) return false
        seen.add(w.id)
        return true
      })
      const afterCount = map[dayKey].length
      if (beforeCount !== afterCount) {
        console.warn(`Day ${dayKey}: Removed ${beforeCount - afterCount} duplicate(s). Week ${map[dayKey][0]?.week} Day ${map[dayKey][0]?.day}`)
      }
    })

    return map
  }, [workouts, currentMonth, currentYear])

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  const calendarDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null)
  }

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
    setSelectedDay(null)
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
    setSelectedDay(null)
  }

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()

  const selectedWorkouts = selectedDay ? (workoutsByDay[String(selectedDay)] || []) : []

  // Debug logging for selected day
  if (selectedDay) {
    console.log(`Selected day ${selectedDay}:`, selectedWorkouts.length, 'workouts')
    console.log('Workout details:', selectedWorkouts.map(w => `${w.id}:W${w.week}D${w.day}:${w.exercise}:${w.lastSaved || 'unsaved'}`))
  }

  const selectedDateStr = selectedDay
    ? new Date(currentYear, currentMonth, selectedDay).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="glass-card p-2 hover:border-accent-cyan/30 transition-colors"
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="text-lg font-semibold text-text-primary">
          {formatMonth(currentYear, currentMonth)}
        </h2>

        <button
          onClick={goToNextMonth}
          className="glass-card p-2 hover:border-accent-cyan/30 transition-colors"
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-text-tertiary py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => (
          <CalendarDay
            key={i}
            dayNumber={day}
            isToday={day !== null && isToday(day)}
            isSelected={day === selectedDay}
            workouts={day !== null ? (workoutsByDay[String(day)] || []) : []}
            onClick={() => {
              if (day !== null) {
                setSelectedDay(day === selectedDay ? null : day)
              }
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-text-tertiary">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-accent-green" />
          <span>Complete</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-accent-amber" />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-text-tertiary" />
          <span>Planned</span>
        </div>
      </div>

      {/* Day detail modal */}
      <DayDetailModal
        isOpen={selectedDay !== null && selectedWorkouts.length > 0}
        onClose={() => setSelectedDay(null)}
        date={selectedDateStr}
        workouts={selectedWorkouts}
        allWorkouts={workouts}
        onRefetch={onRefetch}
      />
    </div>
  )
}
