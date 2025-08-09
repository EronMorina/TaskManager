import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { z } from 'zod';

// Types
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Validation
const taskStatusSchema = z.enum(['todo', 'in_progress', 'done']);
const taskPrioritySchema = z.enum(['low', 'medium', 'high']);

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().max(2000).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueDate: z.string().datetime().optional(),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  dueDate: z.union([z.string().datetime(), z.null()]).optional(),
});

// File store
const DATA_DIR = path.resolve(process.cwd(), 'data');
const TASKS_FILE = path.resolve(DATA_DIR, 'tasks.json');

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(TASKS_FILE);
  } catch {
    await fs.writeFile(TASKS_FILE, '[]', 'utf-8');
  }
}

async function readTasks(): Promise<Task[]> {
  await ensureDataFile();
  const raw = await fs.readFile(TASKS_FILE, 'utf-8');
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as Task[]) : [];
  } catch {
    await fs.writeFile(TASKS_FILE, '[]', 'utf-8');
    return [];
  }
}

async function writeTasks(tasks: Task[]): Promise<void> {
  const tmp = TASKS_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(tasks, null, 2), 'utf-8');
  await fs.rename(tmp, TASKS_FILE);
}

// Router
const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const { status, priority, search } = req.query;
    const s = typeof status === 'string' ? status : undefined;
    const p = typeof priority === 'string' ? priority : undefined;
    const q = typeof search === 'string' ? search.toLowerCase() : undefined;
    const filtered = tasks.filter((t) => {
      if (s && t.status !== taskStatusSchema.parse(s)) return false;
      if (p && t.priority !== taskPrioritySchema.parse(p)) return false;
      if (q) {
        const hay = `${t.title} ${t.description ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    res.json(filtered);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const found = tasks.find((t) => t.id === req.params.id);
    if (!found) return res.status(404).json({ error: 'Task not found' });
    res.json(found);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const body = createTaskSchema.parse(req.body);
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      title: body.title,
      description: body.description?.trim() || undefined,
      status: body.status ?? 'todo',
      priority: body.priority ?? 'medium',
      dueDate: body.dueDate ?? undefined,
      createdAt: now,
      updatedAt: now,
    };
    const tasks = await readTasks();
    tasks.push(task);
    await writeTasks(tasks);
    res.status(201).json(task);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: 'ValidationError', details: err.errors });
    }
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const body = updateTaskSchema.parse(req.body);
    const tasks = await readTasks();
    const idx = tasks.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Task not found' });
    const existing = tasks[idx];
    const updated: Task = {
      ...existing,
      title: body.title ?? existing.title,
      description:
        body.description !== undefined
          ? body.description?.trim() || undefined
          : existing.description,
      status: body.status ?? existing.status,
      priority: body.priority ?? existing.priority,
      dueDate:
        body.dueDate === null
          ? undefined
          : body.dueDate !== undefined
          ? body.dueDate
          : existing.dueDate,
      updatedAt: new Date().toISOString(),
    };
    tasks[idx] = updated;
    await writeTasks(tasks);
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: 'ValidationError', details: err.errors });
    }
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const next = tasks.filter((t) => t.id !== req.params.id);
    if (next.length === tasks.length)
      return res.status(404).json({ error: 'Task not found' });
    await writeTasks(next);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;


