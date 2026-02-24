# my_todoo

A unified task manager that consolidates **Notion** and **Todoist** tasks into a single, clean, minimalist UI.

Built with React, TypeScript, Tailwind CSS, and Express.

## Prerequisites

- **Node.js 22+** (an `.nvmrc` is included)
- **npm 10+**
- A [Notion integration](https://www.notion.so/my-integrations) with access to your tasks database
- A [Todoist API token](https://todoist.com/help/articles/find-your-api-token-Jpzx9IIlB) (Settings > Integrations > Developer)

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/ayfor/my_todoo.git
cd my_todoo
```

### 2. Use the correct Node version

```bash
nvm use
```

If you don't have Node 22 installed:

```bash
nvm install 22
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

| Variable | Description | Where to get it |
|---|---|---|
| `NOTION_API_KEY` | Notion integration token | [notion.so/my-integrations](https://www.notion.so/my-integrations) |
| `NOTION_DATABASE_ID` | ID of your Notion tasks database | Copy from the database URL (the long ID after your workspace name and before the `?v=`) |
| `TODOIST_API_TOKEN` | Todoist personal API token | Todoist Settings > Integrations > Developer |

### 5. Notion database setup

Your Notion database should have the following properties (names are case-sensitive):

| Property | Type | Values |
|---|---|---|
| **Name** | Title | (task title) |
| **Status** | Status | To Do, In Progress, Done |
| **Priority** | Select | Urgent, High, Medium, Low |
| **Description** | Rich text | (optional) |
| **Due** | Date | (optional) |
| **Tags** | Multi-select | (optional) |
| **Project** | Select | (optional) |

Make sure your Notion integration has been invited to the database (Share > Invite > select your integration).

## Running locally

Start both the frontend and backend dev servers:

```bash
npm run dev
```

This runs two processes concurrently:
- **Frontend** (Vite): [http://localhost:5173](http://localhost:5173)
- **Backend** (Express API): [http://localhost:3001](http://localhost:3001)

You can also run them separately:

```bash
npm run dev:client   # Vite dev server only
npm run dev:server   # Express API server only
```

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend + backend concurrently |
| `npm run dev:client` | Start Vite dev server only |
| `npm run dev:server` | Start Express API server only |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |

## Project structure

```
my_todoo/
├── server/
│   └── index.ts            # Express API server (port 3001)
├── src/
│   ├── api/
│   │   ├── notion.ts        # Notion API connector (CRUD + pagination)
│   │   ├── todoist.ts       # Todoist API connector (CRUD)
│   │   ├── unified.ts       # Normalizers: Notion/Todoist -> UnifiedTask
│   │   └── taskService.ts   # Aggregated service with caching
│   ├── components/
│   │   ├── Layout.tsx        # App shell
│   │   ├── TaskList.tsx      # Main task list view
│   │   ├── TaskItem.tsx      # Individual task row
│   │   ├── TaskFilters.tsx   # Filter/sort controls
│   │   ├── TaskForm.tsx      # Create/edit modal
│   │   └── ErrorBoundary.tsx # Error boundary
│   ├── hooks/
│   │   └── useTasks.ts       # React Query wrapper
│   ├── types/
│   │   └── task.ts           # UnifiedTask schema
│   ├── utils/
│   │   └── filterTasks.ts    # Filter/sort logic
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## Architecture

```
┌──────────────────────────────────────┐
│    Frontend (React + Tailwind CSS)   │
│  TaskList │ TaskFilters │ TaskForm   │
└──────────────────┬───────────────────┘
                   │ HTTP (fetch)
┌──────────────────▼───────────────────┐
│     Express API Server (:3001)       │
│   GET/POST/PATCH/DELETE /api/tasks   │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│     Task Service (unified layer)     │
│   Caching • Routing • Aggregation   │
└─────────┬──────────────┬────────────┘
          │              │
    ┌─────▼─────┐  ┌─────▼──────┐
    │ Notion API│  │Todoist API │
    └───────────┘  └────────────┘
```

## Tech stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, TanStack Query
- **Backend**: Express 5, Node.js 22
- **Testing**: Vitest, React Testing Library
- **Build**: Vite 7
