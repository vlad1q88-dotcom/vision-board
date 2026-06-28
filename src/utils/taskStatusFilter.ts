import type { TaskStatus } from '../types'
import type { StatusFilterValue } from '../components/StatusFilterPills'

// Shared between PlanPage (top-level Task cards) and TaskCard (its own separated
// SubtaskCards) so both "layers" of cards respect the same status-pill filter.
export function matchesStatusFilter(status: TaskStatus, filter: StatusFilterValue): boolean {
  return filter === 'all' || status === filter
}
