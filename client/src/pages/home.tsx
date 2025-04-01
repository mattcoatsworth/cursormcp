import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/Header";
import AppSidebar from "@/components/layout/AppSidebar";
import MobileNav from "@/components/layout/MobileNav";
import AppChat from "@/components/chat/AppChat";
import { useMobile } from "@/hooks/use-mobile";
import { SidebarProvider, useSidebar } from "@/hooks/use-sidebar";
import { type ApiConnection, type ChatMessage, type ChatMessageWithStringId } from "@shared/schema";
import { onSlackNotification, type SlackNotification } from "@/hooks/use-slack-messages";

// Notification type
interface AppNotification {
  id: string;
  appId: string;
  message: string;
  timestamp: number;
  read: boolean;
}

// Mobile overlay component that uses the sidebar context
function MobileOverlay() {
  const { isSidebarOpen, hideSidebar } = useSidebar();
  
  if (!isSidebarOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-30"
      onClick={hideSidebar}
    />
  );
}

// Main layout component
function MainLayout({
  currentApp,
  isMobile,
  apiConnections,
  notifications,
  onClearNotifications,
  chatMessages,
  isLoadingMessages,
  onSendMessage,
  isPending,
  isLoadingConnections,
  onToggleConnection,
  onAppSelect
}: {
  currentApp: string;
  isMobile: boolean;
  apiConnections: ApiConnection[];
  notifications: AppNotification[];
  onClearNotifications: (appId: string, channelId?: string) => void;
  chatMessages: ChatMessageWithStringId[];
  isLoadingMessages: boolean;
  onSendMessage: (content: string) => void;
  isPending: boolean;
  isLoadingConnections: boolean;
  onToggleConnection: (id: number | string, isConnected: boolean, type: string) => void;
  onAppSelect: (app: string) => void;
}) {
  return (
    <div className="flex flex-col h-screen">
      <Header 
        onSettingsClick={() => onAppSelect('settings')} 
        username="Admin User" 
      />
      <div className="flex-1 flex overflow-hidden">
        <AppSidebar
          currentApp={currentApp}
          setCurrentApp={onAppSelect}
          apiConnections={apiConnections}
          notifications={notifications}
          onClearNotifications={onClearNotifications}
          chatMessages={chatMessages}
          onSelectChat={(messageId) => {
            console.log(`Selected message with ID: ${messageId}`);
            // Future enhancement: Implement scrolling to specific message
          }}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <AppChat
            currentApp={currentApp}
            chatMessages={chatMessages}
            isLoadingMessages={isLoadingMessages}
            sendMessage={onSendMessage}
            isPending={isPending}
            apiConnections={apiConnections}
            isLoadingConnections={isLoadingConnections}
            onToggleConnection={onToggleConnection}
          />
        </div>
      </div>
      {isMobile && <MobileOverlay />}
    </div>
  );
}

export default function Home() {
  const isMobile = useMobile();
  const [currentApp, setCurrentApp] = useState<string>("chat");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Listen for Slack notifications
  useEffect(() => {
    const unsubscribe = onSlackNotification((notification: SlackNotification) => {
      // Check if the notification is already in the list
      if (!notifications.some(n => n.id === notification.id)) {
        setNotifications(prev => [notification, ...prev]);
      }
    });
    
    return () => unsubscribe();
  }, [notifications]);

  // Clear notifications for an app
  const clearNotifications = (appId: string, channelId?: string) => {
    setNotifications(prev => prev.map(notif => {
      // If a specific channel ID is provided, only clear for that channel
      if (channelId && notif.appId === 'slack') {
        const slackNotif = notif as SlackNotification;
        if (slackNotif.channelId === channelId) {
          return { ...notif, read: true };
        }
        return notif;
      }
      
      // Otherwise clear all for the app
      return notif.appId === appId ? { ...notif, read: true } : notif;
    }));
  };

  // Handle app selection
  const handleAppSelect = (app: string) => {
    setCurrentApp(app);
    
    // Mark notifications as read when selecting the app
    if (app === 'slack') {
      clearNotifications('slack');
    }
  };

  // Fetch API connections
  const {
    data: apiConnections = [],
    isLoading: isLoadingConnections,
    refetch: refetchConnections
  } = useQuery<ApiConnection[]>({
    queryKey: ["/api/api-connections"]
  });

  // Fetch chat messages
  const {
    data: chatMessages = [],
    isLoading: isLoadingMessages,
    refetch: refetchMessages
  } = useQuery<ChatMessageWithStringId[]>({
    queryKey: ["/api/messages"],
    staleTime: 0, // Always consider the data stale
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchInterval: 2000, // Poll every 2 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes (replaced cacheTime with gcTime in v5)
    // This function merges incoming data with existing data so temporary messages stay
    select: (data) => {
      // Get existing data from cache
      const existingData = queryClient.getQueryData<ChatMessageWithStringId[]>(["/api/messages"]) || [];
      
      // Find temporary messages (those with temp- prefix in ID)
      const tempMessages = existingData.filter(msg => {
        // Check if ID is a string and starts with 'temp-'
        return typeof msg.id === 'string' && msg.id.startsWith('temp-');
      });
      
      // For each temporary message, check if there's a corresponding server message with the same content
      const filteredTempMessages = tempMessages.filter(tempMsg => {
        // Skip if the temporary message doesn't have content
        if (!tempMsg.content) return false;
        
        // Check if there's a corresponding server message with the same content
        const hasPermanentEquivalent = data.some(serverMsg => 
          serverMsg.role === tempMsg.role && 
          serverMsg.content === tempMsg.content
        );
        
        // Only keep temporary messages that don't have a permanent equivalent
        return !hasPermanentEquivalent;
      });
      
      // Combine server data with filtered temporary messages
      const combined = [...data, ...filteredTempMessages];
      
      // Sort by createdAt, treating it as a string for consistent comparison
      const sorted = [...combined].sort((a, b) => {
        const dateA = typeof a.createdAt === 'string' ? a.createdAt : a.createdAt.toISOString();
        const dateB = typeof b.createdAt === 'string' ? b.createdAt : b.createdAt.toISOString();
        return dateA.localeCompare(dateB);
      });
      
      return sorted;
    }
  });

  // Toggle API connection status
  const toggleConnectionMutation = useMutation({
    mutationFn: async ({ id, isConnected, type }: { id: string | number, isConnected: boolean, type: string }) => {
      console.log("Making API request to update connection:", { id, isConnected, type });
      const response = await apiRequest<any>(`/api/api-connections/${id}`, "PUT", { isConnected, type });
      return response;
    },
    onSuccess: (data) => {
      console.log("Successfully updated connection:", data);
      refetchConnections();
    },
    onError: (error) => {
      console.error("Failed to update connection:", error);
    }
  });

  // Mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Generate a unique temporary ID for optimistic updates
      const tempId = `temp-${Date.now()}`;
      
      // Add the user message to the UI immediately
      const tempUserMessage = {
        id: tempId,
        role: "user",
        content,
        metadata: { 
          deliveryStatus: 'sending' 
        },
        createdAt: new Date().toISOString()
      } as ChatMessageWithStringId;
      
      // Update the local state with the new user message
      queryClient.setQueryData<ChatMessageWithStringId[]>(
        ["/api/messages"], 
        (oldData = []) => [...oldData, tempUserMessage]
      );
      
      console.log("Added temp user message to cache:", tempUserMessage);
      
      // We're no longer adding temporary processing messages on the client side
      // The server will handle creating the appropriate processing message that
      // includes the original command so the user can see what they sent
      
      // Then send to server
      try {
        const response = await apiRequest<any>("/api/messages", "POST", {
          role: "user",
          content,
          metadata: {}
        });
        console.log("Server response after sending message:", response);
        return response;
      } catch (error) {
        console.error("Error sending message:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log("Message sent successfully, refetching messages");
      
      // Clean up any temporary message for this content
      const existingData = queryClient.getQueryData<ChatMessageWithStringId[]>(["/api/messages"]) || [];
      const filteredData = existingData.filter(msg => {
        // Keep all messages that are not temporary or have different content
        return !(typeof msg.id === 'string' && 
                msg.id.startsWith('temp-') && 
                msg.content === variables && 
                msg.role === 'user');
      });
      
      // Update the cache with the filtered data
      queryClient.setQueryData(["/api/messages"], filteredData);
      
      // Refetch messages to get the server version
      refetchMessages();
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      // Show error to user if needed
    }
  });

  // Handle sending a message
  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate(content);
  };

  // We've moved the polling to the useQuery configuration
  // No need for additional polling interval here

  // Handle toggling a connection
  const handleToggleConnection = (id: number | string, isConnected: boolean, type: string) => {
    console.log("Toggling connection:", { id, isConnected: !isConnected, type });
    toggleConnectionMutation.mutate({ id, isConnected: !isConnected, type });
  };

  // Auto-set authentication on initial load for demo purposes
  useEffect(() => {
    // For demo purposes, we're auto-setting auth status for existing users
    // In a real app, this would be handled by your auth system
    if (localStorage.getItem('isAuthenticated') === null) {
      localStorage.setItem('isAuthenticated', 'true');
    }
  }, []);

  return (
    <SidebarProvider>
      <MainLayout
        currentApp={currentApp}
        isMobile={isMobile}
        apiConnections={apiConnections}
        notifications={notifications}
        onClearNotifications={clearNotifications}
        chatMessages={chatMessages}
        isLoadingMessages={isLoadingMessages}
        onSendMessage={handleSendMessage}
        isPending={sendMessageMutation.isPending}
        isLoadingConnections={isLoadingConnections}
        onToggleConnection={handleToggleConnection}
        onAppSelect={handleAppSelect}
      />
    </SidebarProvider>
  );
}
