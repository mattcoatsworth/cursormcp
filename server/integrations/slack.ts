import { storage } from "../storage";
import { WebClient } from "@slack/web-api";

// Initialize Slack client with fallback for missing API key
let slackClient: WebClient | null = null;
try {
  if (process.env.SLACK_BOT_TOKEN) {
    slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
  } else {
    console.warn("SLACK_BOT_TOKEN not provided. Slack features will be disabled.");
  }
} catch (error) {
  console.error("Error initializing Slack client:", error);
}

const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID || "";

// Store the last message timestamp for each channel
// This helps us fetch only new messages in real-time
const channelLastTs: Record<string, string | undefined> = {};

// Cache for user info to avoid excessive API calls
const userInfoCache: Record<string, any> = {};

// Get user display name with caching
async function getUserDisplayName(client: WebClient, userId: string): Promise<string> {
  try {
    // Check if it's a bot or system message (sometimes they have special IDs)
    if (userId === 'USLACKBOT' || userId.startsWith('B')) {
      return 'Slackbot';
    }
    
    // Return from cache if we have it
    if (userInfoCache[userId]) {
      const cached = userInfoCache[userId];
      // First try display name (what users typically set for themselves)
      if (cached.profile?.display_name && cached.profile.display_name.trim() !== '') {
        return cached.profile.display_name;
      } 
      // Then try real name (often first+last name)
      else if (cached.real_name && cached.real_name.trim() !== '') {
        return cached.real_name;
      } 
      // Finally fall back to username
      else if (cached.name) {
        return cached.name;
      }
    }
    
    // Fetch from API if not in cache
    console.log(`Fetching user info for: ${userId}`);
    const userInfo = await client.users.info({ user: userId });
    
    if (userInfo.ok && userInfo.user) {
      // Store in cache for future use
      userInfoCache[userId] = userInfo.user;
      
      // More detailed logging to help debug
      console.log(`User info for ${userId}:`, {
        display_name: userInfo.user.profile?.display_name,
        real_name: userInfo.user.real_name,
        name: userInfo.user.name
      });
      
      // Return the best name we can find
      if (userInfo.user.profile?.display_name && userInfo.user.profile.display_name.trim() !== '') {
        return userInfo.user.profile.display_name;
      } else if (userInfo.user.real_name && userInfo.user.real_name.trim() !== '') {
        return userInfo.user.real_name;
      } else if (userInfo.user.name) {
        return userInfo.user.name;
      }
    } else {
      // Log failed info request 
      console.log(`Failed to get user info for ${userId}:`, userInfo);
    }
  } catch (error) {
    // Log error only if it's not a missing scope error
    if (typeof error === 'object' && error !== null && 
        'data' in error && typeof error.data === 'object' && error.data !== null &&
        'error' in error.data) {
      if (error.data.error === 'missing_scope') {
        console.warn(`Missing permission scope to get user info. Need users:read permission for ${userId}`);
      } else {
        console.error('Error fetching user info:', error);
      }
    } else {
      console.error('Unknown error fetching user info:', error);
    }
  }
  
  // Fallback to a formatted user ID if we can't get a name
  // Create a more user-friendly display by showing just "User" followed by last 4 chars
  return `User ${userId.substring(Math.max(0, userId.length - 4))}`;
}

// Get channel name with caching
async function getChannelDisplayName(client: WebClient, channelId: string): Promise<string> {
  try {
    const channelInfo = await client.conversations.info({ channel: channelId });
    if (channelInfo.ok && channelInfo.channel) {
      return channelInfo.channel.name || channelId;
    }
  } catch (error) {
    console.error('Error fetching channel info:', error);
  }
  return channelId;
}

// Set up periodic polling for new messages if we have a default channel
if (SLACK_CHANNEL_ID && slackClient) {
  // Poll for new messages every 5 seconds
  setInterval(async () => {
    try {
      if (!slackClient) return;
      
      const channel = SLACK_CHANNEL_ID;
      const lastTs = channelLastTs[channel];
      
      // If we have a last timestamp, only get messages newer than that
      const params: any = { 
        channel,
        limit: 10
      };
      
      if (lastTs) {
        params.oldest = lastTs;
      }
      
      const response = await slackClient.conversations.history(params);
      
      // If we got new messages (excluding the message we already have)
      if (response.messages && response.messages.length > 1) {
        // Skip the first message if it matches our last timestamp
        const newMessages = lastTs ? response.messages.slice(1) : response.messages;
        
        if (newMessages.length > 0 && newMessages[0].ts) {
          // Update our last timestamp
          channelLastTs[channel] = newMessages[0].ts;
          
          // Format messages with proper user names
          const formattedMessages = await Promise.all(newMessages.map(async msg => {
            let sender = msg.username || 'Unknown';
            
            // Get proper user name if we have a user ID
            if (msg.user) {
              sender = await getUserDisplayName(slackClient!, msg.user);
            }
            
            return {
              text: msg.text || '',
              sender: sender,
              timestamp: msg.ts || (Date.now() / 1000).toString(),
              reactions: msg.reactions || []
            };
          }));
          
          // Get channel name
          const channelName = await getChannelDisplayName(slackClient, channel);
          
          // Broadcast to all clients
          if ((global as any).broadcastSlackMessage && formattedMessages.length > 0) {
            (global as any).broadcastSlackMessage({
              source: 'slack_update',
              channel,
              channelName: channelName,
              messages: formattedMessages
            });
          }
        }
      }
    } catch (error) {
      console.error('Error polling for Slack messages:', error);
    }
  }, 5000); // Poll every 5 seconds
}

/**
 * Process commands related to Slack
 */
export async function processSlackCommand(
  command: string,
  classification: any
): Promise<any> {
  // Check if Slack API is connected in our database
  const slackConnection = await storage.getApiConnectionByType("slack");
  
  if (!slackConnection || !slackConnection.isConnected) {
    return {
      success: false, 
      error: "Slack API is not connected in the application. Please connect it first."
    };
  }

  // Check if Slack client is available
  if (!slackClient) {
    return {
      success: false,
      error: "Slack integration is not configured. Please add SLACK_BOT_TOKEN to environment variables."
    };
  }

  // Check if we have a channel ID for default channel
  if (!SLACK_CHANNEL_ID && !classification.parameters.channel) {
    return {
      success: false,
      error: "Slack channel ID is not configured. Please add SLACK_CHANNEL_ID to environment variables or specify a channel in your command."
    };
  }

  // Process based on intent
  try {
    switch (classification.intent) {
      case "send_message":
        return await sendMessage(
          slackClient,
          classification.parameters.channel || SLACK_CHANNEL_ID,
          classification.parameters.message,
          classification.parameters.title
        );
      case "get_messages":
        return await getMessages(
          slackClient,
          classification.parameters.channel || SLACK_CHANNEL_ID,
          classification.parameters.limit
        );
      case "list_channels":
        return await listChannels(slackClient);
      case "list_users":
        return await listUsers(slackClient);
      case "get_status":
        return {
          success: true,
          connectionStatus: "connected",
          botName: slackClient.auth?.test ? (await slackClient.auth.test()).user : "Unknown",
          defaultChannel: SLACK_CHANNEL_ID || "None set"
        };
      default:
        return {
          success: false,
          error: `Unsupported Slack command intent: ${classification.intent}`
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Unknown error processing Slack command"
    };
  }
}

/**
 * Send a message to a Slack channel
 */
async function sendMessage(
  client: WebClient,
  channel: string,
  message: string,
  title?: string
): Promise<any> {
  try {
    // Only include blocks if there's a title
    const blocks = title 
      ? [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${title}*`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: message,
            },
          },
        ]
      : undefined;

    try {
      const response = await client.chat.postMessage({
        channel,
        text: message,
        blocks,
      });
  
      return {
        success: true,
        messageId: response.ts,
        channel: response.channel,
      };
    } catch (error: any) {
      // Check for specific errors and provide more helpful messages
      if (error.message.includes('not_in_channel')) {
        return {
          success: false,
          error: `The bot is not in the channel. Please add the bot to the channel first by going to the channel and typing: /invite @[bot-name]`,
          errorDetail: "not_in_channel"
        };
      } else if (error.message.includes('channel_not_found')) {
        return {
          success: false,
          error: `Channel not found. Please check your SLACK_CHANNEL_ID environment variable.`,
          errorDetail: "channel_not_found"
        };
      } else {
        throw error; // Let the outer catch handle other errors
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to send Slack message: ${error?.message || "Unknown error"}`
    };
  }
}

/**
 * Get messages from a Slack channel
 */
async function getMessages(
  client: WebClient,
  channel: string,
  limit: number = 10
): Promise<any> {
  try {
    const response = await client.conversations.history({
      channel,
      limit,
    });

    // Format messages with proper user names
    const messages = await Promise.all((response.messages || []).map(async msg => {
      let sender = msg.username || 'Unknown';
      
      // Get proper user name if we have a user ID
      if (msg.user) {
        sender = await getUserDisplayName(client, msg.user);
      }
      
      return {
        text: msg.text || '',
        sender: sender,
        timestamp: msg.ts || (Date.now() / 1000).toString(),
        reactions: msg.reactions || []
      };
    }));

    // Store the latest timestamp from this batch
    // This can be used later for real-time updates
    if (messages.length > 0 && messages[0].timestamp) {
      const latestTs = messages[0].timestamp;
      // Store this timestamp for the channel
      // We'll use it to fetch only new messages in real-time
      channelLastTs[channel] = latestTs;
    }

    // Get channel display name
    const channelName = await getChannelDisplayName(client, channel);

    return {
      success: true,
      channel,
      channelName,
      messages
    };
  } catch (error: any) {
    // Check for specific errors
    if (error.message.includes('not_in_channel')) {
      return {
        success: false,
        error: `The bot is not in the channel. Please add the bot to the channel first by going to the channel and typing: /invite @[bot-name]`,
        errorDetail: "not_in_channel"
      };
    } else if (error.message.includes('channel_not_found')) {
      return {
        success: false,
        error: `Channel not found. Please check your channel ID.`,
        errorDetail: "channel_not_found"
      };
    }
    
    return {
      success: false,
      error: `Failed to get Slack messages: ${error?.message || "Unknown error"}`
    };
  }
}

/**
 * List all visible channels in the workspace
 */
async function listChannels(client: WebClient): Promise<any> {
  try {
    const response = await client.conversations.list({
      types: "public_channel,private_channel"
    });

    return {
      success: true,
      channels: response.channels?.map(channel => ({
        id: channel.id,
        name: channel.name,
        isPrivate: channel.is_private,
        memberCount: channel.num_members
      })) || []
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to list Slack channels: ${error?.message || "Unknown error"}`
    };
  }
}

/**
 * List users in the workspace
 */
async function listUsers(client: WebClient): Promise<any> {
  try {
    const response = await client.users.list({});

    return {
      success: true,
      users: response.members?.filter(member => !member.is_bot && !member.deleted).map(user => ({
        id: user.id,
        name: user.name,
        realName: user.real_name,
        displayName: user.profile?.display_name,
        isAdmin: user.is_admin
      })) || []
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to list Slack users: ${error?.message || "Unknown error"}`
    };
  }
}
