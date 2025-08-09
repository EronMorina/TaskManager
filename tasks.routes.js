"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskService_1 = require("../services/taskService");
const validate_1 = require("../middleware/validate");
const taskSchemas_1 = require("../validation/taskSchemas");
const router = (0, express_1.Router)();
const service = new taskService_1.TaskService();
router.get('/', async (req, res, next) => {
    try {
        const { status, priority, search } = req.query;
        const parsedStatus = status ? taskSchemas_1.taskStatusSchema.parse(status) : undefined;
        const parsedPriority = priority
            ? taskSchemas_1.taskPrioritySchema.parse(priority)
            : undefined;
        const tasks = await service.listTasks({
            status: parsedStatus,
            priority: parsedPriority,
            search: typeof search === 'string' ? search : undefined,
        });
        res.json(tasks);
    }
    catch (err) {
        next(err);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const task = await service.getTask(req.params.id);
        if (!task)
            return res.status(404).json({ error: 'Task not found' });
        res.json(task);
    }
    catch (err) {
        next(err);
    }
});
router.post('/', (0, validate_1.validateBody)(taskSchemas_1.createTaskSchema), async (req, res, next) => {
    try {
        const created = await service.createTask(req.body);
        res.status(201).json(created);
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', (0, validate_1.validateBody)(taskSchemas_1.updateTaskSchema), async (req, res, next) => {
    try {
        const updated = await service.updateTask(req.params.id, req.body);
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        await service.deleteTask(req.params.id);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
