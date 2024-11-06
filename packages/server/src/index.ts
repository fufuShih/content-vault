import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { router } from './routes';
import { errorHandler } from './middleware/error-handler';
import path from 'path';

config();

const app = express();
const port = process.env.PORT || 3000;

// CORS 設置
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Vite 默認端口
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range']
}));

// Helmet 設置
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', router);

// Error handling
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
