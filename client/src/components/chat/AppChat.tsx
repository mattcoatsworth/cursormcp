import { useState, useEffect } from 'react';
import Chat from '@/components/chat/Chat';
import { SlackMessages } from '@/components/slack/SlackMessages';
import SettingsNew from '@/components/settings/SettingsNew';
import { type ChatMessage, type ChatMessageWithStringId, type ApiConnection } from '@shared/schema';

interface AppChatProps {
  currentApp: string;
  chatMessages: ChatMessageWithStringId[];
  isLoadingMessages: boolean;
  sendMessage: (content: string) => void;
  isPending: boolean;
  apiConnections: ApiConnection[];
  isLoadingConnections: boolean;
  onToggleConnection: (id: number | string, isConnected: boolean, type: string) => void;
}

export default function AppChat({
  currentApp,
  chatMessages,
  isLoadingMessages,
  sendMessage,
  isPending,
  apiConnections,
  isLoadingConnections,
  onToggleConnection
}: AppChatProps) {
  // Log to debug
  console.log('AppChat rendering', {
    currentApp,
    messagesCount: chatMessages.length,
    isPending
  });

  // Display the appropriate component based on the current app
  const renderAppContent = () => {
    switch (currentApp) {
      case 'chat':
        return (
          <Chat
            messages={chatMessages}
            isLoading={isLoadingMessages}
            onSendMessage={sendMessage}
            isPending={isPending}
            apiConnections={apiConnections}
          />
        );
      case 'slack':
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4">
              <h2 className="text-xl font-semibold mb-4">Slack Conversations</h2>
              <SlackMessages fullScreen={true} />
            </div>
          </div>
        );
      case 'settings':
        return (
          <SettingsNew 
            connections={apiConnections}
            isLoading={isLoadingConnections}
            onToggleConnection={onToggleConnection}
          />
        );
      default:
        // If not a known app, default to the main chat
        return (
          <Chat
            messages={chatMessages}
            isLoading={isLoadingMessages}
            onSendMessage={sendMessage}
            isPending={isPending}
            apiConnections={apiConnections}
          />
        );
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {renderAppContent()}
    </div>
  );
}