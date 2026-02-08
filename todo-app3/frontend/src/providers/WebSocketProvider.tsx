import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { initializeWebSocketService } from '../services/websocket-service';

interface WebSocketContextType {}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialize WebSocket service when the app loads
    // Just setup the service configuration - connections to specific endpoints happen in components
    const wsBaseUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}`;

    // Initialize with default options - individual components will connect to specific endpoints
    initializeWebSocketService({
      url: `${wsBaseUrl}/ws/animation/default`, // Will be replaced when actual connections are made
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
    });

    // Cleanup on unmount
    return () => {
      // We don't disconnect here since the app may still need the WebSocket service
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{}}>
      {children}
    </WebSocketContext.Provider>
  );
};