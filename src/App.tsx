import { useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import TaskFilters from './components/TaskFilters';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import type { TaskFilterState } from './components/TaskList';
import type { UnifiedTask } from './types/task';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function filtersFromURL(): TaskFilterState {
  const params = new URLSearchParams(window.location.search);
  return {
    source: (params.get('source') as TaskFilterState['source']) ?? 'all',
    status: (params.get('status') as TaskFilterState['status']) ?? 'all',
    priority: (params.get('priority') as TaskFilterState['priority']) ?? 'all',
    sortBy: (params.get('sortBy') as TaskFilterState['sortBy']) ?? 'dueDate',
  };
}

function AppContent() {
  const [filters, setFilters] = useState<TaskFilterState>(filtersFromURL);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<UnifiedTask | null>(null);

  const handleEditTask = useCallback((task: UnifiedTask) => {
    setEditingTask(task);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingTask(null);
  }, []);

  const handleNewTask = useCallback(() => {
    setEditingTask(null);
    setShowForm(true);
  }, []);

  return (
    <Layout>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage your tasks across Notion and Todoist
          </p>
        </div>
        <button
          onClick={handleNewTask}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <TaskFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Task list */}
      <TaskList filters={filters} onEditTask={handleEditTask} />

      {/* Task form modal */}
      {showForm && (
        <TaskForm task={editingTask} onClose={handleCloseForm} />
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AppContent />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#18181b',
              color: '#fff',
              fontSize: '13px',
              borderRadius: '10px',
              padding: '10px 16px',
            },
          }}
        />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
