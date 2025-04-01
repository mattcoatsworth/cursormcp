import { useState, useEffect } from 'react';
import { useSlackMessages } from '@/hooks/use-slack-messages';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SiSlack } from 'react-icons/si';
import { cn } from '@/lib/utils';
import { onWebSocketMessage, sendWebSocketMessage } from '@/lib/websocket';

interface SlackMessagesProps {
  fullScreen?: boolean;
}

export function SlackMessages({ fullScreen = false }: SlackMessagesProps) {
  const { messages, isConnected, channelInfo } = useSlackMessages();
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Force load initial data when component first mounts or when in full screen mode
  useEffect(() => {
    // Request slack messages from the server
    const fetchMessages = () => {
      sendWebSocketMessage('request_slack_messages', { 
        forceRefresh: true 
      });
    };
    
    // Initial fetch
    fetchMessages();
    
    // Setup polling every 5 seconds when in fullScreen mode
    let interval: NodeJS.Timeout | null = null;
    if (fullScreen) {
      interval = setInterval(fetchMessages, 5000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fullScreen]);
  
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    setIsLoading(true);
    // Send the message to slack via WebSocket
    sendWebSocketMessage('send_slack_message', {
      channel: channelInfo?.id || 'general',
      text: inputMessage.trim()
    });
    
    // Clear the input
    setInputMessage('');
    
    // Set a timeout to clear loading state in case we don't get confirmation
    setTimeout(() => setIsLoading(false), 3000);
  };
  
  // Listen for message sent confirmation
  useEffect(() => {
    const unsubscribe = onWebSocketMessage('slack_message_sent', () => {
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // If not connected to Slack
  if (!isConnected) {
    return (
      <div className={cn(
        "flex flex-col",
        fullScreen ? "h-full" : ""
      )}>
        <div className={cn(
          "flex items-center justify-between py-2 px-4 text-sm text-muted-foreground",
          fullScreen ? "border-b" : "border-t"
        )}>
          <div className="flex items-center gap-2">
            <SiSlack className="h-4 w-4" />
            <span>Slack integration</span>
          </div>
          <Badge variant="outline" className="px-2 py-0 text-xs">
            <span className="h-2 w-2 rounded-full mr-1 inline-block bg-gray-400" />
            Offline
          </Badge>
        </div>
        
        {fullScreen && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8 max-w-md">
              <SiSlack className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">Not Connected to Slack</h3>
              <p className="text-gray-500 mb-6">
                Your Slack integration is currently disconnected. Please check your API connection in settings.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // If connected but no messages
  if (messages.length === 0) {
    return (
      <div className={cn(
        "flex flex-col",
        fullScreen ? "h-full" : ""
      )}>
        <div className={cn(
          "flex items-center justify-between py-2 px-4 text-sm",
          fullScreen ? "border-b" : "border-t"
        )}>
          <div className="flex items-center gap-2">
            <SiSlack className="h-4 w-4 text-blue-500" />
            <span>Slack integration</span>
          </div>
          <Badge variant="outline" className="px-2 py-0 text-xs">
            <span className="h-2 w-2 rounded-full mr-1 inline-block bg-green-500" />
            Live
          </Badge>
        </div>
        
        {fullScreen && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8 max-w-md">
              <SiSlack className="h-16 w-16 text-blue-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Messages Yet</h3>
              <p className="text-gray-500 mb-6">
                Your Slack channel is connected but there are no messages to display yet.
              </p>
              
              <div className="relative">
                <input
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message to start the conversation..."
                  className="w-full border rounded-md py-2 px-3 pr-10"
                />
                <button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700"
                  onClick={handleSendMessage}
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" transform="rotate(180 10 10)" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // If connected and have messages
  return (
    <div className={cn(
      "flex flex-col",
      fullScreen ? "h-full" : "border-t"
    )}>
      <div className="flex items-center justify-between py-2 px-4 border-b">
        <div className="flex items-center gap-2">
          <SiSlack className="h-4 w-4 text-blue-500" />
          <span className="font-medium">
            {channelInfo ? `#${channelInfo.name || channelInfo.id}` : 'Slack channel'}
          </span>
        </div>
        <Badge variant="outline" className="px-2 py-0 text-xs">
          <span className="h-2 w-2 rounded-full mr-1 inline-block bg-green-500" />
          Live
        </Badge>
      </div>
      
      <ScrollArea className={cn(
        fullScreen ? "flex-1" : "h-[180px]"
      )}>
        <div className="p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={message.timestamp} className="space-y-1">
              <div className="flex items-start justify-between">
                <div className="font-medium text-sm">
                  {message.sender}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(parseFloat(message.timestamp) * 1000).toLocaleTimeString()}
                </div>
              </div>
              <div className="text-sm whitespace-pre-wrap">{message.text}</div>
              {index < messages.length - 1 && <Separator className="mt-2" />}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {fullScreen && (
        <div className="border-t p-4">
          <div className="relative">
            <input
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type message to send to Slack..."
              className="w-full border rounded-md py-2 px-3 pr-10"
              disabled={isLoading}
            />
            <button 
              className={cn(
                "absolute right-2 top-1/2 transform -translate-y-1/2",
                isLoading ? "text-gray-400" : "text-blue-500 hover:text-blue-700"
              )}
              onClick={handleSendMessage}
              disabled={isLoading}
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" transform="rotate(180 10 10)" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}