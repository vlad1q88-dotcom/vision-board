export const DEADLINE_CONFLICT_MESSAGE = 'Дата позже дедлайна родительской задачи'

export function exceedsParentDeadline(deadline: number | undefined, parentDeadline: number | undefined): boolean {
  return deadline !== undefined && parentDeadline !== undefined && deadline > parentDeadline
}
