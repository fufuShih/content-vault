import { Router, Request, Response, NextFunction } from 'express';
import { feedService } from '../services/feed.service';

const router = Router();

const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 添加新的訂閱源
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { feedUrl, fetchInterval } = req.body;
    
    if (!feedUrl) {
      return res.status(400).json({ message: 'Feed URL is required' });
    }

    const newFeed = await feedService.addFeed(feedUrl, fetchInterval);
    return res.status(201).json(newFeed);
  } catch (error) {
    return res.status(400).json({ 
      message: error instanceof Error ? error.message : 'Failed to add feed' 
    });
  }
}));

// 獲取所有訂閱源
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const feeds = await feedService.getAllFeeds();
    return res.json(feeds);
  } catch (error) {
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to get feeds' 
    });
  }
}));

// 刪除訂閱源
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const isDeleted = await feedService.deleteFeed(id);
    
    if (!isDeleted) {
      return res.status(404).json({ message: 'Feed not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to delete feed' 
    });
  }
}));

// 手動刷新指定訂閱
router.post('/:id/refresh', asyncHandler(async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await feedService.refreshFeed(id);
    return res.json({ message: 'Feed refreshed successfully' });
  } catch (error) {
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to refresh feed' 
    });
  }
}));

// 刷新所有訂閱
router.post('/refresh/all', asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await feedService.refreshAllFeeds();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to refresh feeds' 
    });
  }
}));

// 獲取指定訂閱的所有文章
router.get('/:id/entries', asyncHandler(async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const entries = await feedService.getFeedEntries(id);
    return res.json(entries);
  } catch (error) {
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to get feed entries' 
    });
  }
}));

export default router;
