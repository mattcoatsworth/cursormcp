import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
    import { z } from 'zod';
    import * as api from './api.js';

    // Create an MCP server for Postscript API
    const server = new McpServer({
      name: "Postscript API",
      version: "1.0.0",
      description: "MCP server for interacting with the Postscript SMS marketing platform"
    });

    // Define common schemas
    const ShopIdSchema = z.string().describe("The Postscript shop ID");
    const PaginationSchema = z.object({
      page: z.number().optional().describe("Page number for pagination"),
      per_page: z.number().optional().describe("Number of items per page")
    }).optional();

    // Shop resources and tools
    server.resource(
      "shops",
      new ResourceTemplate("postscript://shops", { list: undefined }),
      async (uri) => {
        try {
          const shops = await api.getShops();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(shops, null, 2)
            }]
          };
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error fetching shops: ${JSON.stringify(error, null, 2)}`
            }]
          };
        }
      }
    );

    server.resource(
      "shop",
      new ResourceTemplate("postscript://shops/{shopId}", { list: undefined }),
      async (uri, { shopId }) => {
        try {
          const shop = await api.getShop(shopId);
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(shop, null, 2)
            }]
          };
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error fetching shop ${shopId}: ${JSON.stringify(error, null, 2)}`
            }]
          };
        }
      }
    );

    server.tool(
      "get_shops",
      {},
      async () => {
        try {
          const shops = await api.getShops();
          return {
            content: [{ type: "text", text: JSON.stringify(shops, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error fetching shops: ${JSON.stringify(error, null, 2)}` }],
            isError: true
          };
        }
      },
      { description: "Get all Postscript shops" }
    );

    server.tool(
      "get_shop",
      { shopId: ShopIdSchema },
      async ({ shopId }) => {
        try {
          const shop = await api.getShop(shopId);
          return {
            content: [{ type: "text", text: JSON.stringify(shop, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error fetching shop ${shopId}: ${JSON.stringify(error, null, 2)}` }],
            isError: true
          };
        }
      },
      { description: "Get a specific Postscript shop by ID" }
    );

    // Subscriber resources and tools
    server.resource(
      "subscribers",
      new ResourceTemplate("postscript://shops/{shopId}/subscribers", { list: undefined }),
      async (uri, { shopId }) => {
        try {
          const subscribers = await api.getSubscribers(shopId);
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(subscribers, null, 2)
            }]
          };
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error fetching subscribers for shop ${shopId}: ${JSON.stringify(error, null, 2)}`
            }]
          };
        }
      }
    );

    server.resource(
      "subscriber",
      new ResourceTemplate("postscript://shops/{shopId}/subscribers/{subscriberId}", { list: undefined }),
      async (uri, { shopId, subscriberId }) => {
        try {
          const subscriber = await api.getSubscriber(shopId, subscriberId);
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(subscriber, null, 2)
            }]
          };
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error fetching subscriber ${subscriberId} for shop ${shopId}: ${JSON.stringify(error, null, 2)}`
            }]
          };
        }
      }
    );

    server.tool(
      "get_subscribers",
      { 
        shopId: ShopIdSchema,
        pagination: PaginationSchema
      },
      async ({ shopId, pagination = {} }) => {
        try {
          const subscribers = await api.getSubscribers(shopId, pagination);
          return {
            content: [{ type: "text", text: JSON.stringify(subscribers, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error fetching subscribers for shop ${shopId}: ${JSON.stringify(error, null, 2)}` }],
            isError: true
          };
        }
      },
      { description: "Get subscribers for a specific shop" }
    );

    server.tool(
      "get_subscriber",
      { 
        shopId: ShopIdSchema,
        subscriberId: z.string().describe("The subscriber ID")
      },
      async ({ shopId, subscriberId }) => {
        try {
          const subscriber = await api.getSubscriber(shopId, subscriberId);
          return {
            content: [{ type: "text", text: JSON.stringify(subscriber, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error fetching subscriber ${subscriberId} for shop ${shopId}: ${JSON.stringify(error, null, 2)}` }],
            isError: true
          };
        }
      },
      { description: "Get a specific subscriber by ID" }
    );

    server.tool(
      "create_subscriber",
      { 
        shopId: ShopIdSchema,
        phone_number: z.string().describe("The subscriber's phone number"),
        email: z.string().optional().describe("The subscriber's email address"),
        first_name: z.string().optional().describe("The subscriber's first name"),
        last_name: z.string().optional().describe("The subscriber's last name"),
        tags: z.array(z.string()).optional().describe("Tags to apply to the subscriber"),
        properties: z.record(z.string()).optional().describe("Custom properties for the subscriber")
      },
      async ({ shopId, ...subscriberData }) => {
        try {
          const result = await api.createSubscriber(shopId, subscriberData);
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error creating subscriber: ${JSON.stringify(error, null, 2)}` }],
            isError: true
          };
        }
      },
      { description: "Create a new subscriber" }
    );

    server.tool(
      "update_subscriber",
      { 
        shopId: ShopIdSchema,
        subscriberId: z.string().describe("The subscriber ID"),
        email: z.string().optional().describe("The subscriber's email address"),
        first_name: z.string().optional().describe("The subscriber's first name"),
        last_name: z.string().optional().describe("The subscriber's last name"),
        tags: z.array(z.string()).optional().describe("Tags to apply to the subscriber"),
        properties: z.record(z.string()).optional().describe("Custom properties for the subscriber")
      },
      async ({ shopId, subscriberId, ...subscriberData }) => {
        try {
          const result = await api.updateSubscriber(shopId, subscriberId, subscriberData);
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error updating subscriber ${subscriberId}: ${JSON.stringify(error, null, 2)}` }],
            isError: true
          };
        }
      },
      { description: "Update an existing subscriber" }
    );

    // Campaign resources and tools
    server.resource(
      "campaigns",
      new ResourceTemplate("postscript://shops/{shopId}/campaigns", { list: undefined }),
      async (uri, { shopId }) => {
        try {
          const campaigns = await api.getCampaigns(shopId);
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(campaigns, null, 2)
            }]
          };
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error fetching campaigns for shop ${shopId}: ${JSON.stringify(error, null, 2)}`
            }]
          };
        }
      }
    );

    server.tool(
      "get_campaigns",
      { 
        shopId: ShopIdSchema,
        pagination: PaginationSchema
      },
      async ({ shopId, pagination = {} }) => {
        try {
          const campaigns = await api.getCampaigns(shopId, pagination);
          return {
            content: [{ type: "text", text: JSON.stringify(campaigns, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error fetching campaigns for shop ${shopId}: ${JSON.stringify(error, null, 2)}` }],
            isError: true
          };
        }
      },
      { description: "Get campaigns for a specific shop" }
    );

    server.tool(
      "create_campaign",
      { 
        shopId: ShopIdSchema,
        name: z.string().describe("Campaign name"),
        message_template: z.string().describe("The message template to send"),
        send_at: z.string().optional().describe("When to send the campaign (ISO 8601 format)"),
        audience: z.object({
          type: z.enum(["all", "tag", "segment"]).describe("Audience type"),
          value: z.string().optional().describe("Tag or segment name if applicable")
        }).describe("The audience for this campaign")
      },
      async ({ shopId, ...campaignData }) => {
        try {
          const result = await api.createCampaign(shopId, campaignData);
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error creating campaign: ${JSON.stringify(error, null, 2)}` }],
            isError: true
          };
        }
      },
      { description: "Create a new campaign" }
    );

    // Message tools
    server.tool(
      "send_message",
      { 
        shopId: ShopIdSchema,
        subscriber_id: z.string().describe("The subscriber ID to send the message to"),
        message: z.string().describe("The message content to send"),
        media_url: z.string().optional().describe("URL to media to include with the message")
      },
      async ({ shopId, ...messageData }) => {
        try {
          const result = await api.sendMessage(shopId, messageData);
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error sending message: ${JSON.stringify(error, null, 2)}` }],
            isError: true
          };
        }
      },
      { description: "Send a direct message to a subscriber" }
    );

    // Keyword tools
    server.tool(
      "get_keywords",
      { 
        shopId: ShopIdSchema,
        pagination: PaginationSchema
      },
      async ({ shopId, pagination = {} }) => {
        try {
          const keywords = await api.getKeywords(shopId, pagination);
          return {
            content: [{ type: "text", text: JSON.stringify(keywords, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error fetching keywords for shop ${shopId}: ${JSON.stringify(error, null, 2)}` }],
            isError: true
          };
        }
      },
      { description: "Get keywords for a specific shop" }
    );

    export { server };
