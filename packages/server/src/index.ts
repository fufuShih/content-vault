import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { router } from './routes';
import { errorHandler } from './middleware/error-handler';

config();

const app = express();
const port = process.env.PORT || 3000;

// CORS 設置
app.use(cors({
  origin: 'http://localhost:5173', // Vite 默認端口
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range']
}));

// Helmet 設置
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:3000"],
      imgSrc: ["'self'", "blob:", "data:"],
      workerSrc: ["'self'", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:"],
    }
  }
}));

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
app.use('/api', router);

// Error handling
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
