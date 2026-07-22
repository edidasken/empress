import { describe, expect, it } from 'vitest'
import { searchForView, viewFromSearch } from '../src/routing'

const views = ['Today', 'Calendar', 'Community Care']

describe('workspace routing', () => {
  it('creates GitHub Pages-safe query routes', () => {
    expect(searchForView('Community Care')).toBe('?view=community-care')
  })

  it('restores known views and rejects unknown routes', () => {
    expect(viewFromSearch('?view=calendar', views)).toBe('Calendar')
    expect(viewFromSearch('?view=admin', views)).toBe('Today')
  })
})
