import { describe, expect, it } from 'vitest'
import { acknowledgeIntake, intakeChanges } from '../src/intake'

describe('intake updates', () => {
  const previous = { pressure: 'Moderate', scent: 'Unscented', positioning: 'Bolster', focus: 'Shoulders' }

  it('returns only changed answers', () => {
    expect(intakeChanges(previous, { ...previous, pressure: 'Light', focus: 'Neck' })).toEqual([
      { field: 'pressure', previous: 'Moderate', next: 'Light' },
      { field: 'focus', previous: 'Shoulders', next: 'Neck' },
    ])
  })

  it('requires a material change before acknowledgment', () => {
    expect(() => acknowledgeIntake([], 'now')).toThrow('INTAKE_NO_CHANGES')
  })
})
