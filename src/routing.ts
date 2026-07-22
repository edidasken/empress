export function viewFromSearch(search: string, views: readonly string[], fallback = views[0]) {
  const requested = new URLSearchParams(search).get('view')
  if (!requested) return fallback
  return views.find(view => slugForView(view) === requested) ?? fallback
}

export function slugForView(view: string) {
  return view.toLocaleLowerCase().replace(/\s+/g, '-')
}

export function searchForView(view: string) {
  return `?view=${encodeURIComponent(slugForView(view))}`
}
