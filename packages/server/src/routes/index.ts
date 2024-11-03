import { Router } from 'express';
import itemsRouter from './item.route';

export const router = Router();

router.use('/items', itemsRouter);

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
