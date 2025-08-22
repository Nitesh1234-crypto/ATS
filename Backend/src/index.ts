import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { registerV1Routes } from './api/v1/routes';
import { getEnv } from './utils/env';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: true }));

app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

registerV1Routes(app);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = Number(getEnv('PORT', '8000'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ATS Scoring API listening on port ${PORT}`);
}); 