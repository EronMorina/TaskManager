"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const zod_1 = require("zod");
// Validation
const taskStatusSchema = zod_1.z.enum(['todo', 'in_progress', 'done']);
const taskPrioritySchema = zod_1.z.enum(['low', 'medium', 'high']);
const createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().max(2000).optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    dueDate: zod_1.z.string().datetime().optional(),
});
const updateTaskSchema = createTaskSchema.partial().extend({
    dueDate: zod_1.z.union([zod_1.z.string().datetime(), zod_1.z.null()]).optional(),
});
// File store
const DATA_DIR = path_1.default.resolve(process.cwd(), 'data');
const TASKS_FILE = path_1.default.resolve(DATA_DIR, 'tasks.json');
async function ensureDataFile() {
    await fs_1.promises.mkdir(DATA_DIR, { recursive: true });
    try {
        await fs_1.promises.access(TASKS_FILE);
    }
    catch {
        await fs_1.promises.writeFile(TASKS_FILE, '[]', 'utf-8');
    }
}
async function readTasks() {
    await ensureDataFile();
    const raw = await fs_1.promises.readFile(TASKS_FILE, 'utf-8');
    try {
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    }
    catch {
        await fs_1.promises.writeFile(TASKS_FILE, '[]', 'utf-8');
        return [];
    }
}
async function writeTasks(tasks) {
    const tmp = TASKS_FILE + '.tmp';
    await fs_1.promises.writeFile(tmp, JSON.stringify(tasks, null, 2), 'utf-8');
    await fs_1.promises.rename(tmp, TASKS_FILE);
}
// Router
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        const tasks = await readTasks();
        const { status, priority, search } = req.query;
        const s = typeof status === 'string' ? status : undefined;
        const p = typeof priority === 'string' ? priority : undefined;
        const q = typeof search === 'string' ? search.toLowerCase() : undefined;
        const filtered = tasks.filter((t) => {
            if (s && t.status !== taskStatusSchema.parse(s))
                return false;
            if (p && t.priority !== taskPrioritySchema.parse(p))
                return false;
            if (q) {
                const hay = `${t.title} ${t.description ?? ''}`.toLowerCase();
                if (!hay.includes(q))
                    return false;
            }
            return true;
        });
        res.json(filtered);
    }
    catch (err) {
        next(err);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const tasks = await readTasks();
        const found = tasks.find((t) => t.id === req.params.id);
        if (!found)
            return res.status(404).json({ error: 'Task not found' });
        res.json(found);
    }
    catch (err) {
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const body = createTaskSchema.parse(req.body);
        const now = new Date().toISOString();
        const task = {
            id: (0, crypto_1.randomUUID)(),
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
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
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
        if (idx === -1)
            return res.status(404).json({ error: 'Task not found' });
        const existing = tasks[idx];
        const updated = {
            ...existing,
            title: body.title ?? existing.title,
            description: body.description !== undefined
                ? body.description?.trim() || undefined
                : existing.description,
            status: body.status ?? existing.status,
            priority: body.priority ?? existing.priority,
            dueDate: body.dueDate === null
                ? undefined
                : body.dueDate !== undefined
                    ? body.dueDate
                    : existing.dueDate,
            updatedAt: new Date().toISOString(),
        };
        tasks[idx] = updated;
        await writeTasks(tasks);
        res.json(updated);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
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
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
