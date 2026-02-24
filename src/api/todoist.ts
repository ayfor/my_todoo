import { TodoistApi } from '@doist/todoist-api-typescript';
import type { UnifiedTask, CreateTaskInput, UpdateTaskInput, TaskPriority } from '../types/task';
import { todoistItemToTask } from './unified';

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let _client: TodoistApi | null = null;

function getTodoistClient(): TodoistApi {
  if (_client) return _client;

  const token = process.env.TODOIST_API_TOKEN;
  if (!token) {
    throw new Error('TODOIST_API_TOKEN environment variable is not set');
  }
  _client = new TodoistApi(token);
  return _client;
}

// ---------------------------------------------------------------------------
// Retry helper (Todoist rate limit handling)
// ---------------------------------------------------------------------------

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 500;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;

      const status =
        (err as { httpStatusCode?: number }).httpStatusCode ??
        (err as { status?: number }).status;
      const isRateLimit = status === 429;
      const isServerError = typeof status === 'number' && status >= 500;

      if ((isRateLimit || isServerError) && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `[todoist] Request failed (${status}), retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// Priority mapping (unified -> Todoist)
// Todoist: 4 = urgent, 3 = high, 2 = medium, 1 = low (normal)
// ---------------------------------------------------------------------------

function unifiedPriorityToTodoist(priority: TaskPriority): number {
  switch (priority) {
    case 'urgent':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
    default:
      return 1;
  }
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/**
 * Fetch all active tasks from Todoist and convert them to UnifiedTask format.
 */
export async function fetchTodoistTasks(): Promise<UnifiedTask[]> {
  const client = getTodoistClient();

  const response = await withRetry(() => client.getTasks());
  const tasks = Array.isArray(response) ? response : (response as unknown as { results: unknown[] }).results ?? [];

  return tasks.map((task: unknown) =>
    todoistItemToTask(task as Record<string, unknown>),
  );
}

/**
 * Create a new task in Todoist.
 */
export async function createTodoistTask(input: CreateTaskInput): Promise<UnifiedTask> {
  const client = getTodoistClient();

  const addParams: Record<string, unknown> = {
    content: input.title,
  };

  if (input.description) {
    addParams.description = input.description;
  }

  if (input.priority) {
    addParams.priority = unifiedPriorityToTodoist(input.priority);
  }

  if (input.dueDate) {
    addParams.dueString = input.dueDate;
  }

  if (input.labels && input.labels.length > 0) {
    addParams.labels = input.labels;
  }

  const task = await withRetry(() => client.addTask(addParams as Parameters<typeof client.addTask>[0]));

  return todoistItemToTask(task as unknown as Record<string, unknown>);
}

/**
 * Update an existing Todoist task.
 */
export async function updateTodoistTask(
  sourceId: string,
  updates: UpdateTaskInput,
): Promise<UnifiedTask> {
  const client = getTodoistClient();

  const updateParams: Record<string, unknown> = {};

  if (updates.title !== undefined) {
    updateParams.content = updates.title;
  }

  if (updates.description !== undefined) {
    updateParams.description = updates.description;
  }

  if (updates.priority !== undefined) {
    updateParams.priority = unifiedPriorityToTodoist(updates.priority);
  }

  if (updates.dueDate !== undefined) {
    updateParams.dueString = updates.dueDate || undefined;
  }

  if (updates.labels !== undefined) {
    updateParams.labels = updates.labels;
  }

  const task = await withRetry(() => client.updateTask(sourceId, updateParams as Parameters<typeof client.updateTask>[1]));

  // If the status update indicates "done", close the task in Todoist
  if (updates.status === 'done') {
    await withRetry(() => client.closeTask(sourceId));
  }

  // If the status update indicates re-opening, reopen the task
  if (updates.status === 'todo' || updates.status === 'in_progress') {
    await withRetry(() => client.reopenTask(sourceId));
  }

  return todoistItemToTask(task as unknown as Record<string, unknown>);
}

/**
 * Permanently delete a Todoist task.
 */
export async function deleteTodoistTask(sourceId: string): Promise<void> {
  const client = getTodoistClient();
  await withRetry(() => client.deleteTask(sourceId));
}
