import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import crypto from 'crypto';
import fs from 'fs/promises';

export const FILE_CONSTANTS = {
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024, // 2GB
  MAX_FILES: 10,
  ALLOWED_TYPES: ['application/pdf', 'application/epub+zip'] as const,
  UPLOAD_DIR: path.join(process.cwd(), 'uploads')
} as const;

// 確保上傳目錄存在
const ensureUploadDir = async () => {
  try {
    await fs.access(FILE_CONSTANTS.UPLOAD_DIR);
    console.log('Upload directory exists:', FILE_CONSTANTS.UPLOAD_DIR);
  } catch (error) {
    console.log('Creating upload directory:', FILE_CONSTANTS.UPLOAD_DIR);
    await fs.mkdir(FILE_CONSTANTS.UPLOAD_DIR, { recursive: true });
  }
};

// 初始化上傳目錄
ensureUploadDir().catch(err => {
  console.error('Failed to create upload directory:', err);
  process.exit(1); // 如果無法創建目錄則終止程序
});

// 生成唯一文件名
const generateUniqueId = () => 
  crypto.randomBytes(8).toString('hex');

// 配置 multer storage
const storage = multer.diskStorage({
  destination: async (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    // 確保目錄存在
    try {
      await ensureUploadDir();
      cb(null, FILE_CONSTANTS.UPLOAD_DIR);
    } catch (error) {
      console.error('Error ensuring upload directory:', error);
      cb(error as Error, FILE_CONSTANTS.UPLOAD_DIR);
    }
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = `${Date.now()}-${generateUniqueId()}`;
    const ext = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// 文件類型驗證
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  console.log('Received file:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

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
  console.error('File upload error:', err);

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
    case 'LIMIT_UNEXPECTED_FILE':
      return {
        status: 400,
        message: 'Unexpected field in form data'
      };
    case 'ENOENT':
      return {
        status: 500,
        message: 'Server storage error. Please try again later.'
      };
    default:
      return {
        status: 400,
        message: err.message || 'File upload error'
      };
  }
};
