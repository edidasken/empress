import { describe, expect, it } from 'vitest'
import { auditProjection, filterAuditEvents, type AuditEvent } from '../src/audit'

const event: AuditEvent = { id: 'evt-1', category: 'access', action: 'Viewed schedule', actor: 'Elena', resource: 'schedule/day', outcome: 'allowed', time: '9:00', correlationId: 'cor-1' }

describe('practice audit trail', () => {
  it('filters without mutating the source trail', () => {
    const events = [event, { ...event, id: 'evt-2', category: 'change' as const }]
    expect(filterAuditEvents(events, 'access')).toEqual([event])
    expect(events).toHaveLength(2)
  })

  it('projects only operational evidence fields', () => {
    expect(auditProjection(event)).not.toHaveProperty('clientName')
    expect(Object.isFrozen(auditProjection(event))).toBe(true)
  })
})
