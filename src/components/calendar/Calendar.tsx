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

  // Schedule: Day 1 = Monday, Day 2 = Wednesday, Day 3 = Friday
  const DAY_OFFSETS: Record<number, number> = { 1: 0, 2: 2, 3: 4 }

  // Map workouts to calendar days:
  // 1. Find calendar dates from saved workouts (lastSaved)
  // 2. For each date, include ALL exercises from that week+day (saved and unsaved)
  // 3. Place planned (fully unsaved) days using Mon/Wed/Fri schedule
  const workoutsByDay = useMemo(() => {
    const map: Record<string, Workout[]> = {}

    // Infer Week 1 Monday from a saved workout
    let week1Monday: Date | null = null
    const saved = workouts.find(w => w.lastSaved && DAY_OFFSETS[w.day] !== undefined)
    if (saved) {
      const savedDate = new Date(saved.lastSaved!)
      savedDate.setHours(0, 0, 0, 0)
      const totalOffset = (saved.week - 1) * 7 + (DAY_OFFSETS[saved.day] ?? 0)
      week1Monday = new Date(savedDate)
      week1Monday.setDate(savedDate.getDate() - totalOffset)
    }

    // Track which week+day combos have a calendar date from saved data
    // key: "week-day", value: calendar day number
    const weekDayToCalendarDay: Record<string, number> = {}

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
      }
    })

    // Second pass: place unsaved workouts on the same calendar date as
    // their saved siblings, or use Mon/Wed/Fri schedule for fully unsaved days
    workouts.forEach(w => {
      if (w.lastSaved) return // already placed

      const wdKey = `${w.week}-${w.day}`
      let dayNum: number | null = null

      if (weekDayToCalendarDay[wdKey] !== undefined) {
        // Some exercises in this week+day were saved — use the same date
        dayNum = weekDayToCalendarDay[wdKey]
      } else if (week1Monday && DAY_OFFSETS[w.day] !== undefined) {
        // Fully unsaved day — use schedule offset
        const totalOffset = (w.week - 1) * 7 + DAY_OFFSETS[w.day]
        const date = new Date(week1Monday)
        date.setDate(week1Monday.getDate() + totalOffset)
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          dayNum = date.getDate()
        }
      }

      if (dayNum !== null) {
        const key = String(dayNum)
        if (!map[key]) map[key] = []
        map[key].push(w)
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
