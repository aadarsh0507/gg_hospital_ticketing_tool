import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeSchema } from './utils/sqliteCloudClient.js';
import authRoutes from './routes/auth.routes.js';
import requestRoutes from './routes/request.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import locationRoutes from './routes/location.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import requestLinkRoutes from './routes/requestLink.routes.js';
import serviceRoutes from './routes/service.routes.js';
import userRoutes from './routes/user.routes.js';
import systemSettingsRoutes from './routes/systemSettings.routes.js';

const execAsync = promisify(exec);
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Function to kill process on a specific port (Windows)
async function killProcessOnPort(port) {
  try {
    // Find process using the port
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    
    if (!stdout || stdout.trim().length === 0) {
      // No process found on port
      return false;
    }
    
    const lines = stdout.trim().split('\n');
    let killedAny = false;
    
    for (const line of lines) {
      if (line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        
        if (pid && !isNaN(pid)) {
          try {
            await execAsync(`taskkill /PID ${pid} /F`);
            console.log(`✅ Killed process ${pid} using port ${port}`);
            killedAny = true;
          } catch (killError) {
            // Process might have already been killed or doesn't exist
            // This is fine, continue checking other processes
          }
        }
      }
    }
    
    if (killedAny) {
      // Wait a bit for the port to be released
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    }
    
    return false;
  } catch (error) {
    // No process found on port or command failed, that's fine
    // This is expected if the port is free
    return false;
  }
}

// Initialize database schema on startup
(async () => {
  try {
    // First ensure Prisma tables exist
    console.log('🔄 Ensuring Prisma database tables exist...');
    try {
      const { ensureTables } = await import('../scripts/ensure-tables.js');
      await ensureTables();
      console.log('✅ Prisma database tables ready');
    } catch (ensureError) {
      // Script may have already run or there's a minor issue, continue
      console.log('ℹ️  Table check completed (some tables may already exist)');
    }
    
    // Then initialize SQLite Cloud schema
    console.log('🔄 Initializing SQLite Cloud database schema...');
    await initializeSchema();
    console.log('✅ SQLite Cloud database ready');
  } catch (error) {
    console.error('❌ Error initializing database schema:', error);
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
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/system-settings', systemSettingsRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server with port conflict handling
let serverInstance = null;
let isStarting = false;

async function startServer() {
  if (isStarting) {
    console.log('⏳ Server start already in progress, waiting...');
    return;
  }
  
  isStarting = true;
  
  try {
    // Try to kill any existing process on the port before starting
    await killProcessOnPort(PORT);
    
    // Handle server errors (including port conflicts)
    serverInstance = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`☁️  Using SQLite Cloud: ${process.env.SQLITE_CLOUD_URL}`);
      isStarting = false;
    });
    
    serverInstance.on('error', async (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${PORT} is in use, attempting to free it...`);
        const killed = await killProcessOnPort(PORT);
        
        if (killed) {
          // Wait a bit for the port to be released, then retry
          isStarting = false;
          setTimeout(async () => {
            console.log(`🔄 Retrying to start server on port ${PORT}...`);
            await startServer();
          }, 1000);
        } else {
          console.error(`❌ Could not free port ${PORT}. Please manually kill the process using the port.`);
          console.error(`   Run: netstat -ano | findstr :${PORT} to find the PID, then: taskkill /PID <PID> /F`);
          isStarting = false;
          process.exit(1);
        }
      } else {
        console.error('❌ Error starting server:', error);
        isStarting = false;
        process.exit(1);
      }
    });
    
    return serverInstance;
  } catch (error) {
    isStarting = false;
    console.error('❌ Error in startServer:', error);
    throw error;
  }
}

startServer();

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (serverInstance) {
    serverInstance.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejection, just log it
});

export default app;
