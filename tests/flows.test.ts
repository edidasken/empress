import { describe, expect, it } from 'vitest'
import { flowProgress, upsertFlowAnswer } from '../src/flows'

describe('guided flows', () => {
  it('calculates completion from unique required steps', () => {
    expect(flowProgress(['goal', 'pressure'], [{ stepId: 'goal', value: 'Relax' }])).toEqual({ complete: 1, total: 2, ready: false })
  })

  it('replaces an answer without duplicating its step', () => {
    expect(upsertFlowAnswer([{ stepId: 'goal', value: 'Relax' }], { stepId: 'goal', value: 'Mobility' })).toEqual([{ stepId: 'goal', value: 'Mobility' }])
  })
})
