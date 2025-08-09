"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const crypto_1 = require("crypto");
const fileStore_1 = require("../store/fileStore");
class TaskService {
    constructor(store = new fileStore_1.TaskFileStore()) {
        this.store = store;
    }
    async listTasks(query) {
        const tasks = await this.store.readAll();
        return tasks.filter((t) => {
            if (query.status && t.status !== query.status)
                return false;
            if (query.priority && t.priority !== query.priority)
                return false;
            if (query.search) {
                const q = query.search.toLowerCase();
                const hay = `${t.title} ${t.description ?? ''}`.toLowerCase();
                if (!hay.includes(q))
                    return false;
            }
            return true;
        });
    }
    async getTask(taskId) {
        return this.store.findById(taskId);
    }
    async createTask(input) {
        const now = new Date().toISOString();
        const task = {
            id: (0, crypto_1.randomUUID)(),
            title: input.title,
            description: input.description?.trim() || undefined,
            status: input.status ?? 'todo',
            priority: input.priority ?? 'medium',
            dueDate: input.dueDate ?? undefined,
            createdAt: now,
            updatedAt: now,
        };
        return this.store.save(task);
    }
    async updateTask(taskId, input) {
        const existing = await this.store.findById(taskId);
        if (!existing) {
            throw Object.assign(new Error('Task not found'), { statusCode: 404 });
        }
        const updated = {
            ...existing,
            title: input.title ?? existing.title,
            description: input.description !== undefined
                ? input.description?.trim() || undefined
                : existing.description,
            status: input.status ?? existing.status,
            priority: input.priority ?? existing.priority,
            dueDate: input.dueDate === null
                ? undefined
                : input.dueDate !== undefined
                    ? input.dueDate
                    : existing.dueDate,
            updatedAt: new Date().toISOString(),
        };
        return this.store.update(updated);
    }
    async deleteTask(taskId) {
        const existing = await this.store.findById(taskId);
        if (!existing) {
            throw Object.assign(new Error('Task not found'), { statusCode: 404 });
        }
        await this.store.deleteById(taskId);
    }
}
exports.TaskService = TaskService;
