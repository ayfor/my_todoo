import { useState } from 'react';
import toast from 'react-hot-toast';
import type { UnifiedTask, UpdateTaskInput } from '../types/task';
import { useTasks } from '../hooks/useTasks';

interface TaskItemProps {
  task: UnifiedTask;
  onEdit: (task: UnifiedTask) => void;
}

const priorityColors: Record<UnifiedTask['priority'], string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-gray-300',
};

const priorityLabels: Record<UnifiedTask['priority'], string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function isOverdue(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export default function TaskItem({ task, onEdit }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);
  const { updateTask, deleteTask } = useTasks();

  const isDone = task.status === 'done';

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = isDone ? 'todo' : 'done';
    const updates: UpdateTaskInput = { status: newStatus };

    updateTask.mutate(
      {
        id: task.id,
        source: task.source,
        sourceId: task.sourceId,
        updates,
      },
      {
        onSuccess: () => {
          toast.success(
            newStatus === 'done' ? 'Task completed' : 'Task reopened',
          );
        },
        onError: (err) => {
          toast.error(`Failed to update: ${err.message}`);
        },
      },
    );
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTask.mutate(
      { id: task.id, source: task.source, sourceId: task.sourceId },
      {
        onSuccess: () => {
          toast.success('Task deleted');
        },
        onError: (err) => {
          toast.error(`Failed to delete: ${err.message}`);
        },
      },
    );
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
  };

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="group relative bg-white rounded-xl border border-gray-100 px-5 py-4 transition-all duration-200 hover:shadow-sm hover:border-gray-200 cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={handleToggleStatus}
          className="mt-0.5 flex-shrink-0 cursor-pointer"
          aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
        >
          {isDone ? (
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center transition-colors">
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Priority dot */}
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColors[task.priority]}`}
              title={priorityLabels[task.priority]}
            />

            {/* Title */}
            <span
              className={`text-sm font-medium transition-colors ${
                isDone
                  ? 'line-through text-gray-400'
                  : 'text-gray-900'
              }`}
            >
              {task.title}
            </span>

            {/* Source badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                task.source === 'notion'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-red-50 text-red-500'
              }`}
            >
              {task.source === 'notion' ? 'Notion' : 'Todoist'}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-1.5">
            {/* Status badge (only for in_progress) */}
            {task.status === 'in_progress' && (
              <span className="text-[11px] text-amber-600 font-medium">
                In Progress
              </span>
            )}

            {/* Due date */}
            {task.dueDate && (
              <span
                className={`text-xs ${
                  isOverdue(task.dueDate) && !isDone
                    ? 'text-red-500 font-medium'
                    : 'text-gray-400'
                }`}
              >
                {formatDate(task.dueDate)}
              </span>
            )}

            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <div className="flex items-center gap-1">
                {task.labels.map((label) => (
                  <span
                    key={label}
                    className="text-[10px] text-gray-400 bg-gray-50 rounded px-1.5 py-0.5"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={handleEdit}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            aria-label="Edit task"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
              />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            aria-label="Delete task"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded description */}
      {expanded && task.description && (
        <div className="mt-3 ml-9 pl-4 border-l-2 border-gray-100">
          <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">
            {task.description}
          </p>
        </div>
      )}
    </div>
  );
}
