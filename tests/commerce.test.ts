import { describe, expect, it } from 'vitest'
import { addCartItem, cartTotal, setCartQuantity } from '../src/commerce'

describe('store cart', () => {
  it('adds and totals bounded inventory', () => {
    const one = addCartItem([], 'cream', 2400, 2)
    const two = addCartItem(one, 'cream', 2400, 2)
    expect(cartTotal(two)).toBe(4800)
    expect(() => addCartItem(two, 'cream', 2400, 2)).toThrow('INVENTORY_LIMIT_EXCEEDED')
  })

  it('removes a line at zero quantity', () => {
    expect(setCartQuantity([{ productId: 'cream', quantity: 1, unitCents: 2400 }], 'cream', 0, 2)).toEqual([])
  })
})
