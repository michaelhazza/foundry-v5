import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { env, isProduction } from './config/env';
import { closeDatabase } from './db';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { standardLimiter } from './middleware/rate-limit';
import routes from './routes';
import logger from './lib/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
}));

// CORS configuration
app.use(cors({
  origin: isProduction
    ? true // Allow same origin in production
    : ['http://localhost:5000', 'http://127.0.0.1:5000'],
  credentials: true,
}));

// Request parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Rate limiting (applied to all routes)
app.use(standardLimiter);

// Health check endpoint (no auth required)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', routes);

// Serve static files in production
if (isProduction) {
  const publicPath = path.join(__dirname, '../dist/public');
  app.use(express.static(publicPath));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// 404 handler for unknown API routes
app.use('/api/*', notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = isProduction ? 5000 : env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
});

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await closeDatabase();
      logger.info('Database connection closed');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
