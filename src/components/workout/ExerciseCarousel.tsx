'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Workout, WorkoutPerformanceData } from '@/types/workout'
import { useUpdateWorkout } from '@/lib/hooks/useWorkouts'
import { getPersonalRecords } from '@/lib/utils/stats'
import { SetInputGroup } from '@/components/workout/SetInput'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { RestTimer } from '@/components/workout/RestTimer'

const typeColors: Record<string, string> = {
  'Upper Body': 'bg-accent-cyan/20 text-accent-cyan',
  'Lower Body': 'bg-accent-purple/20 text-accent-purple',
  'Full Body': 'bg-accent-green/20 text-accent-green',
  'Core': 'bg-accent-amber/20 text-accent-amber',
  'Cardio': 'bg-accent-pink/20 text-accent-pink',
  'Flexibility': 'bg-accent-purple/20 text-accent-purple',
  'Rest': 'bg-text-tertiary/20 text-text-tertiary',
}

interface DayKey {
  week: number
  day: number
}

function findDefaultDay(workouts: Workout[]): DayKey {
  const dayKeyStrings = [...new Set(workouts.map(w => `${w.week}-${w.day}`))]
  const dayKeys = dayKeyStrings
    .map(k => {
      const [w, d] = k.split('-').map(Number)
      return { week: w, day: d }
    })
    .sort((a, b) => (a.week !== b.week ? a.week - b.week : a.day - b.day))

  if (dayKeys.length === 0) return { week: 1, day: 1 }

  // Find the last day where ALL exercises have been completed (done + lastSaved)
  let lastCompletedIdx = -1
  dayKeys.forEach((dk, idx) => {
    const dayWorkouts = workouts.filter(w => w.week === dk.week && w.day === dk.day)
    if (dayWorkouts.length > 0 && dayWorkouts.every(w => w.done && w.lastSaved)) {
      lastCompletedIdx = idx
    }
  })

  // Default to the next incomplete day, but only advance by 1
  const targetIdx = lastCompletedIdx + 1
  return dayKeys[targetIdx] || dayKeys[dayKeys.length - 1]
}

interface ExerciseCarouselProps {
  workouts: Workout[]
  refetch: () => void
}

export function ExerciseCarousel({ workouts, refetch }: ExerciseCarouselProps) {
  const { updateWorkout, loading: updating } = useUpdateWorkout()

  // Compute available weeks and days
  const weeks = useMemo(() => {
    const w = [...new Set(workouts.map(w => w.week))].sort((a, b) => a - b)
    return w.length > 0 ? w : [1]
  }, [workouts])

  const defaultDay = useMemo(() => findDefaultDay(workouts), [workouts])

  const [currentWeek, setCurrentWeek] = useState(defaultDay.week)
  const [currentDay, setCurrentDay] = useState(defaultDay.day)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasChanges, setHasChanges] = useState(false)
  const [performanceData, setPerformanceData] = useState<WorkoutPerformanceData>({
    set1: undefined, set2: undefined, set3: undefined, set4: undefined, set5: undefined,
    load: '', avgRir: undefined, done: false, notes: '',
  })

  // Days available for the selected week
  const daysForWeek = useMemo(() => {
    const d = [...new Set(workouts.filter(w => w.week === currentWeek).map(w => w.day))].sort((a, b) => a - b)
    return d.length > 0 ? d : [1]
  }, [workouts, currentWeek])

  // Exercises for current week+day
  const exercises = useMemo(() => {
    return workouts.filter(w => w.week === currentWeek && w.day === currentDay)
  }, [workouts, currentWeek, currentDay])

  const currentExercise = exercises[currentIndex] || null
  const isReadOnly = !!(currentExercise?.done)
  const totalExercises = exercises.length

  // Personal Records
  const personalRecords = useMemo(() => getPersonalRecords(workouts), [workouts])

  const prInfo = useMemo(() => {
    if (!currentExercise) return null
    const record = personalRecords.get(currentExercise.exercise)
    if (!record) return null
    // Check if current load matches or exceeds PR
    const currentLoad = currentExercise.load
    if (!currentLoad) return { isPR: false, isNewPR: false, maxLoad: record.maxLoad }
    const match = currentLoad.match(/[\d.]+/)
    if (!match) return { isPR: false, isNewPR: false, maxLoad: record.maxLoad }
    const currentNum = parseFloat(match[0])
    if (isNaN(currentNum)) return { isPR: false, isNewPR: false, maxLoad: record.maxLoad }
    const isNewPR = currentNum > record.maxLoadNum
    const isPR = currentNum >= record.maxLoadNum
    return { isPR, isNewPR, maxLoad: record.maxLoad }
  }, [currentExercise, personalRecords])

  // Progressive Overload
  const overloadInfo = useMemo(() => {
    if (!currentExercise) return null
    const prevWeekExercises = workouts.filter(
      w => w.week === currentExercise.week - 1 &&
           w.exercise === currentExercise.exercise &&
           w.lastSaved
    )
    if (prevWeekExercises.length === 0) return null
    const prevVolume = prevWeekExercises.reduce((sum, w) => {
      return sum + [w.set1, w.set2, w.set3, w.set4, w.set5]
        .filter((s): s is number => s !== undefined && s !== null)
        .reduce((a, b) => a + b, 0)
    }, 0)
    if (prevVolume === 0) return null

    const currentVolume = [
      currentExercise.set1, currentExercise.set2, currentExercise.set3,
      currentExercise.set4, currentExercise.set5,
    ].filter((s): s is number => s !== undefined && s !== null)
      .reduce((a, b) => a + b, 0)
    if (currentVolume === 0) return null

    const change = Math.round(((currentVolume - prevVolume) / prevVolume) * 100)
    if (change > 0) return { direction: 'up' as const, pct: change }
    if (change < 0) return { direction: 'down' as const, pct: Math.abs(change) }
    return { direction: 'same' as const, pct: 0 }
  }, [currentExercise, workouts])

  // Rest Timer state
  const [showTimer, setShowTimer] = useState(false)
  const [timerKey, setTimerKey] = useState(0)

  // Previous week data for reference labels
  const [previousWeekValues, setPreviousWeekValues] = useState<{
    set1?: number; set2?: number; set3?: number; set4?: number; set5?: number;
  } | undefined>(undefined)
  const [prefilledFrom, setPrefilledFrom] = useState<number | null>(null)

  // Sync performance data when current exercise changes
  useEffect(() => {
    if (currentExercise) {
      const hasPerformance = currentExercise.set1 !== undefined ||
        currentExercise.set2 !== undefined ||
        currentExercise.set3 !== undefined ||
        currentExercise.load ||
        currentExercise.done

      if (hasPerformance) {
        setPerformanceData({
          set1: currentExercise.set1,
          set2: currentExercise.set2,
          set3: currentExercise.set3,
          set4: currentExercise.set4,
          set5: currentExercise.set5,
          load: currentExercise.load || '',
          avgRir: currentExercise.avgRir,
          done: currentExercise.done,
          notes: currentExercise.notes || '',
        })
        setHasChanges(false)
        setPrefilledFrom(null)
        setPreviousWeekValues(undefined)
      } else {
        // Look up previous week data for reference
        const prevWeek = workouts.find(
          w => w.week === currentExercise.week - 1 &&
               w.exercise === currentExercise.exercise &&
               w.lastSaved
        )
        if (prevWeek && (prevWeek.set1 !== undefined || prevWeek.load)) {
          // Show previous values as reference labels, but keep form empty
          setPreviousWeekValues({
            set1: prevWeek.set1,
            set2: prevWeek.set2,
            set3: prevWeek.set3,
            set4: prevWeek.set4,
            set5: prevWeek.set5,
          })
          setPrefilledFrom(prevWeek.week)
        } else {
          setPreviousWeekValues(undefined)
          setPrefilledFrom(null)
        }
        setPerformanceData({
          set1: undefined, set2: undefined, set3: undefined, set4: undefined, set5: undefined,
          load: '', avgRir: undefined, done: false, notes: '',
        })
        setHasChanges(false)
      }
    }
  }, [currentExercise?.id])

  // When week changes, reset day to first available
  useEffect(() => {
    if (!daysForWeek.includes(currentDay)) {
      setCurrentDay(daysForWeek[0])
    }
  }, [daysForWeek, currentDay])

  // When day changes, reset index
  useEffect(() => {
    setCurrentIndex(0)
  }, [currentWeek, currentDay])

  const handleSetChange = useCallback((setNumber: number, value: number | undefined) => {
    setPerformanceData(prev => ({ ...prev, [`set${setNumber}`]: value }))
    setHasChanges(true)
  }, [])

  const handleFieldChange = useCallback((field: string, value: any) => {
    setPerformanceData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }, [])

  const handleSave = async () => {
    if (!currentExercise) return
    const result = await updateWorkout(currentExercise.id, performanceData)
    if (result) {
      setHasChanges(false)
      setPrefilledFrom(null)
      // Start rest timer if exercise has a rest period
      if (currentExercise.rest) {
        setTimerKey(prev => prev + 1)
        setShowTimer(true)
      }
      // Auto-advance to the next exercise in the same day before refetching
      const nextIndex = currentIndex + 1
      if (nextIndex < totalExercises) {
        setCurrentIndex(nextIndex)
      }
      refetch()
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  const handleNext = () => {
    if (currentIndex < totalExercises - 1) setCurrentIndex(currentIndex + 1)
  }

  // Swipe gesture handling
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null

    // Only trigger if horizontal swipe is dominant and > 50px
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        // Swipe left → next
        if (currentIndex < totalExercises - 1) setCurrentIndex(prev => prev + 1)
      } else {
        // Swipe right → prev
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1)
      }
    }
  }, [currentIndex, totalExercises])

  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentWeek(Number(e.target.value))
  }

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDay(Number(e.target.value))
  }

  if (workouts.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-text-secondary">No workouts found. Add workouts to get started.</p>
      </div>
    )
  }

  const allDayCompleted = exercises.length > 0 && exercises.every(ex => ex.done)

  return (
    <div className="space-y-4">
      {/* Week/Day Filter */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-text-tertiary mb-1">Week</label>
          <select
            value={currentWeek}
            onChange={handleWeekChange}
            className="input w-full"
          >
            {weeks.map(w => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-text-tertiary mb-1">Day</label>
          <select
            value={currentDay}
            onChange={handleDayChange}
            className="input w-full"
          >
            {daysForWeek.map(d => (
              <option key={d} value={d}>Day {d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Day completion message */}
      {allDayCompleted && (
        <div className="glass-card p-3 text-center border border-accent-green/30">
          <p className="text-accent-green font-medium text-sm">All exercises completed for this day!</p>
        </div>
      )}

      {/* Exercise Card (swipeable) */}
      {currentExercise ? (
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {/* Exercise Info */}
          <div className="glass-card p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-text-primary">{currentExercise.exercise}</h2>
                  {prInfo?.isNewPR && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                      New PR!
                    </span>
                  )}
                  {prInfo?.isPR && !prInfo.isNewPR && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400">
                      PR
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-text-secondary">
                    Week {currentExercise.week} · Day {currentExercise.day} · {currentExercise.section}{currentExercise.muscleGroup ? ` · ${currentExercise.muscleGroup}` : ''}
                  </p>
                  {overloadInfo && (
                    <span className={`text-xs font-medium ${
                      overloadInfo.direction === 'up' ? 'text-accent-green' :
                      overloadInfo.direction === 'down' ? 'text-accent-pink' :
                      'text-text-tertiary'
                    }`}>
                      {overloadInfo.direction === 'up' && `↑ ${overloadInfo.pct}%`}
                      {overloadInfo.direction === 'down' && `↓ ${overloadInfo.pct}%`}
                      {overloadInfo.direction === 'same' && '→'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded text-sm font-medium ${typeColors[currentExercise.type] || 'bg-glass-bg text-text-secondary'}`}>
                  {currentExercise.type}
                </span>
                {isReadOnly && (
                  <span className="px-3 py-1 rounded text-sm font-medium bg-accent-green/20 text-accent-green">
                    Completed
                  </span>
                )}
              </div>
            </div>

            {currentExercise.description && (
              <p className="text-text-secondary mb-4">{currentExercise.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-text-tertiary">Sets:</span>
                <span className="ml-2 text-text-primary">{currentExercise.sets}</span>
              </div>
              <div>
                <span className="font-medium text-text-tertiary">Reps:</span>
                <span className="ml-2 text-text-primary">{currentExercise.reps}</span>
              </div>
              <div>
                <span className="font-medium text-text-tertiary">RIR:</span>
                <span className="ml-2 text-text-primary">{currentExercise.rir}</span>
              </div>
              <div>
                <span className="font-medium text-text-tertiary">Rest:</span>
                <span className="ml-2 text-text-primary">{currentExercise.rest}</span>
              </div>
              {currentExercise.escalation && (
                <div className="col-span-2">
                  <span className="font-medium text-text-tertiary">Escalation:</span>
                  <span className="ml-2 text-text-primary">{currentExercise.escalation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Rest Timer */}
          {showTimer && currentExercise.rest && (
            <RestTimer
              key={timerKey}
              restString={currentExercise.rest}
              onComplete={() => {
                setTimeout(() => setShowTimer(false), 3000)
              }}
              onSkip={() => setShowTimer(false)}
            />
          )}

          {/* Performance Card */}
          <div className="glass-card p-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Track Performance
            </h3>
            {prefilledFrom !== null && (
              <p className="text-xs text-accent-amber mb-3">
                Showing previous reps from Week {prefilledFrom}
              </p>
            )}

            <div className="space-y-4">
              <SetInputGroup
                sets={currentExercise.sets}
                values={performanceData}
                onChange={handleSetChange}
                disabled={isReadOnly}
                previousValues={previousWeekValues}
              />

              <Input
                label="Load / Variation"
                type="text"
                value={performanceData.load}
                onChange={(e) => handleFieldChange('load', e.target.value)}
                placeholder="e.g., 135 lbs or Bodyweight"
                disabled={isReadOnly}
              />

              <Input
                label="Average RIR"
                type="number"
                inputMode="numeric"
                min="0"
                max="10"
                value={performanceData.avgRir ?? ''}
                onChange={(e) =>
                  handleFieldChange('avgRir', e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="0-10"
                disabled={isReadOnly}
              />

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Notes
                </label>
                <textarea
                  value={performanceData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  rows={3}
                  className="input"
                  placeholder="Optional notes"
                  disabled={isReadOnly}
                />
              </div>

              <Checkbox
                label="Mark as completed"
                checked={performanceData.done}
                onChange={(e) => handleFieldChange('done', e.target.checked)}
                disabled={isReadOnly}
              />
            </div>

            {!isReadOnly && (
              <div className="mt-6">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={updating}
                  disabled={updating || !hasChanges}
                  fullWidth
                >
                  {hasChanges ? 'Save Changes' : 'Saved'}
                </Button>
              </div>
            )}

            {isReadOnly && currentExercise.lastSaved && (
              <p className="text-xs text-text-tertiary text-center mt-4">
                Last saved: {new Date(currentExercise.lastSaved).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 text-center">
          <p className="text-text-secondary">No exercises found for this week/day.</p>
        </div>
      )}

      {/* Navigation */}
      {totalExercises > 0 && (
        <div className="flex items-center justify-between glass-card p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            Prev
          </Button>
          <span className="text-sm text-text-secondary">
            {currentIndex + 1} of {totalExercises}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex === totalExercises - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
