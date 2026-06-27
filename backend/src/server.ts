/**
 * Verifeed API Server
 * Express backend for claim verification
 */

// CRITICAL: Load env config FIRST!
import './config/env';

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import verifyRouter from './routes/verify';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Request logging
app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Verifeed API',
    version: '0.1.0',
    phase: 2,
    description: 'Real-time fact-checking backend',
    endpoints: {
      verify: 'POST /verify',
      health: 'GET /health',
    },
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Simple test endpoint
app.post('/test-simple', (req: Request, res: Response) => {
  console.log('[Test] Received test request');
  const response = { message: 'Simple test works', timestamp: Date.now() };
  console.log('[Test] Sending:', response);
  res.json(response);
  console.log('[Test] Response sent');
});

// Even simpler test
app.get('/ping', (req: Request, res: Response) => {
  console.log('[Ping] Received');
  res.send('pong');
  console.log('[Ping] Sent');
});

// Verification endpoint
app.use('/verify', verifyRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════╗');
  console.log('║                                       ║');
  console.log('║        Verifeed API Server            ║');
  console.log('║                                       ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Phase: 2 (Backend + Data Flow)`);
  console.log(`🧪 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  - GET  http://localhost:${PORT}/`);
  console.log(`  - GET  http://localhost:${PORT}/health`);
  console.log(`  - POST http://localhost:${PORT}/verify`);
  console.log('');
});

export default app;
