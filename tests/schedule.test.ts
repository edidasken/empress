import { describe, expect, it } from 'vitest'
import { resourceConflicts, type ScheduleBlock } from '../src/schedule'

describe('resource scheduling', () => {
  const blocks: ScheduleBlock[] = [
    { id: 'visit', start: 540, end: 600, therapist: 'Elena', room: 'Willow', kind: 'appointment' },
    { id: 'buffer', start: 600, end: 615, therapist: 'Elena', room: 'Willow', kind: 'buffer' },
  ]

  it('detects shared therapist or room overlap', () => {
    expect(resourceConflicts({ start: 570, end: 630, therapist: 'Elena', room: 'Oak' }, blocks)).toHaveLength(2)
  })

  it('allows simultaneous visits with independent resources', () => {
    expect(resourceConflicts({ start: 540, end: 600, therapist: 'Noor', room: 'Cedar' }, blocks)).toEqual([])
  })
})
