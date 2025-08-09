"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskSchema = exports.createTaskSchema = exports.taskPrioritySchema = exports.taskStatusSchema = void 0;
const zod_1 = require("zod");
exports.taskStatusSchema = zod_1.z.enum(['todo', 'in_progress', 'done']);
exports.taskPrioritySchema = zod_1.z.enum(['low', 'medium', 'high']);
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'title is required'),
    description: zod_1.z.string().max(2000).optional(),
    status: exports.taskStatusSchema.optional(),
    priority: exports.taskPrioritySchema.optional(),
    dueDate: zod_1.z
        .string()
        .datetime({ message: 'dueDate must be an ISO datetime string' })
        .optional(),
});
exports.updateTaskSchema = exports.createTaskSchema.partial().extend({
    dueDate: zod_1.z
        .union([
        zod_1.z
            .string()
            .datetime({ message: 'dueDate must be an ISO datetime string' }),
        zod_1.z.null(),
    ])
        .optional(),
});
