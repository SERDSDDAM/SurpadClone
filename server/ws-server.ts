import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { log } from './vite';
import { parse } from 'url';

export function createWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ noServer: true });
  
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '');
    
    if (pathname === '/ws' && request.headers.upgrade?.toLowerCase() === 'websocket') {
      // منع التعامل المتكرر مع نفس الاتصال
      socket.removeAllListeners();
      wss.handleUpgrade(request, socket, head, (ws) => {
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
    }
  });

  return wss;
}
