export type MoneyEntry = {
  id: string
  kind: 'charge' | 'tip' | 'fee' | 'refund'
  cents: number
  sourceId?: string
}

export function moneyTotal(entries: readonly MoneyEntry[]) {
  const seen = new Set<string>()
  return entries.reduce((total, entry) => {
    if (seen.has(entry.id)) return total
    seen.add(entry.id)
    return total + entry.cents
  }, 0)
}

export function recordRefund(entries: readonly MoneyEntry[], paymentId: string, refundId: string, cents: number) {
  if (entries.some(entry => entry.id === refundId)) throw Error('REFUND_DUPLICATE_ENTRY')
  if (!Number.isInteger(cents) || cents <= 0) throw Error('REFUND_INVALID_AMOUNT')
  const charge = entries.find(entry => entry.id === paymentId && entry.kind === 'charge')
  if (!charge) throw Error('PAYMENT_NOT_FOUND')
  const alreadyRefunded = -entries
    .filter(entry => entry.kind === 'refund' && entry.sourceId === paymentId)
    .reduce((total, entry) => total + entry.cents, 0)
  if (alreadyRefunded + cents > charge.cents) throw Error('REFUND_EXCEEDS_CHARGE')
  return Object.freeze([...entries, Object.freeze({ id: refundId, kind: 'refund' as const, cents: -cents, sourceId: paymentId })])
}
