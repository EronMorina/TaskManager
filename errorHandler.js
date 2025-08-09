"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    const status = typeof err?.statusCode === 'number' ? err.statusCode : 500;
    const message = err?.message || 'Internal Server Error';
    if (status >= 500) {
        // eslint-disable-next-line no-console
        console.error(err);
    }
    res.status(status).json({ error: message });
}
