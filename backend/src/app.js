import express from 'express';
import publicRoutes from './routes/public.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', publicRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

export default app;
