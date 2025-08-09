"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskFileStore = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.resolve(process.cwd(), 'data');
const TASKS_FILE = path_1.default.resolve(DATA_DIR, 'tasks.json');
async function ensureDataFileExists() {
    try {
        await fs_1.promises.mkdir(DATA_DIR, { recursive: true });
        await fs_1.promises.access(TASKS_FILE);
    }
    catch {
        await fs_1.promises.writeFile(TASKS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
}
class TaskFileStore {
    async readAll() {
        await ensureDataFileExists();
        const raw = await fs_1.promises.readFile(TASKS_FILE, 'utf-8');
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            // If corrupted, reset to empty
            await this.writeAll([]);
            return [];
        }
    }
    async writeAll(tasks) {
        await ensureDataFileExists();
        const tmpFile = TASKS_FILE + '.tmp';
        await fs_1.promises.writeFile(tmpFile, JSON.stringify(tasks, null, 2), 'utf-8');
        await fs_1.promises.rename(tmpFile, TASKS_FILE);
    }
    async findById(taskId) {
        const tasks = await this.readAll();
        return tasks.find((t) => t.id === taskId);
    }
    async save(newTask) {
        const tasks = await this.readAll();
        tasks.push(newTask);
        await this.writeAll(tasks);
        return newTask;
    }
    async update(updatedTask) {
        const tasks = await this.readAll();
        const index = tasks.findIndex((t) => t.id === updatedTask.id);
        if (index === -1) {
            throw Object.assign(new Error('Task not found'), { statusCode: 404 });
        }
        tasks[index] = updatedTask;
        await this.writeAll(tasks);
        return updatedTask;
    }
    async deleteById(taskId) {
        const tasks = await this.readAll();
        const next = tasks.filter((t) => t.id !== taskId);
        await this.writeAll(next);
    }
}
exports.TaskFileStore = TaskFileStore;
