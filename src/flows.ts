export type FlowAnswer = { stepId: string; value: string }

export function flowProgress(stepIds: readonly string[], answers: readonly FlowAnswer[]) {
  const answered = new Set(answers.filter(answer => answer.value.trim()).map(answer => answer.stepId))
  const complete = stepIds.filter(id => answered.has(id)).length
  return { complete, total: stepIds.length, ready: complete === stepIds.length }
}

export function upsertFlowAnswer(answers: readonly FlowAnswer[], next: FlowAnswer) {
  if (!next.value.trim()) throw Error('FLOW_ANSWER_REQUIRED')
  return Object.freeze([...answers.filter(answer => answer.stepId !== next.stepId), Object.freeze({ ...next })])
}
