export interface UnifiedTask {
  id: string;
  source: 'notion' | 'todoist';
  sourceId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  labels?: string[];
  projectName?: string;
}

export type TaskSource = UnifiedTask['source'];
export type TaskStatus = UnifiedTask['status'];
export type TaskPriority = UnifiedTask['priority'];

export type CreateTaskInput = Pick<UnifiedTask, 'title' | 'source'> &
  Partial<Pick<UnifiedTask, 'description' | 'status' | 'priority' | 'dueDate' | 'labels' | 'projectName'>>;

export type UpdateTaskInput = Partial<Pick<UnifiedTask, 'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'labels'>>;
