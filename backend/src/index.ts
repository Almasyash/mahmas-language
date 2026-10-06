import http from 'http';
import { createApp } from './app';
import { config } from './config/environment';
import { SignalingServer } from './websocket/signaling';

const app = createApp();
const server = http.createServer(app);

// Initialize WebRTC Signaling WebSocket server
new SignalingServer(server);

if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, '0.0.0.0', async () => {
    console.log(`====================================================`);
    console.log(`🚀 ${config.appName} Backend Server running!`);
    console.log(`📡 Localhost: http://localhost:${config.port}/api/v1`);
    console.log(`📱 LAN (Phone): http://192.168.0.106:${config.port}/api/v1`);
    console.log(`⚡ WebSocket URL: ws://0.0.0.0:${config.port}/ws`);
    console.log(`🌍 Environment:   ${config.nodeEnv}`);
    console.log(`====================================================`);

    // Auto-bootstrap seed if database is empty
    try {
      const { prisma } = await import('./database/prisma');
      const count = await prisma.language.count();
      console.log(`[Startup] Database connected. Found ${count} languages.`);
      if (count === 0) {
        console.log('[Startup] Database empty. Automatically running initial seed...');
        const { seedInitialData } = await import('./database/seed');
        await seedInitialData(prisma);
        console.log('[Startup] Initial seed finished successfully!');
      }
    } catch (err: any) {
      console.warn('[Startup] Database bootstrap notice:', err?.message || err);
    }
  });
}

export { app, server };
