// Deadline (ascending) is the primary sort key everywhere in the Plan hierarchy — tasks,
// checklist rows, and separated subtask cards. `order` (the drag-and-drop field) only breaks
// ties within the same deadline (including the "no deadline" bucket, since undefined sorts
// to the same +Infinity bucket for every dateless item) — across different deadlines, manual
// dragging can't override the date-driven order.
export function compareByDeadlineThenOrder<T extends { deadline?: number; order: number }>(a: T, b: T): number {
  const aDeadline = a.deadline ?? Infinity
  const bDeadline = b.deadline ?? Infinity
  if (aDeadline !== bDeadline) return aDeadline - bDeadline
  return a.order - b.order
}
