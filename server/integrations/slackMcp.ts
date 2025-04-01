import { BaseMcpClient, McpCommandResult, McpCredentials } from "./baseMcp";
import { WebClient } from "@slack/web-api";
import path from "path";
import fs from "fs";

/**
 * Slack-specific MCP command result
 */
export interface SlackCommandResult extends McpCommandResult {
  data?: {
    messages?: any[];
    channels?: any[];
    users?: any[];
    message?: any;
    channel?: any;
    thread?: any;
    nextCursor?: string;
    hasNextPage?: boolean;
  };
}

/**
 * Slack MCP client implementation
 */
export class SlackMcpClient extends BaseMcpClient {
  private slackClient: WebClient | null = null;

  constructor() {
    super("slack");
  }

  /**
   * Extract Slack credentials from API connection
   */
  protected extractCredentials(connectionCredentials: any): McpCredentials {
    if (!connectionCredentials.botToken) {
      throw new Error("Slack bot token not found. Please reconnect the Slack API.");
    }

    // Return credentials in environment variable format for MCP server
    return {
      SLACK_BOT_TOKEN: connectionCredentials.botToken,
      SLACK_CHANNEL_ID: connectionCredentials.defaultChannel || process.env.SLACK_CHANNEL_ID
    };
  }

  /**
   * Initialize Slack-specific functionality
   */
  protected async serviceInitialize(): Promise<void> {
    // Initialize the Slack Web client
    if (!this.credentials.SLACK_BOT_TOKEN) {
      throw new Error("Slack bot token not available. Cannot initialize Slack client.");
    }

    this.slackClient = new WebClient(this.credentials.SLACK_BOT_TOKEN);
    
    // Verify token works by calling auth.test
    try {
      const authTest = await this.slackClient.auth.test();
      if (!authTest.ok) {
        throw new Error(`Slack authentication failed: ${authTest.error}`);
      }
      console.log(`Connected to Slack as '${authTest.user}' in workspace '${authTest.team}'`);
    } catch (error: any) {
      throw new Error(`Failed to authenticate with Slack: ${error.message}`);
    }
  }

  /**
   * Get messages from a Slack channel
   */
  async getMessages(channelId: string, limit: number = 10, cursor?: string): Promise<SlackCommandResult> {
    await this.initialize();

    if (!this.slackClient) {
      return {
        success: false,
        message: "Slack client not initialized",
        error: new Error("Slack client not initialized")
      };
    }

    try {
      const result = await this.slackClient.conversations.history({
        channel: channelId,
        limit: limit,
        cursor: cursor
      });

      const messages = result.messages || [];

      // Get user display names for messages
      const userIds = new Set<string>();
      messages.forEach(message => {
        if (message.user) {
          userIds.add(message.user);
        }
      });

      // Get user info in parallel
      const userPromises = Array.from(userIds).map(userId => 
        this.slackClient!.users.info({ user: userId })
          .catch(() => ({ ok: false, user: { id: userId.toString(), name: userId.toString() } }))
      );
      
      const userResponses = await Promise.all(userPromises);
      const userMap = new Map<string, any>();
      
      userResponses.forEach(response => {
        if (response.ok && response.user && response.user.id) {
          userMap.set(response.user.id, response.user);
        }
      });

      // Add user info to messages
      const enhancedMessages = messages.map(message => {
        const user = message.user ? userMap.get(message.user) : null;
        return {
          ...message,
          userInfo: user ? {
            id: user.id,
            name: user.name,
            realName: user.real_name,
            displayName: user.profile?.display_name || user.real_name || user.name
          } : null
        };
      });

      return {
        success: true,
        message: `Retrieved ${enhancedMessages.length} messages from channel`,
        data: {
          messages: enhancedMessages,
          hasNextPage: !!result.response_metadata?.next_cursor,
          nextCursor: result.response_metadata?.next_cursor
        }
      };
    } catch (error: any) {
      console.error("Error retrieving Slack messages:", error);
      return {
        success: false,
        message: `Failed to retrieve messages: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Send a message to a Slack channel
   */
  async sendMessage(
    channelId: string, 
    text: string, 
    blocks?: any[], 
    threadTs?: string
  ): Promise<SlackCommandResult> {
    await this.initialize();

    if (!this.slackClient) {
      return {
        success: false,
        message: "Slack client not initialized",
        error: new Error("Slack client not initialized")
      };
    }

    try {
      const result = await this.slackClient.chat.postMessage({
        channel: channelId,
        text: text,
        blocks: blocks,
        thread_ts: threadTs
      });

      return {
        success: true,
        message: "Message sent successfully",
        data: {
          message: {
            ts: result.ts,
            channel: result.channel,
            text: text
          }
        }
      };
    } catch (error: any) {
      console.error("Error sending Slack message:", error);
      return {
        success: false,
        message: `Failed to send message: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Update a message in a Slack channel
   */
  async updateMessage(
    channelId: string, 
    ts: string, 
    text: string, 
    blocks?: any[]
  ): Promise<SlackCommandResult> {
    await this.initialize();

    if (!this.slackClient) {
      return {
        success: false,
        message: "Slack client not initialized",
        error: new Error("Slack client not initialized")
      };
    }

    try {
      const result = await this.slackClient.chat.update({
        channel: channelId,
        ts: ts,
        text: text,
        blocks: blocks
      });

      return {
        success: true,
        message: "Message updated successfully",
        data: {
          message: {
            ts: result.ts,
            channel: result.channel,
            text: text
          }
        }
      };
    } catch (error: any) {
      console.error("Error updating Slack message:", error);
      return {
        success: false,
        message: `Failed to update message: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Get a list of channels in the workspace
   */
  async listChannels(limit: number = 100, cursor?: string): Promise<SlackCommandResult> {
    await this.initialize();

    if (!this.slackClient) {
      return {
        success: false,
        message: "Slack client not initialized",
        error: new Error("Slack client not initialized")
      };
    }

    try {
      const result = await this.slackClient.conversations.list({
        limit: limit,
        cursor: cursor,
        exclude_archived: true,
        types: "public_channel,private_channel"
      });

      return {
        success: true,
        message: `Retrieved ${result.channels?.length || 0} channels`,
        data: {
          channels: result.channels,
          hasNextPage: !!result.response_metadata?.next_cursor,
          nextCursor: result.response_metadata?.next_cursor
        }
      };
    } catch (error: any) {
      console.error("Error listing Slack channels:", error);
      return {
        success: false,
        message: `Failed to list channels: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Get a list of users in the workspace
   */
  async listUsers(limit: number = 100, cursor?: string): Promise<SlackCommandResult> {
    await this.initialize();

    if (!this.slackClient) {
      return {
        success: false,
        message: "Slack client not initialized",
        error: new Error("Slack client not initialized")
      };
    }

    try {
      const result = await this.slackClient.users.list({
        limit: limit,
        cursor: cursor
      });

      return {
        success: true,
        message: `Retrieved ${result.members?.length || 0} users`,
        data: {
          users: result.members,
          hasNextPage: !!result.response_metadata?.next_cursor,
          nextCursor: result.response_metadata?.next_cursor
        }
      };
    } catch (error: any) {
      console.error("Error listing Slack users:", error);
      return {
        success: false,
        message: `Failed to list users: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Join a channel
   */
  async joinChannel(channelId: string): Promise<SlackCommandResult> {
    await this.initialize();

    if (!this.slackClient) {
      return {
        success: false,
        message: "Slack client not initialized",
        error: new Error("Slack client not initialized")
      };
    }

    try {
      // Ensure the channelId is valid before passing to Slack API
      if (!channelId) {
        return {
          success: false,
          message: "Channel ID is required",
          error: new Error("Channel ID is required")
        };
      }

      const result = await this.slackClient.conversations.join({
        channel: channelId
      });

      return {
        success: true,
        message: `Joined channel ${result.channel?.name || channelId}`,
        data: {
          channel: result.channel
        }
      };
    } catch (error: any) {
      console.error("Error joining Slack channel:", error);
      return {
        success: false,
        message: `Failed to join channel: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Get information about a channel
   */
  async getChannelInfo(channelIdOrName: string): Promise<SlackCommandResult> {
    await this.initialize();

    if (!this.slackClient) {
      return {
        success: false,
        message: "Slack client not initialized",
        error: new Error("Slack client not initialized")
      };
    }

    try {
      // Remove # from channel name if present
      const channelIdentifier = channelIdOrName.startsWith('#') 
        ? channelIdOrName.substring(1) 
        : channelIdOrName;
      
      let channelId = channelIdentifier;
      
      // If it doesn't look like a Slack channel ID (not starting with C and not all alphanumeric+uppercase),
      // then try to find the channel by name first
      if (!channelIdentifier.match(/^C[0-9A-Z]+$/)) {
        try {
          // Try to find the channel by name
          const listResult = await this.slackClient.conversations.list({
            limit: 1000
          });
          
          const channel = listResult.channels?.find(c => 
            c.name === channelIdentifier || 
            c.name_normalized === channelIdentifier
          );
          
          if (channel && channel.id) {
            channelId = channel.id;
          }
        } catch (listError) {
          console.warn("Could not look up channel by name, trying direct ID lookup:", listError);
          // Continue with the original channelId attempt
        }
      }

      // Now get the channel info with the ID
      const result = await this.slackClient.conversations.info({
        channel: channelId
      });

      return {
        success: true,
        message: `Retrieved info for channel ${result.channel?.name || channelId}`,
        data: {
          channel: result.channel
        }
      };
    } catch (error: any) {
      console.error("Error getting Slack channel info:", error);
      return {
        success: false,
        message: `Failed to get channel info: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Get replies in a thread
   */
  async getThreadReplies(channelId: string, threadTs: string, limit: number = 100): Promise<SlackCommandResult> {
    await this.initialize();

    if (!this.slackClient) {
      return {
        success: false,
        message: "Slack client not initialized",
        error: new Error("Slack client not initialized")
      };
    }

    try {
      const result = await this.slackClient.conversations.replies({
        channel: channelId,
        ts: threadTs,
        limit: limit
      });

      return {
        success: true,
        message: `Retrieved ${result.messages?.length || 0} replies in thread`,
        data: {
          messages: result.messages,
          thread: {
            ts: threadTs,
            replyCount: result.messages?.length || 0
          },
          hasNextPage: !!result.response_metadata?.next_cursor,
          nextCursor: result.response_metadata?.next_cursor
        }
      };
    } catch (error: any) {
      console.error("Error getting thread replies:", error);
      return {
        success: false,
        message: `Failed to get thread replies: ${error.message}`,
        error: error
      };
    }
  }
  
  /**
   * Search messages in all channels
   */
  async searchMessages(query: string, limit: number = 50): Promise<SlackCommandResult> {
    await this.initialize();

    if (!this.slackClient) {
      return {
        success: false,
        message: "Slack client not initialized",
        error: new Error("Slack client not initialized")
      };
    }

    try {
      const result = await this.slackClient.search.messages({
        query: query,
        count: limit,
        sort: "timestamp"
      });

      // Create a custom response structure with the search results
      return {
        success: true,
        message: `Found ${result.messages?.total || 0} messages matching query`,
        data: {
          messages: result.messages?.matches || [],
          // Add any other properties as necessary
          // Safely handle pagination with optional chaining
          hasNextPage: result.messages?.pagination ? true : false,
          nextCursor: result.messages?.pagination ? 
            (result.messages.pagination as any).next_cursor : undefined
        }
      };
    } catch (error: any) {
      console.error("Error searching messages:", error);
      return {
        success: false,
        message: `Failed to search messages: ${error.message}`,
        error: error
      };
    }
  }
  
  /**
   * Get members of a channel
   */
  async getChannelMembers(channelIdOrName: string): Promise<SlackCommandResult> {
    await this.initialize();

    if (!this.slackClient) {
      return {
        success: false,
        message: "Slack client not initialized",
        error: new Error("Slack client not initialized")
      };
    }

    try {
      // Handle channel name with # prefix similar to getChannelInfo
      const channelIdentifier = channelIdOrName.startsWith('#') 
        ? channelIdOrName.substring(1) 
        : channelIdOrName;
      
      let channelId = channelIdentifier;
      
      // If it doesn't look like a Slack channel ID (not starting with C and not all alphanumeric+uppercase),
      // then try to find the channel by name first
      if (!channelIdentifier.match(/^C[0-9A-Z]+$/)) {
        try {
          // Try to find the channel by name
          const listResult = await this.slackClient.conversations.list({
            limit: 1000
          });
          
          const channel = listResult.channels?.find(c => 
            c.name === channelIdentifier || 
            c.name_normalized === channelIdentifier
          );
          
          if (channel && channel.id) {
            channelId = channel.id;
          }
        } catch (listError) {
          console.warn("Could not look up channel by name, trying direct ID lookup:", listError);
          // Continue with the original channelId attempt
        }
      }

      // Get members for the channel
      const result = await this.slackClient.conversations.members({
        channel: channelId
      });

      // Get user info for each member
      const memberDetails = [];
      for (const memberId of result.members || []) {
        try {
          const userInfo = await this.slackClient.users.info({
            user: memberId
          });
          if (userInfo.user) {
            memberDetails.push(userInfo.user);
          }
        } catch (error) {
          console.warn(`Missing permission scope to get user info. Need users:read permission for ${memberId}`);
          // Add minimal info if we can't get full user details
          memberDetails.push({ id: memberId });
        }
      }

      // Create a custom response structure for members
      return {
        success: true,
        message: `Found ${result.members?.length || 0} members in channel`,
        data: {
          // Include channel info in the response
          channel: channelId, // Use 'channel' instead of 'channelId' to match the expected type
          messages: memberDetails, // Store member details in the messages array to match the response type
          // Safely handle pagination with optional chaining
          hasNextPage: !!result.response_metadata?.next_cursor,
          nextCursor: result.response_metadata?.next_cursor
        }
      };
    } catch (error: any) {
      console.error("Error getting channel members:", error);
      return {
        success: false,
        message: `Failed to get channel members: ${error.message}`,
        error: error
      };
    }
  }
}

// Create a singleton instance
const slackMcpClient = new SlackMcpClient();

/**
 * Process commands related to Slack using the MCP client
 */
export async function processSlackMcpCommand(
  command: string,
  classification: any
): Promise<SlackCommandResult> {
  try {
    // Map between our classification intents and MCP client methods
    switch (classification.intent) {
      case "get_messages":
      case "read_messages":
        const channelId = classification.parameters.channelId || process.env.SLACK_CHANNEL_ID;
        const limit = classification.parameters.limit || 10;
        const cursor = classification.parameters.cursor;
        
        if (!channelId) {
          return {
            success: false,
            message: "Channel ID is required but was not provided",
            error: new Error("Channel ID is required")
          };
        }
        
        return await slackMcpClient.getMessages(channelId, limit, cursor);
        
      case "send_message":
        const messageChannelId = classification.parameters.channelId || process.env.SLACK_CHANNEL_ID;
        const text = classification.parameters.text || classification.parameters.message;
        const blocks = classification.parameters.blocks;
        const threadTs = classification.parameters.threadTs;
        
        if (!messageChannelId) {
          return {
            success: false,
            message: "Channel ID is required but was not provided",
            error: new Error("Channel ID is required")
          };
        }
        
        if (!text && !blocks) {
          return {
            success: false,
            message: "Message text is required but was not provided",
            error: new Error("Message text is required")
          };
        }
        
        return await slackMcpClient.sendMessage(messageChannelId, text, blocks, threadTs);
        
      case "update_message":
        const updateChannelId = classification.parameters.channelId;
        const ts = classification.parameters.ts;
        const updateText = classification.parameters.text;
        const updateBlocks = classification.parameters.blocks;
        
        if (!updateChannelId || !ts) {
          return {
            success: false,
            message: "Channel ID and message timestamp are required",
            error: new Error("Channel ID and message timestamp are required")
          };
        }
        
        return await slackMcpClient.updateMessage(updateChannelId, ts, updateText, updateBlocks);
        
      case "list_channels":
        const channelsLimit = classification.parameters.limit || 100;
        const channelsCursor = classification.parameters.cursor;
        
        return await slackMcpClient.listChannels(channelsLimit, channelsCursor);
        
      case "list_users":
        const usersLimit = classification.parameters.limit || 100;
        const usersCursor = classification.parameters.cursor;
        
        return await slackMcpClient.listUsers(usersLimit, usersCursor);
        
      case "join_channel":
        const joinChannelId = classification.parameters.channelId;
        
        if (!joinChannelId) {
          return {
            success: false,
            message: "Channel ID is required but was not provided",
            error: new Error("Channel ID is required")
          };
        }
        
        return await slackMcpClient.joinChannel(joinChannelId);
        
      case "get_channel_info":
        // Support both channel and channelId parameters for flexibility
        const infoChannelId = classification.parameters.channelId || classification.parameters.channel;
        
        if (!infoChannelId) {
          return {
            success: false,
            message: "Channel ID or name is required but was not provided",
            error: new Error("Channel ID or name is required")
          };
        }
        
        return await slackMcpClient.getChannelInfo(infoChannelId);
        
      case "get_thread_replies":
        const threadChannelId = classification.parameters.channelId;
        const threadId = classification.parameters.threadTs;
        const threadLimit = classification.parameters.limit || 100;
        
        if (!threadChannelId || !threadId) {
          return {
            success: false,
            message: "Channel ID and thread timestamp are required",
            error: new Error("Channel ID and thread timestamp are required")
          };
        }
        
        return await slackMcpClient.getThreadReplies(threadChannelId, threadId, threadLimit);
        
      case "search_messages":
        const searchQuery = classification.parameters.query;
        const searchLimit = classification.parameters.limit || 50;
        
        if (!searchQuery) {
          return {
            success: false,
            message: "Search query is required but was not provided",
            error: new Error("Search query is required")
          };
        }
        
        return await slackMcpClient.searchMessages(searchQuery, searchLimit);
      
      case "get_channel_members":
        const membersChannel = classification.parameters.channel || classification.parameters.channelId;
        
        if (!membersChannel) {
          return {
            success: false,
            message: "Channel ID or name is required but was not provided",
            error: new Error("Channel ID or name is required")
          };
        }
        
        return await slackMcpClient.getChannelMembers(membersChannel);
        
      default:
        return {
          success: false,
          message: `Unsupported Slack command intent: ${classification.intent}`,
          error: new Error(`Unsupported Slack command intent: ${classification.intent}`)
        };
    }
  } catch (error: any) {
    console.error("Error processing Slack command:", error);
    return {
      success: false,
      message: `Error processing Slack command: ${error.message}`,
      error: error
    };
  }
}

export { slackMcpClient };