export type IntakeProfile = {
  pressure: string
  scent: string
  positioning: string
  focus: string
}

export function intakeChanges(previous: IntakeProfile, next: IntakeProfile) {
  return (Object.keys(previous) as (keyof IntakeProfile)[])
    .filter(field => previous[field] !== next[field])
    .map(field => Object.freeze({ field, previous: previous[field], next: next[field] }))
}

export function acknowledgeIntake(changes: ReturnType<typeof intakeChanges>, acknowledgedAt: string) {
  if (!changes.length) throw Error('INTAKE_NO_CHANGES')
  return Object.freeze({ acknowledgedAt, changeCount: changes.length, changes: Object.freeze([...changes]) })
}
