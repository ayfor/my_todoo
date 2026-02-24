import type { UnifiedTask, CreateTaskInput, UpdateTaskInput, TaskSource } from '../types/task';
import { fetchNotionTasks, createNotionTask, updateNotionTask, deleteNotionTask } from './notion';
import { fetchTodoistTasks, createTodoistTask, updateTodoistTask, deleteTodoistTask } from './todoist';

// ---------------------------------------------------------------------------
// In-memory cache (30 second TTL)
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 30_000;

interface TaskCache {
  tasks: UnifiedTask[];
  timestamp: number;
}

let cache: TaskCache | null = null;

function isCacheValid(): boolean {
  return cache !== null && Date.now() - cache.timestamp < CACHE_TTL_MS;
}

/**
 * Bust the in-memory task cache so the next `getAllTasks` call fetches fresh
 * data from both sources.
 */
export function refreshTasks(): void {
  cache = null;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Fetch tasks from all configured sources concurrently.
 *
 * If one source fails, the service logs the error and returns tasks from
 * whichever sources succeeded.  This ensures partial availability: a Notion
 * outage, for example, does not prevent the user from seeing their Todoist
 * tasks.
 *
 * Results are sorted by `updatedAt` descending (most recently updated first).
 */
export async function getAllTasks(): Promise<UnifiedTask[]> {
  if (isCacheValid()) {
    return cache!.tasks;
  }

  const results = await Promise.allSettled([fetchNotionTasks(), fetchTodoistTasks()]);

  const tasks: UnifiedTask[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      tasks.push(...result.value);
    } else {
      // Log but do not throw -- graceful degradation
      console.error('[taskService] Source fetch failed:', result.reason);
    }
  }

  // Sort by updatedAt descending
  tasks.sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime();
    const dateB = new Date(b.updatedAt).getTime();
    return dateB - dateA;
  });

  cache = { tasks, timestamp: Date.now() };

  return tasks;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a task using the specified source connector.
 * The cache is automatically invalidated after a successful create.
 */
export async function createTask(
  source: TaskSource,
  input: CreateTaskInput,
): Promise<UnifiedTask> {
  let task: UnifiedTask;

  switch (source) {
    case 'notion':
      task = await createNotionTask(input);
      break;
    case 'todoist':
      task = await createTodoistTask(input);
      break;
    default:
      throw new Error(`Unsupported task source: ${source as string}`);
  }

  refreshTasks();
  return task;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Update a task by routing to the correct source connector based on the
 * task's `source` field.  The cache is automatically invalidated.
 */
export async function updateTask(
  task: UnifiedTask,
  updates: UpdateTaskInput,
): Promise<UnifiedTask> {
  let updated: UnifiedTask;

  switch (task.source) {
    case 'notion':
      updated = await updateNotionTask(task.sourceId, updates);
      break;
    case 'todoist':
      updated = await updateTodoistTask(task.sourceId, updates);
      break;
    default:
      throw new Error(`Unsupported task source: ${task.source as string}`);
  }

  refreshTasks();
  return updated;
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Delete (or archive) a task by routing to the correct source connector.
 * The cache is automatically invalidated.
 */
export async function deleteTask(task: UnifiedTask): Promise<void> {
  switch (task.source) {
    case 'notion':
      await deleteNotionTask(task.sourceId);
      break;
    case 'todoist':
      await deleteTodoistTask(task.sourceId);
      break;
    default:
      throw new Error(`Unsupported task source: ${task.source as string}`);
  }

  refreshTasks();
}
