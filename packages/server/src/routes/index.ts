import { Router } from 'express';
import itemsRouter from './item.route';
import feedRouter from './feed.route';

export const router = Router();

router.use('/items', itemsRouter);
router.use('/items/feeds', feedRouter);

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
