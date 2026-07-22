export type AuditEvent = {
  id: string
  category: 'access' | 'change' | 'export'
  action: string
  actor: string
  resource: string
  outcome: 'allowed' | 'blocked'
  time: string
  correlationId: string
}

export function filterAuditEvents(events: readonly AuditEvent[], category: 'all' | AuditEvent['category']) {
  return category === 'all' ? events : events.filter(event => event.category === category)
}

export function auditProjection(event: AuditEvent) {
  return Object.freeze({
    eventId: event.id,
    category: event.category,
    action: event.action,
    actor: event.actor,
    resource: event.resource,
    outcome: event.outcome,
    timestamp: event.time,
    correlationId: event.correlationId,
  })
}
