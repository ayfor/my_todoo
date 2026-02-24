import type { UnifiedTask, TaskSource, TaskStatus, TaskPriority } from '../types/task';

export interface TaskFilterState {
  source: TaskSource | 'all';
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  sortBy: 'dueDate' | 'createdAt' | 'updatedAt' | 'priority';
}

const priorityOrder: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function applyFilters(
  tasks: UnifiedTask[],
  filters: TaskFilterState,
): UnifiedTask[] {
  let filtered = [...tasks];

  if (filters.source !== 'all') {
    filtered = filtered.filter((t) => t.source === filters.source);
  }

  if (filters.status !== 'all') {
    filtered = filtered.filter((t) => t.status === filters.status);
  }

  if (filters.priority !== 'all') {
    filtered = filtered.filter((t) => t.priority === filters.priority);
  }

  filtered.sort((a, b) => {
    switch (filters.sortBy) {
      case 'dueDate': {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'updatedAt':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'priority':
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      default:
        return 0;
    }
  });

  return filtered;
}
