export type ScheduleBlock = {
  id: string
  start: number
  end: number
  therapist: string
  room: string
  kind: 'appointment' | 'buffer'
}

export type ScheduleCandidate = Omit<ScheduleBlock, 'id' | 'kind'>

export function resourceConflicts(candidate: ScheduleCandidate, blocks: readonly ScheduleBlock[]) {
  return blocks.filter(block => {
    const overlaps = candidate.start < block.end && block.start < candidate.end
    const resourceShared = candidate.therapist === block.therapist || candidate.room === block.room
    return overlaps && resourceShared
  })
}
