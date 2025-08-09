"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const tasks_1 = __importDefault(require("./tasks"));
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.use('/api/tasks', tasks_1.default);
// Serve frontend build if present (for production)
const clientDistPath = path_1.default.resolve(process.cwd(), 'client', 'dist');
if ((0, fs_1.existsSync)(clientDistPath)) {
    app.use(express_1.default.static(clientDistPath));
    app.get(/^(?!\/api).*/, (_req, res) => {
        res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
    });
}
// Minimal error handler
app.use((err, _req, res, _next) => {
    const status = typeof err?.statusCode === 'number' ? err.statusCode : 500;
    const message = err?.message || 'Internal Server Error';
    if (status >= 500)
        console.error(err);
    res.status(status).json({ error: message });
});
exports.default = app;
