import type { UnifiedTask, TaskStatus, TaskPriority } from '../types/task';

// ---------------------------------------------------------------------------
// Notion page -> UnifiedTask
// ---------------------------------------------------------------------------

/**
 * Safely extract a rich-text plain_text value from a Notion property.
 */
function richTextToPlain(prop: unknown): string {
  if (!Array.isArray(prop)) return '';
  return prop.map((rt: { plain_text?: string }) => rt.plain_text ?? '').join('');
}

/**
 * Map a Notion "Status" property name to our canonical status.
 * Notion status names are free-form text; we normalise common conventions.
 */
function mapNotionStatus(raw: string | undefined): TaskStatus {
  if (!raw) return 'todo';
  const lower = raw.toLowerCase().trim();
  if (['done', 'complete', 'completed'].includes(lower)) return 'done';
  if (['in progress', 'in_progress', 'doing', 'started'].includes(lower)) return 'in_progress';
  return 'todo';
}

/**
 * Map a Notion "Priority" select value to our canonical priority.
 */
function mapNotionPriority(raw: string | undefined): TaskPriority {
  if (!raw) return 'medium';
  const lower = raw.toLowerCase().trim();
  if (['urgent', 'critical'].includes(lower)) return 'urgent';
  if (['high'].includes(lower)) return 'high';
  if (['low'].includes(lower)) return 'low';
  return 'medium';
}

/**
 * Convert a raw Notion page object (as returned by the Notion SDK) into a
 * `UnifiedTask`.  The function is defensive: missing or unexpected property
 * shapes fall back to sensible defaults so a single bad page never crashes
 * the pipeline.
 */
export function notionPageToTask(page: Record<string, unknown>): UnifiedTask {
  const props = (page.properties ?? {}) as Record<string, Record<string, unknown>>;

  // Title ----------------------------------------------------------------
  const titleProp = props['Name'] ?? props['Title'] ?? props['title'] ?? {};
  const titleRichText = (titleProp as { title?: unknown }).title;
  const title = richTextToPlain(titleRichText) || 'Untitled';

  // Description ----------------------------------------------------------
  const descProp = props['Description'] ?? props['description'] ?? {};
  const descRichText = (descProp as { rich_text?: unknown }).rich_text;
  const description = richTextToPlain(descRichText) || undefined;

  // Status ---------------------------------------------------------------
  const statusProp = props['Status'] ?? props['status'] ?? {};
  const statusObj = (statusProp as { status?: { name?: string } }).status;
  const status = mapNotionStatus(statusObj?.name);

  // Priority -------------------------------------------------------------
  const priorityProp = props['Priority'] ?? props['priority'] ?? {};
  const priorityObj = (priorityProp as { select?: { name?: string } }).select;
  const priority = mapNotionPriority(priorityObj?.name);

  // Due date -------------------------------------------------------------
  const dueProp = props['Due'] ?? props['Due Date'] ?? props['due_date'] ?? {};
  const dateObj = (dueProp as { date?: { start?: string } }).date;
  const dueDate = dateObj?.start ?? undefined;

  // Labels / Tags --------------------------------------------------------
  const tagsProp = props['Tags'] ?? props['Labels'] ?? props['tags'] ?? {};
  const multiSelect = (tagsProp as { multi_select?: Array<{ name: string }> }).multi_select;
  const labels = Array.isArray(multiSelect)
    ? multiSelect.map((s) => s.name)
    : undefined;

  // Project --------------------------------------------------------------
  const projectProp = props['Project'] ?? props['project'] ?? {};
  const projectSelect = (projectProp as { select?: { name?: string } }).select;
  const projectName = projectSelect?.name ?? undefined;

  // Timestamps -----------------------------------------------------------
  const createdAt = (page.created_time as string) ?? new Date().toISOString();
  const updatedAt = (page.last_edited_time as string) ?? createdAt;

  return {
    id: `notion-${page.id as string}`,
    source: 'notion',
    sourceId: page.id as string,
    title,
    description,
    status,
    priority,
    dueDate,
    createdAt,
    updatedAt,
    labels,
    projectName,
  };
}

// ---------------------------------------------------------------------------
// Todoist item -> UnifiedTask
// ---------------------------------------------------------------------------

/**
 * Map Todoist's numeric priority (1-4, where 4 is most urgent) to our
 * canonical priority scale.
 */
function mapTodoistPriority(p: number | undefined): TaskPriority {
  switch (p) {
    case 4:
      return 'urgent';
    case 3:
      return 'high';
    case 2:
      return 'medium';
    default:
      return 'low';
  }
}

/**
 * Convert a Todoist task object (as returned by the official SDK) into a
 * `UnifiedTask`.
 */
export function todoistItemToTask(item: Record<string, unknown>): UnifiedTask {
  const id = (item.id as string) ?? '';
  const title = (item.content as string) ?? 'Untitled';
  const description = (item.description as string) || undefined;

  const priority = mapTodoistPriority(item.priority as number | undefined);

  // Todoist active tasks are implicitly "todo"; completed tasks are "done".
  const isCompleted = (item.isCompleted as boolean) ?? false;
  const status: TaskStatus = isCompleted ? 'done' : 'todo';

  // Due date -------------------------------------------------------------
  const due = item.due as { date?: string } | undefined;
  const dueDate = due?.date ?? undefined;

  // Labels ---------------------------------------------------------------
  const rawLabels = item.labels as string[] | undefined;
  const labels = Array.isArray(rawLabels) && rawLabels.length > 0 ? rawLabels : undefined;

  // Project name (may be resolved externally; the SDK returns projectId) --
  const projectName = (item.projectName as string) ?? undefined;

  // Timestamps -----------------------------------------------------------
  const createdAt = (item.createdAt as string) ?? new Date().toISOString();
  const updatedAt = createdAt; // Todoist does not expose an updatedAt field

  return {
    id: `todoist-${id}`,
    source: 'todoist',
    sourceId: id,
    title,
    description,
    status,
    priority,
    dueDate,
    createdAt,
    updatedAt,
    labels,
    projectName,
  };
}
