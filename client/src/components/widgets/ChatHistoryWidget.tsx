import { Clock } from 'lucide-react';
import { ChatMessageWithStringId } from '@shared/schema';

// Helper function to group chats by date
function groupChatsByDate(messages: ChatMessageWithStringId[]): Record<string, ChatMessageWithStringId[]> {
  if (!messages || messages.length === 0) {
    return {};
  }
  
  // Filter to get only user messages
  const userMessages = messages.filter(msg => msg.role === 'user');
  
  // Create a map to group first messages of conversations
  const groupedChats: Record<string, ChatMessageWithStringId[]> = {};
  
  // Group messages by date (YYYY-MM-DD)
  userMessages.forEach(message => {
    // Check if the message has createdAt or created_at property
    const createdDate = message.createdAt || (message as any).created_at;
    const date = new Date(createdDate).toISOString().split('T')[0];
    
    if (!groupedChats[date]) {
      groupedChats[date] = [];
    }
    
    // Only add this message if it's not a continuation of a conversation
    // For simplicity, we're treating each user message as the start of a new conversation
    groupedChats[date].push(message);
  });
  
  // Sort messages within each date group by newest first
  Object.keys(groupedChats).forEach(date => {
    groupedChats[date].sort((a, b) => {
      const dateA = a.createdAt || (a as any).created_at;
      const dateB = b.createdAt || (b as any).created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  });
  
  // Sort dates by newest first
  const sortedGroupedChats: Record<string, ChatMessageWithStringId[]> = {};
  Object.keys(groupedChats)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .forEach(date => {
      sortedGroupedChats[date] = groupedChats[date];
    });
  
  return sortedGroupedChats;
}

interface ChatHistoryWidgetProps {
  collapsed: boolean;
  messages: ChatMessageWithStringId[];
  onSelectChat?: (firstMessageId: number | string) => void;
}

export default function ChatHistoryWidget({ collapsed, messages, onSelectChat }: ChatHistoryWidgetProps) {
  const groupedChats = groupChatsByDate(messages);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-2">
        <Clock className="h-5 w-5 text-indigo-400" />
      </div>
    );
  }

  // Get today's and yesterday's dates in format 'YYYY-MM-DD'
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  // Date labels mapping
  const dateLabels: Record<string, string> = {
    [today]: 'Today',
    [yesterday]: 'Yesterday'
  };

  // Check if a date falls within the previous 7 days
  const isPreviousWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    return date >= weekAgo && date < new Date(yesterday);
  };

  // Create a message item component to avoid repeating code
  const MessageItem = ({ message }: { message: ChatMessageWithStringId }) => (
    <li 
      key={message.id.toString()}
      className="truncate text-gray-600 hover:text-gray-900 cursor-pointer py-1.5 px-2.5 hover:bg-gray-100 rounded-md transition-colors"
      onClick={() => onSelectChat?.(message.id)}
    >
      <span className="text-sm">
        {message.content.length > 40 
          ? `${message.content.substring(0, 40)}...` 
          : message.content}
      </span>
    </li>
  );

  // Render chat history grouped by date
  return (
    <div className="w-full text-sm h-full flex flex-col">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-800 mb-3 flex-shrink-0">
        Chat History
      </h3>

      {Object.keys(groupedChats).length === 0 ? (
        <div className="text-gray-500 text-xs italic py-2">No chat history yet</div>
      ) : (
        <div className="space-y-5 overflow-y-auto min-h-0 flex-grow pb-4">
          {/* Today's chats */}
          {groupedChats[today] && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2 ml-1">Today</h4>
              <ul className="space-y-1.5">
                {groupedChats[today].map((message: ChatMessageWithStringId) => (
                  <MessageItem key={message.id.toString()} message={message} />
                ))}
              </ul>
            </div>
          )}

          {/* Yesterday's chats */}
          {groupedChats[yesterday] && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2 ml-1">Yesterday</h4>
              <ul className="space-y-1.5">
                {groupedChats[yesterday].map((message: ChatMessageWithStringId) => (
                  <MessageItem key={message.id.toString()} message={message} />
                ))}
              </ul>
            </div>
          )}

          {/* Previous 7 days */}
          {Object.keys(groupedChats).some(date => isPreviousWeek(date)) && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2 ml-1">Previous 7 Days</h4>
              <ul className="space-y-1.5">
                {Object.entries(groupedChats)
                  .filter(([date]) => isPreviousWeek(date))
                  .flatMap(([_, messages]) => 
                    messages.map((message: ChatMessageWithStringId) => (
                      <MessageItem key={message.id.toString()} message={message} />
                    ))
                  )}
              </ul>
            </div>
          )}
          
          {/* Older chats */}
          {Object.keys(groupedChats).some(date => 
            !dateLabels[date] && !isPreviousWeek(date)
          ) && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2 ml-1">Older</h4>
              <ul className="space-y-1.5">
                {Object.entries(groupedChats)
                  .filter(([date]) => !dateLabels[date] && !isPreviousWeek(date))
                  .slice(0, 5) // Limit to 5 older chats
                  .flatMap(([_, messages]) => 
                    messages.map((message: ChatMessageWithStringId) => (
                      <MessageItem key={message.id.toString()} message={message} />
                    ))
                  )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}