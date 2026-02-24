import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import toast from 'react-hot-toast';
import type { UnifiedTask, TaskStatus, TaskPriority, TaskSource } from '../types/task';
import { useTasks } from '../hooks/useTasks';

interface TaskFormProps {
  task?: UnifiedTask | null;
  onClose: () => void;
}

export default function TaskForm({ task, onClose }: TaskFormProps) {
  const isEditing = !!task;
  const { createTask, updateTask } = useTasks();

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [source, setSource] = useState<TaskSource>(task?.source ?? 'todoist');
  const [titleError, setTitleError] = useState(false);

  // Reset form when task prop changes
  useEffect(() => {
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setStatus(task?.status ?? 'todo');
    setPriority(task?.priority ?? 'medium');
    setDueDate(task?.dueDate ?? '');
    setSource(task?.source ?? 'todoist');
    setTitleError(false);
  }, [task]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError(true);
      return;
    }

    if (isEditing && task) {
      updateTask.mutate(
        {
          id: task.id,
          source: task.source,
          sourceId: task.sourceId,
          updates: {
            title: trimmedTitle,
            description: description.trim() || undefined,
            status,
            priority,
            dueDate: dueDate || undefined,
          },
        },
        {
          onSuccess: () => {
            toast.success('Task updated');
            onClose();
          },
          onError: (err) => {
            toast.error(`Failed to update: ${err.message}`);
          },
        },
      );
    } else {
      createTask.mutate(
        {
          title: trimmedTitle,
          description: description.trim() || undefined,
          status,
          priority,
          dueDate: dueDate || undefined,
          source,
        },
        {
          onSuccess: () => {
            toast.success('Task created');
            onClose();
          },
          onError: (err) => {
            toast.error(`Failed to create: ${err.message}`);
          },
        },
      );
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Task' : 'New Task'}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isEditing
              ? 'Update the task details below'
              : 'Fill in the details to create a new task'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label
              htmlFor="task-title"
              className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5"
            >
              Title
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(false);
              }}
              placeholder="What needs to be done?"
              className={`w-full px-3.5 py-2.5 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                titleError
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-gray-100 focus:ring-gray-200 focus:border-gray-200'
              }`}
              autoFocus
            />
            {titleError && (
              <p className="mt-1 text-xs text-red-500">Title is required</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="task-description"
              className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5"
            >
              Description
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 resize-none transition-colors"
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-status"
                className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5"
              >
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                }}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="task-priority"
                className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                }}
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Due Date + Source row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-due-date"
                className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5"
              >
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
              />
            </div>

            {!isEditing && (
              <div>
                <label
                  htmlFor="task-source"
                  className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5"
                >
                  Source
                </label>
                <select
                  id="task-source"
                  value={source}
                  onChange={(e) => setSource(e.target.value as TaskSource)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                  }}
                >
                  <option value="todoist">Todoist</option>
                  <option value="notion">Notion</option>
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isPending
                ? 'Saving...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
