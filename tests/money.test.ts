import { describe, expect, it } from 'vitest'
import { moneyTotal, recordRefund, type MoneyEntry } from '../src/money'

describe('money ledger', () => {
  const entries: MoneyEntry[] = [
    { id: 'pay-1', kind: 'charge', cents: 12500 },
    { id: 'tip-1', kind: 'tip', cents: 2000 },
    { id: 'fee-1', kind: 'fee', cents: -473 },
  ]

  it('derives the net from immutable ledger entries', () => expect(moneyTotal(entries)).toBe(14027))

  it('bounds refunds to the original charge', () => {
    const refunded = recordRefund(entries, 'pay-1', 'refund-1', 5000)
    expect(moneyTotal(refunded)).toBe(9027)
    expect(() => recordRefund(refunded, 'pay-1', 'refund-2', 8000)).toThrow('REFUND_EXCEEDS_CHARGE')
  })

  it('rejects duplicate refund events', () => {
    expect(() => recordRefund(entries, 'pay-1', 'pay-1', 100)).toThrow('REFUND_DUPLICATE_ENTRY')
  })
})
