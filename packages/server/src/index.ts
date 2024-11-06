import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { router } from './routes';
import { errorHandler } from './middleware/error-handler';
import fs from "fs";
import { FILE_CONSTANTS } from './middleware/upload.middleware';
import path from 'path';

config();

const app = express();
const port = process.env.PORT || 3000;

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Vite 默認端口
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range']
}));

// Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:5173"],
      frameSrc: ["'self'", "http://localhost:5173"],
      imgSrc: ["'self'", "data:", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      objectSrc: ["'self'"],
      mediaSrc: ["'self'"],
    },
  },
}));

// Static
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, path) => {
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=3600',
      'Accept-Ranges': 'bytes',
    });
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', router);

// Error handling
app.use(errorHandler);

const startServer = async () => {
  try {
    // create upload dir
    if (!fs.existsSync(FILE_CONSTANTS.UPLOAD_DIR)) {
      console.log('Creating upload directory:', FILE_CONSTANTS.UPLOAD_DIR);
      await fs.promises.mkdir(FILE_CONSTANTS.UPLOAD_DIR, { recursive: true });
    }

    // check the permission
    await fs.promises.access(FILE_CONSTANTS.UPLOAD_DIR, fs.constants.W_OK);

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Upload directory: ${FILE_CONSTANTS.UPLOAD_DIR}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();
