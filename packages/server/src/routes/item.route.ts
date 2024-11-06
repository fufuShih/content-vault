// packages/server/src/routes/item.route.ts
import { Router, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { itemsService } from '../services/item.service';
import { upload, handleUploadError, FILE_CONSTANTS } from '../middleware/upload.middleware';
import { createReadStream } from 'fs';
import multer from 'multer';

const router = Router();

// 修正 asyncHandler 類型定義
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 基本 CRUD 路由
router.get('/', asyncHandler(async (req: Request, res: Response) => {
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

  return res.json(result);
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const item = await itemsService.findById(id);

  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }

  return res.json(item);
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const newItem = await itemsService.create(req.body);
  return res.status(201).json(newItem);
}));

router.patch('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const updatedItem = await itemsService.update(id, req.body);

  if (!updatedItem) {
    return res.status(404).json({ message: 'Item not found' });
  }

  return res.json(updatedItem);
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const isDeleted = await itemsService.delete(id);

  if (!isDeleted) {
    return res.status(404).json({ message: 'Item not found' });
  }

  return res.status(204).send();
}));

// 改善資源讀取路由以支援 Range Request
router.get('/:id/resource', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const resource = await itemsService.getResource(id);

  if (!resource) {
    return res.status(404).json({ message: 'Resource not found' });
  }

  const { filePath, mimeType, stats } = resource;

  // 設置必要的響應頭
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('Content-Disposition', 'inline');

  // 處理 Range Request
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
    const chunkSize = (end - start) + 1;

    if (start >= stats.size || end >= stats.size) {
      res.status(416).send('Requested range not satisfiable');
      return;
    }

    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
    res.setHeader('Content-Length', chunkSize);

    const fileStream = createReadStream(filePath, { start, end });
    fileStream.pipe(res);
  } else {
    // 如果不是 Range Request，發送整個文件
    res.setHeader('Content-Length', stats.size);
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  }
}));

// 文件操作路由
router.post('/scan', asyncHandler(async (req: Request, res: Response) => {
  const scanStats = await itemsService.scanDirectory();
  return res.json(scanStats);
}));

// 文件上傳處理
const handleFileUpload = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file && !req.files) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// 單文件上傳
router.post('/upload', (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, async (err) => {
    try {
      if (err) {
        const { status, message } = handleUploadError(err);
        return res.status(status).json({ message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const result = await itemsService.uploadFile(req.file);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }

      return res.status(201).json(result.item);
    } catch (error) {
      next(error);
    }
  });
});

// 批量上傳
router.post('/upload/batch', (req: Request, res: Response, next: NextFunction) => {
  upload.array('files', FILE_CONSTANTS.MAX_FILES)(req, res, async (err) => {
    try {
      if (err) {
        const { status, message } = handleUploadError(err);
        return res.status(status).json({ message });
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const results = await itemsService.uploadFiles(req.files);
      
      const summary = {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      };

      return res.status(summary.failed === 0 ? 201 : 207).json({ results, summary });
    } catch (error) {
      next(error);
    }
  });
});


const errorHandler: ErrorRequestHandler = (err, req, res, next): void => {
  console.error('Error:', err);

  if (err instanceof multer.MulterError) {
    const { status, message } = handleUploadError(err);
    res.status(status).json({ message });
    return;
  }

  if (err.status) {
    res.status(err.status).json({ message: err.message });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
};

// 使用錯誤處理中間件
router.use(errorHandler);

export default router;
