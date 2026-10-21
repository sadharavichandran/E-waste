import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config();

import { connectToDatabase } from './config/db';
import { initWebSocketServer } from './services/websocketService';
import { authenticate } from './middleware/auth';

// Route handlers
import authRoutes from './routes/authRoutes';
import centreRoutes from './routes/centreRoutes';
import requestRoutes from './routes/requestRoutes';
import activityRoutes from './routes/activityRoutes';
import systemRoutes, { provisionDefaultSuperAdmin } from './routes/systemRoutes';

const app = express();
const server = http.createServer(app);

// Initialize real-time WebSocket server
initWebSocketServer(server);

// Middleware configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost dev servers and requests with no origin (e.g. mobile apps, curl)
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Global session authentication loader (attaches req.user if valid token/cookie present)
app.use(authenticate);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/centres', centreRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/system', systemRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'EcoLoop Backend API',
    engine: 'Node.js Express + MongoDB',
    timestamp: new Date().toISOString(),
  });
});

const PORT = parseInt(process.env.PORT || '5001', 10);

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    const connected = await connectToDatabase();
    if (connected) {
      // 2. Provision default SuperAdmin if not already present
      await provisionDefaultSuperAdmin();
    } else {
      console.warn('[MongoDB] Server started in offline/standby mode. Will retry connection on request.');
    }

    // 3. Start HTTP + WebSocket Server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`=================================================`);
      console.log(` EcoLoop MongoDB Server Running on Port ${PORT}`);
      console.log(` API Endpoint:       http://localhost:${PORT}/api`);
      console.log(` WebSocket Realtime: ws://localhost:${PORT}/ws`);
      console.log(` Database:           MongoDB (${connected ? 'Connected' : 'Offline'})`);
      console.log(`=================================================`);
    });
  } catch (err) {
    console.error('Fatal Server Startup Error:', err);
  }
};

startServer();

export { app, server };
