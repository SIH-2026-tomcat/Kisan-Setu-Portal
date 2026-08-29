import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { ENV } from './config/env';
import { checkDatabaseConnection } from './config/db';

import authRoutes from './routes/authRoutes';
import centreRoutes from './routes/centreRoutes';
import bookingRoutes from './routes/bookingRoutes';
import queueRoutes from './routes/queueRoutes';
import officerRoutes from './routes/officerRoutes';
import farmerRoutes from './routes/farmerRoutes';

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible integration for local dev
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Restricted CORS
app.use(
  cors({
    origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request body parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Kisan Setu API Service',
    timestamp: new Date().toISOString(),
    tagline: 'Smart Procurement. Less Waiting. Better Farming.',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/centres', centreRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/farmer', farmerRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found on Kisan Setu server.`,
  });
});

// Global Error Handler (Security: never leak stack trace or internal database credentials)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Application Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message =
    ENV.NODE_ENV === 'production'
      ? 'An unexpected service error occurred. Please try again later.'
      : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(ENV.NODE_ENV === 'development' && { errorType: err.name }),
  });
});

// Start Server
const server = app.listen(ENV.PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 Kisan Setu Server running on port ${ENV.PORT}`);
  console.log(`🌾 "Smart Procurement. Less Waiting. Better Farming."`);
  console.log(`🔗 API Base: http://localhost:${ENV.PORT}/api`);
  console.log(`💻 Client Allowed Origin: ${ENV.CLIENT_URL}`);
  console.log(`====================================================`);

  const dbConnected = await checkDatabaseConnection();
  if (dbConnected) {
    console.log('✅ Connected to MySQL database (kisan_setu).');
  } else {
    console.warn('⚠️ MySQL connection pending. Please ensure MySQL is started and configured.');
  }
});

export default app;
