import { WebSocketServer } from 'ws';
import { log } from './vite';

export function startWebSocketServer(port: number = 5001) {
  const wss = new WebSocketServer({ 
    port,
    path: '/ws'
  });

  wss.on('connection', (ws) => {
    log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        ws.send(JSON.stringify({ 
          received: true, 
          timestamp: Date.now()
        }));
      } catch (error) {
        log(`Error processing message: ${error}`);
      }
    });

    ws.on('close', () => {
      log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      log(`WebSocket error: ${error}`);
    });
  });

  log(`WebSocket server is running on port ${port}`);
  return wss;
}
