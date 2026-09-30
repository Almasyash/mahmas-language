import http from 'http';
import { createApp } from './app';
import { config } from './config/environment';
import { SignalingServer } from './websocket/signaling';

const app = createApp();
const server = http.createServer(app);

// Initialize WebRTC Signaling WebSocket server
new SignalingServer(server);

if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`🚀 ${config.appName} Backend Server running!`);
    console.log(`📡 HTTP Base URL: http://localhost:${config.port}/api/v1`);
    console.log(`⚡ WebSocket URL: ws://localhost:${config.port}/ws`);
    console.log(`🌍 Environment:   ${config.nodeEnv}`);
    console.log(`====================================================`);
  });
}

export { app, server };
