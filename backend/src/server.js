import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeSchema } from './utils/sqliteCloudClient.js';
import authRoutes from './routes/auth.routes.js';
import requestRoutes from './routes/request.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import locationRoutes from './routes/location.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import requestLinkRoutes from './routes/requestLink.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Initialize SQLite Cloud schema on startup
(async () => {
  try {
    console.log('🔄 Initializing SQLite Cloud database schema...');
    await initializeSchema();
    console.log('✅ SQLite Cloud database ready');
  } catch (error) {
    console.error('❌ Error initializing SQLite Cloud schema:', error);
    console.log('⚠️  Server will continue, but database operations may fail');
  }
})();

// Middleware
// CORS configuration - allow all origins
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/request-links', requestLinkRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`☁️  Using SQLite Cloud: ${process.env.SQLITE_CLOUD_URL}`);
});

export default app;
