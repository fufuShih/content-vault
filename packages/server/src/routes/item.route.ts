import { Router } from 'express';
import { itemsService } from '../services/item.service';

const router = Router();

router.get('/', (req, res, next) => {
  (async () => {
    try {
      const page = parseInt(req.query.page as string || '1');
      const limit = Math.min(parseInt(req.query.limit as string || '10'), 100);
      const search = req.query.search as string;
      const type = req.query.type as string;

      const result = await itemsService.findAll({
        page,
        limit,
        search,
        type,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  })();
});

router.get('/:id', (req, res, next) => {
  (async () => {
    try {
      const id = parseInt(req.params.id);
      const item = await itemsService.findById(id);

      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      res.json(item);
    } catch (error) {
      next(error);
    }
  })();
});

router.post('/', (req, res, next) => {
  (async () => {
    try {
      const newItem = await itemsService.create(req.body);
      res.status(201).json(newItem);
    } catch (error) {
      next(error);
    }
  })();
});

router.patch('/:id', (req, res, next) => {
  (async () => {
    try {
      const id = parseInt(req.params.id);
      const updatedItem = await itemsService.update(id, req.body);

      if (!updatedItem) {
        return res.status(404).json({ message: 'Item not found' });
      }

      res.json(updatedItem);
    } catch (error) {
      next(error);
    }
  })();
});

router.delete('/:id', (req, res, next) => {
  (async () => {
    try {
      const id = parseInt(req.params.id);
      const isDeleted = await itemsService.delete(id);

      if (!isDeleted) {
        return res.status(404).json({ message: 'Item not found' });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  })();
});

export default router;
