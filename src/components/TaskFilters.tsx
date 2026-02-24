import type { TaskFilterState } from './TaskList';

interface TaskFiltersProps {
  filters: TaskFilterState;
  onChange: (filters: TaskFilterState) => void;
}

function PillButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer ${
        active
          ? 'bg-gray-900 text-white shadow-sm'
          : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

export default function TaskFilters({ filters, onChange }: TaskFiltersProps) {
  const updateFilter = <K extends keyof TaskFilterState>(
    key: K,
    value: TaskFilterState[K],
  ) => {
    const next = { ...filters, [key]: value };
    onChange(next);

    // Sync to URL
    const params = new URLSearchParams(window.location.search);
    if (value === 'all' || value === 'dueDate') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {/* Source filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mr-1">
          Source
        </span>
        {(['all', 'notion', 'todoist'] as const).map((val) => (
          <PillButton
            key={val}
            label={val === 'all' ? 'All' : val === 'notion' ? 'Notion' : 'Todoist'}
            active={filters.source === val}
            onClick={() => updateFilter('source', val)}
          />
        ))}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mr-1">
          Status
        </span>
        {(['all', 'todo', 'in_progress', 'done'] as const).map((val) => {
          const labels: Record<string, string> = {
            all: 'All',
            todo: 'To Do',
            in_progress: 'In Progress',
            done: 'Done',
          };
          return (
            <PillButton
              key={val}
              label={labels[val]}
              active={filters.status === val}
              onClick={() => updateFilter('status', val)}
            />
          );
        })}
      </div>

      {/* Priority dropdown */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mr-1">
          Priority
        </span>
        <select
          value={filters.priority}
          onChange={(e) =>
            updateFilter(
              'priority',
              e.target.value as TaskFilterState['priority'],
            )
          }
          className="text-xs bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer appearance-none pr-7"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          <option value="all">All</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Sort dropdown */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mr-1">
          Sort
        </span>
        <select
          value={filters.sortBy}
          onChange={(e) =>
            updateFilter(
              'sortBy',
              e.target.value as TaskFilterState['sortBy'],
            )
          }
          className="text-xs bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer appearance-none pr-7"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          <option value="dueDate">Due Date</option>
          <option value="createdAt">Created</option>
          <option value="updatedAt">Updated</option>
          <option value="priority">Priority</option>
        </select>
      </div>
    </div>
  );
}
