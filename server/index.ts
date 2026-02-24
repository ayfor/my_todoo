import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  refreshTasks,
} from '../src/api/taskService.ts';
import type { TaskSource, UnifiedTask, UpdateTaskInput } from '../src/types/task.ts';

const app = express();
const PORT = 3001;

app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
);
app.use(express.json());

// GET /api/tasks
app.get('/api/tasks', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await getAllTasks();
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks
app.post('/api/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { source, ...taskInput } = req.body as { source: TaskSource } & Record<string, unknown>;
    const task = await createTask(source, taskInput as Parameters<typeof createTask>[1]);
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:id
app.patch('/api/tasks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { source, sourceId, ...updates } = req.body as {
      source: TaskSource;
      sourceId: string;
    } & UpdateTaskInput;

    const taskStub = { source, sourceId } as UnifiedTask;
    const task = await updateTask(taskStub, updates);
    res.json({ task });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const source = req.query.source as TaskSource;
    const sourceId = req.query.sourceId as string;
    const taskStub = { source, sourceId } as UnifiedTask;
    await deleteTask(taskStub);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks/refresh
app.post('/api/tasks/refresh', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    refreshTasks();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use((err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err.message);
  const statusCode = err.statusCode ?? 500;
  res.status(statusCode).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`my_todoo API server running on http://localhost:${PORT}`);
});
