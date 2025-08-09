import express from 'express';
import cors from 'cors';
import tasksRouter from './tasks';
import path from 'path';
import { existsSync } from 'fs';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/tasks', tasksRouter);

// Serve frontend build if present (for production)
const clientDistPath = path.resolve(process.cwd(), 'client', 'dist');
if (existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Minimal error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  const status = typeof err?.statusCode === 'number' ? err.statusCode : 500;
  const message = err?.message || 'Internal Server Error';
  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
});

export default app;


