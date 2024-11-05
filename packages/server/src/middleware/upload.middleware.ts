// packages/server/src/middleware/upload.middleware.ts
import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import crypto from 'crypto';

// Constants
export const FILE_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  MAX_FILES: 10,
  ALLOWED_TYPES: ['application/pdf'] as const,
  UPLOAD_DIR: path.join(process.cwd(), 'data')
} as const;

// 生成唯一文件名
const generateUniqueId = () => 
  crypto.randomBytes(8).toString('hex');

// 配置 multer storage
const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, FILE_CONSTANTS.UPLOAD_DIR);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = `${Date.now()}-${generateUniqueId()}`;
    const ext = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// 文件類型驗證
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (FILE_CONSTANTS.ALLOWED_TYPES.includes(file.mimetype as typeof FILE_CONSTANTS.ALLOWED_TYPES[number])) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${FILE_CONSTANTS.ALLOWED_TYPES.join(', ')} are allowed.`));
  }
};

// 創建 multer 實例
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_CONSTANTS.MAX_FILE_SIZE,
    files: FILE_CONSTANTS.MAX_FILES
  }
});

// Error types
export interface FileUploadError extends Error {
  code?: string;
}

// 上傳錯誤處理
export const handleUploadError = (err: FileUploadError) => {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return {
        status: 413,
        message: `File too large. Maximum size is ${FILE_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    case 'LIMIT_FILE_COUNT':
      return {
        status: 400,
        message: `Too many files. Maximum is ${FILE_CONSTANTS.MAX_FILES} files per upload`
      };
    default:
      return {
        status: 400,
        message: err.message || 'File upload error'
      };
  }
};
