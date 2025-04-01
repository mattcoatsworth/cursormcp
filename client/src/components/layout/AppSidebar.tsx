import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SiSlack, SiShopify, SiNotion } from 'react-icons/si';
import { Settings, MessageSquare, Bell, Menu, X, Plus } from 'lucide-react';
import { type ApiConnection, type ChatMessage, type ChatMessageWithStringId } from '@shared/schema';
import { useSidebar } from '@/hooks/use-sidebar';
import { useMobile } from '@/hooks/use-mobile';
import ShopifySalesWidget from '../widgets/ShopifySalesWidget';
import ChatHistoryWidget from '../widgets/ChatHistoryWidget';

// Notification type
interface AppNotification {
  id: string;
  appId: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface AppSidebarProps {
  currentApp: string;
  setCurrentApp: (app: string) => void;
  apiConnections: ApiConnection[];
  notifications: AppNotification[];
  onClearNotifications: (appId: string) => void;
  chatMessages?: ChatMessageWithStringId[];
  onSelectChat?: (messageId: number | string) => void;
}

export default function AppSidebar({ 
  currentApp, 
  setCurrentApp, 
  apiConnections,
  notifications,
  onClearNotifications,
  chatMessages = [],
  onSelectChat
}: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const isMobile = useMobile();
  
  // Filter connections that are connected
  const connectedApis = apiConnections.filter(conn => conn.isConnected === true);
  
  // Count unread notifications per app
  const unreadCountByApp: Record<string, number> = {};
  // Track Slack channel notifications
  type SlackChannelNotifications = {
    channelId: string;
    channelName: string;
    count: number;
  };
  const slackChannelNotifications: SlackChannelNotifications[] = [];
  
  // Group by channel for Slack notifications
  const slackChannelCounts: Record<string, number> = {};
  
  notifications.forEach(notification => {
    if (!notification.read) {
      // Count general app notifications
      unreadCountByApp[notification.appId] = (unreadCountByApp[notification.appId] || 0) + 1;
      
      // For Slack, also track by channel
      if (notification.appId === 'slack' && 'channelId' in notification) {
        const channelId = (notification as any).channelId;
        const channelName = (notification as any).channelName || channelId;
        
        // Count by channel
        slackChannelCounts[channelId] = (slackChannelCounts[channelId] || 0) + 1;
        
        // Add to channel notifications list if not already there
        if (!slackChannelNotifications.some(c => c.channelId === channelId)) {
          slackChannelNotifications.push({
            channelId,
            channelName,
            count: slackChannelCounts[channelId]
          });
        } else {
          // Update count on existing channel
          const existingChannel = slackChannelNotifications.find(c => c.channelId === channelId);
          if (existingChannel) {
            existingChannel.count = slackChannelCounts[channelId];
          }
        }
      }
    }
  });

  const handleAppClick = (appId: string) => {
    setCurrentApp(appId);
    // Clear notifications for this app
    onClearNotifications(appId);
  };

  // Don't render if on mobile and sidebar is closed
  if (isMobile && !isSidebarOpen) {
    return null;
  }

  return (
    <div className={`bg-white text-gray-800 flex flex-col h-full transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    } ${isMobile ? 'fixed z-40 top-0 left-0 h-full shadow-xl' : ''}`}>
      {/* Logo and Mobile Toggle */}
      <div className="p-6 py-6 border-b border-gray-200 flex items-center justify-between">
        {!collapsed && <h1 className="text-xl font-bold bg-gradient-to-r from-gray-600 to-gray-900 bg-clip-text text-transparent">MCP</h1>}
        
        {isMobile ? (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={toggleSidebar}
            className="text-gray-600 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-600 hover:text-gray-900"
          >
            {collapsed ? '→' : '←'}
          </Button>
        )}
      </div>

      {/* Sidebar content area - using flex to distribute space */}
      <div className="flex flex-col h-[calc(100%-80px)] overflow-hidden">
        {/* Main app navigation */}
        <div className="flex-shrink-0 py-2">
          <nav className="space-y-1 px-4">
            {/* Main Chat */}
            <button
              className={`flex items-center w-full py-2 px-3 rounded-md transition-colors ${
                currentApp === 'chat' 
                  ? 'bg-gray-100 text-gray-900 shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={() => {
                handleAppClick('chat');
                if (isMobile) toggleSidebar();
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2 text-gray-500" />
              {!collapsed && <span>Main Chat</span>}
            </button>

            {/* Connected Apps */}
            {connectedApis.map(api => {
              const hasNotifications = (unreadCountByApp[api.type] || 0) > 0;
              const AppIcon = api.type === 'slack' 
                ? SiSlack 
                : api.type === 'shopify' 
                  ? SiShopify 
                  : api.type === 'notion'
                    ? SiNotion
                    : MessageSquare;
              
              // Render app button
              return (
                <div key={api.id}>
                  <button
                    className={`flex items-center justify-between w-full py-2 px-3 rounded-md transition-colors ${
                      currentApp === api.type 
                        ? 'bg-gray-100 text-gray-900 shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => {
                      handleAppClick(api.type);
                      if (isMobile) toggleSidebar();
                    }}
                  >
                    <div className="flex items-center">
                      <span className={`h-4 w-4 mr-2 ${
                        api.type === 'slack' ? 'text-gray-500' :
                        api.type === 'shopify' ? 'text-gray-500' :
                        api.type === 'notion' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        <AppIcon className="h-4 w-4" />
                      </span>
                      {!collapsed && <span className="capitalize text-sm">{api.type}</span>}
                    </div>
                    {hasNotifications && (
                      <Badge className="bg-gray-500 hover:bg-gray-600 text-white text-xs px-1.5 py-0">
                        {!collapsed ? unreadCountByApp[api.type] : ''}
                      </Badge>
                    )}
                  </button>
                  
                  {/* For Slack, show channel notifications if there are any */}
                  {api.type === 'slack' && slackChannelNotifications.length > 0 && !collapsed && (
                    <div className="ml-4 mt-0.5 space-y-0.5">
                      {slackChannelNotifications.map(channel => (
                        <button
                          key={channel.channelId}
                          className={`flex items-center justify-between w-full py-1 px-2 text-xs rounded-md transition-colors
                            ${currentApp === 'slack' 
                              ? 'text-gray-900 bg-gray-100 shadow-sm' 
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          onClick={() => {
                            handleAppClick('slack');
                            // Here we could add channel selection if needed
                            if (isMobile) toggleSidebar();
                          }}
                        >
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500">#</span>
                            <span className="ml-0.5">{channel.channelName}</span>
                          </div>
                          <Badge variant="outline" className="bg-gray-200 text-gray-700 text-xs py-0 px-1 min-w-[1.25rem] text-center">
                            {channel.count}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Shopify Sales Widget */}
        {connectedApis.some(api => api.type === 'shopify' && api.isConnected === true) && (
          <div className="flex-shrink-0 px-4 py-2 border-t border-gray-200">
            <ShopifySalesWidget collapsed={collapsed} />
          </div>
        )}
        
        {/* Chat History Widget - Giving it flex-grow to take available space */}
        <div className="flex-grow overflow-y-auto px-4 py-2 border-t border-gray-200 min-h-[300px]">
          <ChatHistoryWidget 
            collapsed={collapsed} 
            messages={chatMessages} 
            onSelectChat={(messageId) => {
              // Handle chat selection
              handleAppClick('chat');
              // Call parent's onSelectChat handler if provided
              if (onSelectChat) {
                onSelectChat(messageId);
              }
              if (isMobile) toggleSidebar();
            }} 
          />
        </div>
        
        {/* Training Data and Settings - Always at the bottom */}
        <div className="flex-shrink-0 px-4 py-2 border-t border-gray-200">
          {/* Training Data */}
          <Link href="/training-data">
            <button
              className={`flex items-center w-full py-2 px-3 mb-2 rounded-md transition-colors
                text-gray-700 hover:bg-gray-50 hover:text-gray-900`}
              onClick={() => {
                if (isMobile) toggleSidebar();
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2 text-gray-500" />
              {!collapsed && <span className="text-sm">Training Data</span>}
            </button>
          </Link>
          
          {/* Settings */}
          <button
            className={`flex items-center w-full py-2 px-3 rounded-md transition-colors ${
              currentApp === 'settings' 
                ? 'bg-gray-100 text-gray-900 shadow-sm' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
            onClick={() => {
              handleAppClick('settings');
              if (isMobile) toggleSidebar();
            }}
          >
            <Settings className="h-4 w-4 mr-2 text-gray-500" />
            {!collapsed && <span className="text-sm">Settings</span>}
          </button>
        </div>
      </div>
    </div>
  );
}