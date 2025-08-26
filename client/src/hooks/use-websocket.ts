import { useEffect, useRef, useState } from "react";
// تكوين WebSocket
const DEFAULT_CONFIG = {
  maxRetries: 5,
  retryInterval: 3000,
  debug: false
};

interface UseWebSocketOptions {
  url?: string;
  config?: {
    maxRetries?: number;
    retryInterval?: number;
    debug?: boolean;
  };
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  
  const config = {
    ...DEFAULT_CONFIG,
    ...options.config
  };
  
  const socketUrl = options.url || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:5001/ws`;
  
  const connect = () => {
    try {
      if (retryCount >= config.maxRetries) {
        console.error(`Max retry attempts (${config.maxRetries}) reached`);
        return;
      }
      
      socketRef.current = new WebSocket(socketUrl);


      socketRef.current.onopen = () => {
        setIsConnected(true);
        options.onConnect?.();
        console.log('WebSocket connected');
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          options.onMessage?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socketRef.current.onclose = () => {
        setIsConnected(false);
        options.onDisconnect?.();
        if (config.debug) console.log('WebSocket disconnected');
        
        // زيادة عداد المحاولات وإعادة الاتصال
        setRetryCount(count => {
          const newCount = count + 1;
          if (newCount <= config.maxRetries) {
            reconnectTimeoutRef.current = setTimeout(() => {
              if (config.debug) console.log(`Attempting to reconnect... (${newCount}/${config.maxRetries})`);
              connect();
            }, config.retryInterval);
          }
          return newCount;
        });
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        options.onError?.(error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
  };

  const sendMessage = (message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
  };
}
