import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { log } from './vite';
import { parse } from 'url';
import { parse } from 'url';

interface ConnectedClient {
  ws: WebSocket;
  id: string;
  lastPing?: number;
}

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ 
    noServer: true 
  });
  
  const clients = new Map<string, ConnectedClient>();
  let clientIdCounter = 0;

  // إعداد فحص الاتصال
  const pingInterval = setInterval(() => {
    clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        if (client.lastPing && Date.now() - client.lastPing > 30000) {
          log(`Client ${client.id} timed out, closing connection`);
          client.ws.terminate();
          clients.delete(client.id);
        } else {
          client.ws.ping();
        }
      }
    });
  }, 15000);
  
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '');
    
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        const clientId = `client_${++clientIdCounter}`;
        log(`Client connected: ${clientId}`);
        
        const client = { ws, id: clientId };
        clients.set(clientId, client);
        
        ws.on('pong', () => {
          const client = clients.get(clientId);
          if (client) {
            client.lastPing = Date.now();
          }
        });

  // إعداد فحص الاتصال
  const pingInterval = setInterval(() => {
    clients.forEach((client, id) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        // إذا لم يتم تلقي رد على آخر ping خلال 30 ثانية، افصل العميل
        if (client.lastPing && Date.now() - client.lastPing > 30000) {
          log(`Client ${id} timed out, closing connection`);
          client.ws.terminate();
          clients.delete(id);
        } else {
          client.ws.ping();
        }
      }
    });
  }, 15000);

  wss.on('connection', (ws) => {
    const clientId = `client_${++clientIdCounter}`;
    clients.set(clientId, { ws, id: clientId });
    log(`Client connected: ${clientId}`);

    ws.on('pong', () => {
      const client = clients.get(clientId);
      if (client) {
        client.lastPing = Date.now();
      }
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        log(`Received message from ${clientId}: ${JSON.stringify(data)}`);
        
        // يمكنك معالجة الرسائل هنا حسب احتياجات تطبيقك
        
      } catch (error) {
        log(`Error processing message from ${clientId}: ${error}`);
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      log(`Client disconnected: ${clientId}`);
    });

    ws.on('error', (error) => {
      log(`WebSocket error for ${clientId}: ${error}`);
      clients.delete(clientId);
    });
  });

  // تنظيف عند إيقاف الخادم
  server.on('close', () => {
    clearInterval(pingInterval);
    clients.forEach(client => {
      client.ws.terminate();
    });
    clients.clear();
  });
  
  return wss;
}
