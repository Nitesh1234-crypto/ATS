import { Express } from 'express';
import { atsRouter } from './score';

export function registerV1Routes(app: Express): void {
  app.use('/api/v1/ats', atsRouter);
} 