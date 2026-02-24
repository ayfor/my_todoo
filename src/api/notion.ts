import { Client } from '@notionhq/client';
import type {
  PageObjectResponse,
  CreatePageParameters,
  UpdatePageParameters,
} from '@notionhq/client/build/src/api-endpoints';
import type { UnifiedTask, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority } from '../types/task';
import { notionPageToTask } from './unified';

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

function getNotionClient(): Client {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new Error('NOTION_API_KEY environment variable is not set');
  }
  return new Client({ auth: apiKey });
}

function getDatabaseId(): string {
  const id = process.env.NOTION_DATABASE_ID;
  if (!id) {
    throw new Error('NOTION_DATABASE_ID environment variable is not set');
  }
  return id;
}

// ---------------------------------------------------------------------------
// Retry helper (exponential back-off for Notion rate limits ~ 3 req/s)
// ---------------------------------------------------------------------------

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 400; // start at 400 ms, doubles each retry

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number }).status;
      const isRateLimit = status === 429;
      const isServerError = typeof status === 'number' && status >= 500;

      if ((isRateLimit || isServerError) && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `[notion] Request failed (${status}), retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
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
// Reverse mapping helpers (unified -> Notion property values)
// ---------------------------------------------------------------------------

function unifiedStatusToNotion(status: TaskStatus): string {
  switch (status) {
    case 'done':
      return 'Done';
    case 'in_progress':
      return 'In Progress';
    case 'todo':
    default:
      return 'To Do';
  }
}

function unifiedPriorityToNotion(priority: TaskPriority): string {
  switch (priority) {
    case 'urgent':
      return 'Urgent';
    case 'high':
      return 'High';
    case 'low':
      return 'Low';
    case 'medium':
    default:
      return 'Medium';
  }
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/**
 * Fetch all tasks from the configured Notion database.
 * Handles pagination transparently (Notion caps at 100 results per request).
 */
export async function fetchNotionTasks(): Promise<UnifiedTask[]> {
  const notion = getNotionClient();
  const databaseId = getDatabaseId();

  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;

  interface DatabaseQueryResponse {
    results: Array<{ object: string; properties?: unknown } & Record<string, unknown>>;
    has_more: boolean;
    next_cursor: string | null;
  }

  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (cursor) {
      body.start_cursor = cursor;
    }

    const response = await withRetry<DatabaseQueryResponse>(() =>
      notion.request({
        path: `databases/${databaseId}/query`,
        method: 'post',
        body,
      }) as Promise<DatabaseQueryResponse>,
    );

    for (const result of response.results) {
      if (result.object === 'page' && 'properties' in result) {
        pages.push(result as unknown as PageObjectResponse);
      }
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages.map((page) => notionPageToTask(page as unknown as Record<string, unknown>));
}

/**
 * Create a new task (page) in the Notion database.
 */
export async function createNotionTask(input: CreateTaskInput): Promise<UnifiedTask> {
  const notion = getNotionClient();
  const databaseId = getDatabaseId();

  const properties: CreatePageParameters['properties'] = {
    Name: {
      title: [{ text: { content: input.title } }],
    },
  };

  if (input.status) {
    (properties as Record<string, unknown>)['Status'] = {
      status: { name: unifiedStatusToNotion(input.status) },
    };
  }

  if (input.priority) {
    (properties as Record<string, unknown>)['Priority'] = {
      select: { name: unifiedPriorityToNotion(input.priority) },
    };
  }

  if (input.description) {
    (properties as Record<string, unknown>)['Description'] = {
      rich_text: [{ text: { content: input.description } }],
    };
  }

  if (input.dueDate) {
    (properties as Record<string, unknown>)['Due'] = {
      date: { start: input.dueDate },
    };
  }

  if (input.labels && input.labels.length > 0) {
    (properties as Record<string, unknown>)['Tags'] = {
      multi_select: input.labels.map((name) => ({ name })),
    };
  }

  if (input.projectName) {
    (properties as Record<string, unknown>)['Project'] = {
      select: { name: input.projectName },
    };
  }

  const page = await withRetry(() =>
    notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    }),
  );

  return notionPageToTask(page as unknown as Record<string, unknown>);
}

/**
 * Update an existing Notion page with the provided fields.
 */
export async function updateNotionTask(
  sourceId: string,
  updates: UpdateTaskInput,
): Promise<UnifiedTask> {
  const notion = getNotionClient();

  const properties: UpdatePageParameters['properties'] = {};

  if (updates.title !== undefined) {
    (properties as Record<string, unknown>)['Name'] = {
      title: [{ text: { content: updates.title } }],
    };
  }

  if (updates.status !== undefined) {
    (properties as Record<string, unknown>)['Status'] = {
      status: { name: unifiedStatusToNotion(updates.status) },
    };
  }

  if (updates.priority !== undefined) {
    (properties as Record<string, unknown>)['Priority'] = {
      select: { name: unifiedPriorityToNotion(updates.priority) },
    };
  }

  if (updates.description !== undefined) {
    (properties as Record<string, unknown>)['Description'] = {
      rich_text: [{ text: { content: updates.description } }],
    };
  }

  if (updates.dueDate !== undefined) {
    (properties as Record<string, unknown>)['Due'] = {
      date: updates.dueDate ? { start: updates.dueDate } : null,
    };
  }

  if (updates.labels !== undefined) {
    (properties as Record<string, unknown>)['Tags'] = {
      multi_select: updates.labels.map((name) => ({ name })),
    };
  }

  const page = await withRetry(() =>
    notion.pages.update({
      page_id: sourceId,
      properties,
    }),
  );

  return notionPageToTask(page as unknown as Record<string, unknown>);
}

/**
 * Archive (soft-delete) a Notion page.
 */
export async function deleteNotionTask(sourceId: string): Promise<void> {
  const notion = getNotionClient();

  await withRetry(() =>
    notion.pages.update({
      page_id: sourceId,
      archived: true,
    }),
  );
}
