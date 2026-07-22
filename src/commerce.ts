export type CartLine = { productId: string; quantity: number; unitCents: number }

export function addCartItem(lines: readonly CartLine[], productId: string, unitCents: number, stock: number) {
  const existing = lines.find(line => line.productId === productId)
  const quantity = (existing?.quantity ?? 0) + 1
  if (quantity > stock) throw Error('INVENTORY_LIMIT_EXCEEDED')
  return Object.freeze([...lines.filter(line => line.productId !== productId), Object.freeze({ productId, quantity, unitCents })])
}

export function setCartQuantity(lines: readonly CartLine[], productId: string, quantity: number, stock: number) {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > stock) throw Error('CART_QUANTITY_INVALID')
  if (quantity === 0) return Object.freeze(lines.filter(line => line.productId !== productId))
  const existing = lines.find(line => line.productId === productId)
  if (!existing) throw Error('CART_LINE_NOT_FOUND')
  return Object.freeze([...lines.filter(line => line.productId !== productId), Object.freeze({ ...existing, quantity })])
}

export function cartTotal(lines: readonly CartLine[]) {
  return lines.reduce((total, line) => total + line.quantity * line.unitCents, 0)
}
