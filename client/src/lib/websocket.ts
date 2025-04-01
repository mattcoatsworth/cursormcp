// WebSocket connection for real-time updates
let socket: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let pingTimer: NodeJS.Timeout | null = null;
let pongReceived = true;

// Callbacks for different message types
const messageHandlers: Record<string, ((data: any) => void)[]> = {
  slack_message: [],
  connection: []
};

/**
 * Connect to the WebSocket server
 */
export function connectWebSocket() {
  if (socket || isConnecting) return;
  
  try {
    isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
      isConnecting = false;
      reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      
      // Start ping-pong to keep connection alive
      if (pingTimer) {
        clearInterval(pingTimer);
      }
      
      pingTimer = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          if (!pongReceived) {
            // No pong received since last ping, connection might be dead
            console.log('No pong received, closing connection');
            socket.close();
            return;
          }
          
          pongReceived = false; // Reset for next ping
          sendWebSocketMessage('ping', { clientTime: Date.now() });
        } else {
          if (pingTimer) {
            clearInterval(pingTimer);
            pingTimer = null;
          }
        }
      }, 15000); // Ping every 15 seconds
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type } = data;
        
        // Handle ping/pong specifically
        if (type === 'pong') {
          pongReceived = true;
          return;
        }
        
        // Call any registered handlers for this message type
        if (messageHandlers[type]) {
          messageHandlers[type].forEach(handler => handler(data));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket disconnected');
      socket = null;
      isConnecting = false;
      
      // Clear ping timer on close
      if (pingTimer) {
        clearInterval(pingTimer);
        pingTimer = null;
      }
      
      // Attempt to reconnect with exponential backoff
      if (!reconnectTimer && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Cap at 30 seconds
        console.log(`Attempting to reconnect in ${delay/1000} seconds...`);
        
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          reconnectAttempts++;
          connectWebSocket();
        }, delay);
      } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('Max reconnection attempts reached');
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Don't close here, let the onclose handler deal with reconnection
    };
  } catch (error) {
    console.error('Error creating WebSocket:', error);
    isConnecting = false;
    
    // Try to reconnect after error in connection setup
    if (!reconnectTimer && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        reconnectAttempts++;
        connectWebSocket();
      }, 3000);
    }
  }
}

/**
 * Register a handler for a specific message type
 */
export function onWebSocketMessage(type: string, callback: (data: any) => void) {
  if (!messageHandlers[type]) {
    messageHandlers[type] = [];
  }
  
  messageHandlers[type].push(callback);
  
  // Return a function to unregister this handler
  return () => {
    if (messageHandlers[type]) {
      messageHandlers[type] = messageHandlers[type].filter(h => h !== callback);
    }
  };
}

/**
 * Disconnect from the WebSocket server
 */
export function disconnectWebSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
  
  // Reset other state
  isConnecting = false;
  reconnectAttempts = 0;
  pongReceived = true;
}

/**
 * Check if the WebSocket is connected
 */
export function isWebSocketConnected(): boolean {
  return socket !== null && socket.readyState === WebSocket.OPEN;
}

/**
 * Send a message through the WebSocket
 */
export function sendWebSocketMessage(type: string, data: any) {
  if (isWebSocketConnected()) {
    socket?.send(JSON.stringify({
      type,
      ...data,
      timestamp: Date.now()
    }));
    return true;
  }
  return false;
}