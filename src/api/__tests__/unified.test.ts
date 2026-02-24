import { describe, it, expect } from 'vitest';
import { notionPageToTask, todoistItemToTask } from '../unified';

// ---------------------------------------------------------------------------
// Notion -> UnifiedTask mapping
// ---------------------------------------------------------------------------

describe('notionPageToTask', () => {
  const basePage = {
    id: 'abc-123',
    object: 'page',
    created_time: '2024-06-01T10:00:00.000Z',
    last_edited_time: '2024-06-02T12:00:00.000Z',
  };

  it('maps a fully populated Notion page', () => {
    const page = {
      ...basePage,
      properties: {
        Name: { title: [{ plain_text: 'Buy groceries' }] },
        Description: { rich_text: [{ plain_text: 'Milk, eggs, bread' }] },
        Status: { status: { name: 'In Progress' } },
        Priority: { select: { name: 'High' } },
        Due: { date: { start: '2024-06-15' } },
        Tags: { multi_select: [{ name: 'personal' }, { name: 'errands' }] },
        Project: { select: { name: 'Home' } },
      },
    };

    const task = notionPageToTask(page);

    expect(task.id).toBe('notion-abc-123');
    expect(task.source).toBe('notion');
    expect(task.sourceId).toBe('abc-123');
    expect(task.title).toBe('Buy groceries');
    expect(task.description).toBe('Milk, eggs, bread');
    expect(task.status).toBe('in_progress');
    expect(task.priority).toBe('high');
    expect(task.dueDate).toBe('2024-06-15');
    expect(task.labels).toEqual(['personal', 'errands']);
    expect(task.projectName).toBe('Home');
    expect(task.createdAt).toBe('2024-06-01T10:00:00.000Z');
    expect(task.updatedAt).toBe('2024-06-02T12:00:00.000Z');
  });

  it('handles missing properties with sensible defaults', () => {
    const page = { ...basePage, properties: {} };
    const task = notionPageToTask(page);

    expect(task.title).toBe('Untitled');
    expect(task.description).toBeUndefined();
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
    expect(task.dueDate).toBeUndefined();
    expect(task.labels).toBeUndefined();
    expect(task.projectName).toBeUndefined();
  });

  it('maps "Done" status correctly', () => {
    const page = {
      ...basePage,
      properties: {
        Name: { title: [{ plain_text: 'Done task' }] },
        Status: { status: { name: 'Done' } },
      },
    };
    expect(notionPageToTask(page).status).toBe('done');
  });

  it('maps "Completed" status to done', () => {
    const page = {
      ...basePage,
      properties: {
        Name: { title: [{ plain_text: 'Done task' }] },
        Status: { status: { name: 'Completed' } },
      },
    };
    expect(notionPageToTask(page).status).toBe('done');
  });

  it('maps "Urgent" priority correctly', () => {
    const page = {
      ...basePage,
      properties: {
        Name: { title: [{ plain_text: 'Urgent task' }] },
        Priority: { select: { name: 'Urgent' } },
      },
    };
    expect(notionPageToTask(page).priority).toBe('urgent');
  });

  it('maps "Critical" priority to urgent', () => {
    const page = {
      ...basePage,
      properties: {
        Name: { title: [{ plain_text: 'Critical task' }] },
        Priority: { select: { name: 'Critical' } },
      },
    };
    expect(notionPageToTask(page).priority).toBe('urgent');
  });

  it('handles page with no properties key', () => {
    const page = { ...basePage };
    const task = notionPageToTask(page);
    expect(task.title).toBe('Untitled');
    expect(task.status).toBe('todo');
  });

  it('concatenates multiple rich text blocks', () => {
    const page = {
      ...basePage,
      properties: {
        Name: {
          title: [{ plain_text: 'Part 1 ' }, { plain_text: 'Part 2' }],
        },
      },
    };
    expect(notionPageToTask(page).title).toBe('Part 1 Part 2');
  });
});

// ---------------------------------------------------------------------------
// Todoist -> UnifiedTask mapping
// ---------------------------------------------------------------------------

describe('todoistItemToTask', () => {
  const baseItem = {
    id: 'todo-456',
    content: 'Review PR',
    description: 'Check the new feature branch',
    priority: 3,
    isCompleted: false,
    due: { date: '2024-07-01' },
    labels: ['work', 'code-review'],
    createdAt: '2024-06-01T08:00:00.000Z',
  };

  it('maps a fully populated Todoist task', () => {
    const task = todoistItemToTask(baseItem);

    expect(task.id).toBe('todoist-todo-456');
    expect(task.source).toBe('todoist');
    expect(task.sourceId).toBe('todo-456');
    expect(task.title).toBe('Review PR');
    expect(task.description).toBe('Check the new feature branch');
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('high');
    expect(task.dueDate).toBe('2024-07-01');
    expect(task.labels).toEqual(['work', 'code-review']);
    expect(task.createdAt).toBe('2024-06-01T08:00:00.000Z');
  });

  it('maps priority 4 to urgent', () => {
    expect(todoistItemToTask({ ...baseItem, priority: 4 }).priority).toBe('urgent');
  });

  it('maps priority 2 to medium', () => {
    expect(todoistItemToTask({ ...baseItem, priority: 2 }).priority).toBe('medium');
  });

  it('maps priority 1 to low', () => {
    expect(todoistItemToTask({ ...baseItem, priority: 1 }).priority).toBe('low');
  });

  it('maps completed tasks to done status', () => {
    const task = todoistItemToTask({ ...baseItem, isCompleted: true });
    expect(task.status).toBe('done');
  });

  it('handles missing optional fields', () => {
    const task = todoistItemToTask({ id: 'min', content: 'Minimal' });

    expect(task.title).toBe('Minimal');
    expect(task.description).toBeUndefined();
    expect(task.priority).toBe('low');
    expect(task.status).toBe('todo');
    expect(task.dueDate).toBeUndefined();
    expect(task.labels).toBeUndefined();
  });

  it('excludes empty labels array', () => {
    const task = todoistItemToTask({ ...baseItem, labels: [] });
    expect(task.labels).toBeUndefined();
  });

  it('handles empty description as undefined', () => {
    const task = todoistItemToTask({ ...baseItem, description: '' });
    expect(task.description).toBeUndefined();
  });
});
