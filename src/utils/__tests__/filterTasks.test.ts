import { describe, it, expect } from 'vitest';
import { applyFilters, type TaskFilterState } from '../filterTasks';
import type { UnifiedTask } from '../../types/task';

const makeTasks = (): UnifiedTask[] => [
  {
    id: '1',
    source: 'notion',
    sourceId: 'n1',
    title: 'Notion high todo',
    status: 'todo',
    priority: 'high',
    dueDate: '2024-06-15',
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-05T00:00:00Z',
  },
  {
    id: '2',
    source: 'todoist',
    sourceId: 't1',
    title: 'Todoist urgent done',
    status: 'done',
    priority: 'urgent',
    dueDate: '2024-06-10',
    createdAt: '2024-06-02T00:00:00Z',
    updatedAt: '2024-06-03T00:00:00Z',
  },
  {
    id: '3',
    source: 'notion',
    sourceId: 'n2',
    title: 'Notion low in_progress',
    status: 'in_progress',
    priority: 'low',
    createdAt: '2024-06-03T00:00:00Z',
    updatedAt: '2024-06-04T00:00:00Z',
  },
  {
    id: '4',
    source: 'todoist',
    sourceId: 't2',
    title: 'Todoist medium todo',
    status: 'todo',
    priority: 'medium',
    dueDate: '2024-06-20',
    createdAt: '2024-06-04T00:00:00Z',
    updatedAt: '2024-06-06T00:00:00Z',
  },
];

const defaultFilters: TaskFilterState = {
  source: 'all',
  status: 'all',
  priority: 'all',
  sortBy: 'updatedAt',
};

describe('applyFilters', () => {
  it('returns all tasks when filters are set to all', () => {
    const result = applyFilters(makeTasks(), defaultFilters);
    expect(result).toHaveLength(4);
  });

  it('filters by source', () => {
    const result = applyFilters(makeTasks(), { ...defaultFilters, source: 'notion' });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.source === 'notion')).toBe(true);
  });

  it('filters by status', () => {
    const result = applyFilters(makeTasks(), { ...defaultFilters, status: 'todo' });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.status === 'todo')).toBe(true);
  });

  it('filters by priority', () => {
    const result = applyFilters(makeTasks(), { ...defaultFilters, priority: 'urgent' });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Todoist urgent done');
  });

  it('combines multiple filters', () => {
    const result = applyFilters(makeTasks(), {
      ...defaultFilters,
      source: 'notion',
      status: 'todo',
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Notion high todo');
  });

  it('sorts by updatedAt descending', () => {
    const result = applyFilters(makeTasks(), { ...defaultFilters, sortBy: 'updatedAt' });
    const dates = result.map((t) => t.updatedAt);
    for (let i = 1; i < dates.length; i++) {
      expect(new Date(dates[i - 1]).getTime()).toBeGreaterThanOrEqual(
        new Date(dates[i]).getTime(),
      );
    }
  });

  it('sorts by createdAt descending', () => {
    const result = applyFilters(makeTasks(), { ...defaultFilters, sortBy: 'createdAt' });
    const dates = result.map((t) => t.createdAt);
    for (let i = 1; i < dates.length; i++) {
      expect(new Date(dates[i - 1]).getTime()).toBeGreaterThanOrEqual(
        new Date(dates[i]).getTime(),
      );
    }
  });

  it('sorts by dueDate ascending, tasks without due date last', () => {
    const result = applyFilters(makeTasks(), { ...defaultFilters, sortBy: 'dueDate' });
    // Task 3 has no dueDate, should be last
    expect(result[result.length - 1].id).toBe('3');
    // The rest should be in ascending order
    const withDue = result.filter((t) => t.dueDate);
    for (let i = 1; i < withDue.length; i++) {
      expect(new Date(withDue[i - 1].dueDate!).getTime()).toBeLessThanOrEqual(
        new Date(withDue[i].dueDate!).getTime(),
      );
    }
  });

  it('sorts by priority (urgent first, low last)', () => {
    const result = applyFilters(makeTasks(), { ...defaultFilters, sortBy: 'priority' });
    const priorities = result.map((t) => t.priority);
    expect(priorities[0]).toBe('urgent');
    expect(priorities[priorities.length - 1]).toBe('low');
  });

  it('returns empty array when no tasks match filters', () => {
    const result = applyFilters(makeTasks(), {
      ...defaultFilters,
      source: 'todoist',
      status: 'in_progress',
    });
    expect(result).toHaveLength(0);
  });

  it('does not mutate the original array', () => {
    const tasks = makeTasks();
    const original = [...tasks];
    applyFilters(tasks, { ...defaultFilters, source: 'notion' });
    expect(tasks).toEqual(original);
  });
});
