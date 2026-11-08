import { WorkoutsService, WorkoutMismatchError } from '@/lib/google-sheets/workouts'
import { SHEET_COLUMNS } from '@/types/sheets'

function row(over: Record<number, any> = {}): any[] {
  const r = new Array(26).fill('')
  r[SHEET_COLUMNS.WEEK] = 3
  r[SHEET_COLUMNS.DAY] = 1
  r[SHEET_COLUMNS.TYPE] = 'Upper Body'
  r[SHEET_COLUMNS.SECTION] = 'Strength'
  r[SHEET_COLUMNS.EXERCISE] = 'Bench Press'
  r[SHEET_COLUMNS.SETS] = 3
  r[SHEET_COLUMNS.REPS] = '8'
  r[SHEET_COLUMNS.DONE] = 'TRUE'
  Object.entries(over).forEach(([k, v]) => (r[+k] = v))
  return r
}

function makeService(existing: any[]) {
  const client: any = {
    getRow: jest.fn().mockResolvedValue(existing),
    updateRow: jest.fn().mockResolvedValue(undefined),
    deleteRow: jest.fn().mockResolvedValue(undefined),
  }
  return { service: new WorkoutsService(client), client }
}

const SAVED = '2026-11-03T17:00:00.000Z'

describe('WorkoutsService.updateWorkout lastSaved rules', () => {
  it('keeps the original timestamp when editing a saved workout (even re-ticking done)', async () => {
    const { service } = makeService(row({ [SHEET_COLUMNS.LAST_SAVED]: SAVED, [SHEET_COLUMNS.DONE]: 'FALSE' }))
    const result = await service.updateWorkout('5', { done: true, load: '40kg' })
    expect(result.lastSaved).toBe(SAVED)
  })

  it('uses an explicit lastSaved as a date override', async () => {
    const { service } = makeService(row({ [SHEET_COLUMNS.LAST_SAVED]: SAVED }))
    const result = await service.updateWorkout('5', { lastSaved: '2026-10-30T17:00:00.000Z' })
    expect(result.lastSaved).toBe('2026-10-30T17:00:00.000Z')
  })

  it('stamps now when first marked done', async () => {
    const { service } = makeService(row({ [SHEET_COLUMNS.DONE]: 'FALSE' }))
    const result = await service.updateWorkout('5', { done: true })
    expect(result.lastSaved).toBeDefined()
  })

  it('does not stamp when saving between sets (not done)', async () => {
    const { service } = makeService(row({ [SHEET_COLUMNS.DONE]: 'FALSE' }))
    const result = await service.updateWorkout('5', { done: false, set1: 8 })
    expect(result.lastSaved).toBeUndefined()
  })
})

describe('stale row protection', () => {
  const expected = { week: 3, day: 1, exercise: 'Bench Press' }

  it('updates when the row matches', async () => {
    const { service, client } = makeService(row())
    await service.updateWorkout('5', { load: '40kg' }, expected)
    expect(client.updateRow).toHaveBeenCalled()
  })

  it('refuses to update when the row now holds a different exercise', async () => {
    const { service, client } = makeService(row({ [SHEET_COLUMNS.EXERCISE]: 'Squat' }))
    await expect(service.updateWorkout('5', { load: '40kg' }, expected)).rejects.toBeInstanceOf(WorkoutMismatchError)
    expect(client.updateRow).not.toHaveBeenCalled()
  })

  it('refuses to delete a mismatched row', async () => {
    const { service, client } = makeService(row({ [SHEET_COLUMNS.WEEK]: 4 }))
    await expect(service.deleteWorkout('5', expected)).rejects.toBeInstanceOf(WorkoutMismatchError)
    expect(client.deleteRow).not.toHaveBeenCalled()
  })
})
