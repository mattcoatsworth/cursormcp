import { ChatMessage } from '@shared/schema';

/**
 * Groups chat messages by date
 * @param messages Array of chat messages
 * @returns Object with dates as keys and arrays of messages as values
 */
export function groupChatsByDate(messages: ChatMessage[]): Record<string, ChatMessage[]> {
  if (!messages || messages.length === 0) {
    return {};
  }
  
  // Filter to get only user messages
  const userMessages = messages.filter(msg => msg.role === 'user');
  
  // Create a map to group first messages of conversations
  const groupedChats: Record<string, ChatMessage[]> = {};
  
  // Group messages by date (YYYY-MM-DD)
  userMessages.forEach(message => {
    // Normalize date format to handle both string and Date objects
    let createdDate: string | Date = message.createdAt;
    
    // Make sure createdDate is a valid date
    if (!createdDate) {
      console.warn('Message missing createdAt:', message);
      createdDate = new Date(); // Fallback to current time if missing
    }
    
    // Handle string date from API or Date object from client
    const date = typeof createdDate === 'string' 
      ? new Date(createdDate).toISOString().split('T')[0]
      : createdDate.toISOString().split('T')[0];
    
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
      // Normalize dates for comparison
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date();
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date();
      return dateB.getTime() - dateA.getTime();
    });
  });
  
  // Sort dates by newest first
  const sortedGroupedChats: Record<string, ChatMessage[]> = {};
  Object.keys(groupedChats)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .forEach(date => {
      sortedGroupedChats[date] = groupedChats[date];
    });
  
  return sortedGroupedChats;
}

/**
 * Returns a friendly formatted date
 * @param dateString Date string in ISO format
 * @returns Friendly date string (Today, Yesterday, or date)
 */
export function getFriendlyDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Format dates to YYYY-MM-DD for comparison
  const dateFormatted = date.toISOString().split('T')[0];
  const todayFormatted = today.toISOString().split('T')[0];
  const yesterdayFormatted = yesterday.toISOString().split('T')[0];
  
  if (dateFormatted === todayFormatted) {
    return 'Today';
  } else if (dateFormatted === yesterdayFormatted) {
    return 'Yesterday';
  } else {
    // Check if date is within last 7 days
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    if (date >= oneWeekAgo) {
      return 'Previous 7 Days';
    } else {
      // Format as Month Day (e.g., March 15)
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric' 
      });
    }
  }
}