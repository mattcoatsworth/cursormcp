import { useState, useEffect, useCallback } from 'react';
import { connectWebSocket, onWebSocketMessage, sendWebSocketMessage } from '@/lib/websocket';
import { sendMessage } from '@/lib/api';

// Define the structure of a Slack message
interface SlackMessage {
  text: string;
  sender: string;
  timestamp: string;
  reactions?: Array<{ name: string; count: number; users: string[] }>;
}

// Define the notification event structure
export interface SlackNotification {
  id: string;
  appId: string; // Identifies this is a slack notification
  channelId: string; // Slack channel ID
  channelName: string; // Slack channel name
  message: string;
  timestamp: number;
  read: boolean;
}

// Event emitter for notifications
type NotificationListener = (notification: SlackNotification) => void;
const notificationListeners: NotificationListener[] = [];

// Global function to add notification listeners
export function onSlackNotification(listener: NotificationListener): () => void {
  notificationListeners.push(listener);
  return () => {
    const index = notificationListeners.indexOf(listener);
    if (index > -1) {
      notificationListeners.splice(index, 1);
    }
  };
}

// Helper to emit notifications
function emitNotification(notification: SlackNotification) {
  notificationListeners.forEach(listener => listener(notification));
}

// Hook for handling Slack real-time messages
export function useSlackMessages() {
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [channelInfo, setChannelInfo] = useState<{ id: string; name: string } | null>(null);
  
  // Function to trigger a refresh of Slack messages
  const refreshMessages = useCallback(() => {
    sendWebSocketMessage('request_slack_messages', { forceRefresh: true });
  }, []);
  
  // Connect to WebSocket when component mounts
  useEffect(() => {
    connectWebSocket();
    
    // Handle connection status updates
    const unsubscribeConnection = onWebSocketMessage('connection', (data) => {
      setIsConnected(data.status === 'connected');
      
      // Request messages when first connected
      if (data.status === 'connected') {
        refreshMessages();
      }
    });
    
    // Handle incoming Slack messages
    const unsubscribeSlack = onWebSocketMessage('slack_message', (data) => {
      console.log('Received slack message:', data);
      
      const processMessages = (sourceData: any) => {
        if (sourceData?.messages && Array.isArray(sourceData.messages)) {
          // Sort messages by timestamp (newest first)
          const sortedMessages = [...sourceData.messages].sort((a, b) => {
            return parseFloat(b.timestamp) - parseFloat(a.timestamp);
          });
          
          setMessages(sortedMessages);
          
          // Update channel info
          if (sourceData.channel) {
            setChannelInfo({
              id: sourceData.channel,
              name: sourceData.channelName || sourceData.channel
            });
          }
          
          // Determine if this is a new message
          // We consider it new if it's the first message and we don't have any messages yet
          // OR if it has a new timestamp different from what we already have
          const isNewMessage = sortedMessages.length > 0 && (
            messages.length === 0 || 
            !messages.some(existingMsg => 
              existingMsg.timestamp === sortedMessages[0].timestamp && 
              existingMsg.sender === sortedMessages[0].sender
            )
          );
          
          // If it's a new message, notify
          if (isNewMessage) {
            const latestMsg = sortedMessages[0];
            const channelName = sourceData.channelName || (channelInfo?.name || 'Slack');
            
            // Create notification
            const notification: SlackNotification = {
              id: `slack-${sourceData.channel}-${Date.now()}`,
              appId: 'slack',
              channelId: sourceData.channel || '',
              channelName: channelName,
              message: `${latestMsg.sender}: ${latestMsg.text.substring(0, 40)}${latestMsg.text.length > 40 ? '...' : ''}`,
              timestamp: Date.now(),
              read: false
            };
            
            // Emit notification
            emitNotification(notification);
          }
        }
      };
      
      // Process direct message data
      if (data.source === 'slack_update') {
        processMessages(data);
      }
      
      // Handle when there's data property wrapping the message
      if (data.data && data.data.source === 'slack_update') {
        processMessages(data.data);
      }
    });
    
    // Handle Slack errors
    const unsubscribeErrors = onWebSocketMessage('slack_error', (data) => {
      console.error('Slack error:', data.message, data.error);
      // Don't disconnect as we might recover
    });
    
    // Initial request for messages
    refreshMessages();
    
    // Clean up subscriptions when component unmounts
    return () => {
      unsubscribeConnection();
      unsubscribeSlack();
      unsubscribeErrors();
    };
  }, [refreshMessages]);
  
  return {
    messages,
    isConnected,
    channelInfo,
    refreshMessages
  };
}