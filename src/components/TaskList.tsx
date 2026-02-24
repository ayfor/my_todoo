import type { UnifiedTask } from '../types/task';
import { useTasks } from '../hooks/useTasks';
import { applyFilters, type TaskFilterState } from '../utils/filterTasks';
import TaskItem from './TaskItem';

export type { TaskFilterState };

interface TaskListProps {
  filters: TaskFilterState;
  onEditTask: (task: UnifiedTask) => void;
}

export default function TaskList({ filters, onEditTask }: TaskListProps) {
  const { tasks, isLoading, error } = useTasks();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-gray-400">
          <svg
            className="w-5 h-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm">Loading tasks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-red-500">
          Failed to load tasks: {error.message}
        </p>
      </div>
    );
  }

  const filteredTasks = applyFilters(tasks, filters);

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-400 mb-1">No tasks found</p>
        <p className="text-xs text-gray-300">
          {tasks.length > 0
            ? 'Try adjusting your filters'
            : 'Create your first task to get started'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {filteredTasks.map((task) => (
        <TaskItem key={task.id} task={task} onEdit={onEditTask} />
      ))}
    </div>
  );
}
