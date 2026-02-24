import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  UnifiedTask,
  CreateTaskInput,
  UpdateTaskInput,
} from '../types/task';

const TASKS_KEY = ['tasks'] as const;

async function fetchTasks(): Promise<UnifiedTask[]> {
  const res = await fetch('/api/tasks');
  if (!res.ok) {
    throw new Error(`Failed to fetch tasks: ${res.statusText}`);
  }
  const data: { tasks: UnifiedTask[] } = await res.json();
  return data.tasks;
}

async function apiCreateTask(input: CreateTaskInput): Promise<UnifiedTask> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`Failed to create task: ${res.statusText}`);
  }
  const data: { task: UnifiedTask } = await res.json();
  return data.task;
}

async function apiUpdateTask({
  id,
  source,
  sourceId,
  updates,
}: {
  id: string;
  source: string;
  sourceId: string;
  updates: UpdateTaskInput;
}): Promise<UnifiedTask> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, sourceId, ...updates }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update task: ${res.statusText}`);
  }
  const data: { task: UnifiedTask } = await res.json();
  return data.task;
}

async function apiDeleteTask({
  id,
  source,
  sourceId,
}: {
  id: string;
  source: string;
  sourceId: string;
}): Promise<void> {
  const res = await fetch(
    `/api/tasks/${id}?source=${encodeURIComponent(source)}&sourceId=${encodeURIComponent(sourceId)}`,
    { method: 'DELETE' },
  );
  if (!res.ok) {
    throw new Error(`Failed to delete task: ${res.statusText}`);
  }
}

export function useTasks() {
  const queryClient = useQueryClient();

  const {
    data: tasks = [],
    isLoading,
    error,
  } = useQuery<UnifiedTask[], Error>({
    queryKey: TASKS_KEY,
    queryFn: fetchTasks,
    staleTime: 30_000,
  });

  const createTask = useMutation({
    mutationFn: apiCreateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });

  const updateTask = useMutation({
    mutationFn: apiUpdateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });

  const deleteTask = useMutation({
    mutationFn: apiDeleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });

  const refreshTasks = () => {
    queryClient.invalidateQueries({ queryKey: TASKS_KEY });
  };

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks,
  };
}
