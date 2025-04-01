import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
    import { z } from 'zod';
    import { getBlendedStatsTable, getShopInfo, getAvailableMetrics, getAvailableDimensions } from './api.js';
    import { validateConfig } from './config.js';

    // Create an MCP server for Triple Whale API
    const server = new McpServer({
      name: "Triple Whale API",
      version: "1.0.0",
      description: "MCP server for accessing Triple Whale e-commerce analytics data"
    });

    // Define schemas for the blended stats table parameters
    const dateRangeSchema = z.object({
      start: z.string().describe("Start date in YYYY-MM-DD format"),
      end: z.string().describe("End date in YYYY-MM-DD format")
    }).describe("Date range for the query");

    const comparisonDateRangeSchema = z.object({
      start: z.string().describe("Comparison start date in YYYY-MM-DD format"),
      end: z.string().describe("Comparison end date in YYYY-MM-DD format")
    }).describe("Comparison date range for the query").optional();

    const metricSchema = z.object({
      id: z.string().describe("Metric ID"),
      name: z.string().describe("Display name for the metric").optional()
    }).describe("Metric to include in the results");

    const dimensionSchema = z.object({
      id: z.string().describe("Dimension ID"),
      name: z.string().describe("Display name for the dimension").optional()
    }).describe("Dimension to group results by");

    const filterSchema = z.object({
      dimension: z.string().describe("Dimension ID to filter on"),
      operator: z.enum(["equals", "not_equals", "contains", "not_contains", "starts_with", "ends_with", "greater_than", "less_than"]).describe("Filter operator"),
      value: z.union([z.string(), z.number()]).describe("Filter value")
    }).describe("Filter to apply to the results");

    // Add blended stats table tool
    server.tool(
      "get_blended_stats",
      {
        dateRange: dateRangeSchema,
        comparisonDateRange: comparisonDateRangeSchema.optional(),
        metrics: z.array(metricSchema).min(1).describe("Metrics to include in the results"),
        dimensions: z.array(dimensionSchema).optional().describe("Dimensions to group results by"),
        filters: z.array(filterSchema).optional().describe("Filters to apply to the results"),
        limit: z.number().positive().optional().describe("Maximum number of rows to return"),
        offset: z.number().nonnegative().optional().describe("Number of rows to skip")
      },
      async (params) => {
        if (!validateConfig()) {
          return {
            content: [{ type: "text", text: "Error: Triple Whale API credentials not configured. Please set TRIPLE_WHALE_API_KEY and TRIPLE_WHALE_SHOP_ID environment variables." }],
            isError: true
          };
        }

        try {
          const result = await getBlendedStatsTable(params);
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(result, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error fetching blended stats: ${error.response?.data?.message || error.message}`
            }],
            isError: true
          };
        }
      },
      { description: "Get blended statistics from Triple Whale" }
    );

    // Add shop info tool
    server.tool(
      "get_shop_info",
      {},
      async () => {
        if (!validateConfig()) {
          return {
            content: [{ type: "text", text: "Error: Triple Whale API credentials not configured. Please set TRIPLE_WHALE_API_KEY and TRIPLE_WHALE_SHOP_ID environment variables." }],
            isError: true
          };
        }

        try {
          const result = await getShopInfo();
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(result, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error fetching shop info: ${error.response?.data?.message || error.message}`
            }],
            isError: true
          };
        }
      },
      { description: "Get information about the configured shop" }
    );

    // Add available metrics tool
    server.tool(
      "get_available_metrics",
      {},
      async () => {
        if (!validateConfig()) {
          return {
            content: [{ type: "text", text: "Error: Triple Whale API credentials not configured. Please set TRIPLE_WHALE_API_KEY and TRIPLE_WHALE_SHOP_ID environment variables." }],
            isError: true
          };
        }

        try {
          const result = await getAvailableMetrics();
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(result, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error fetching available metrics: ${error.response?.data?.message || error.message}`
            }],
            isError: true
          };
        }
      },
      { description: "Get list of available metrics for the shop" }
    );

    // Add available dimensions tool
    server.tool(
      "get_available_dimensions",
      {},
      async () => {
        if (!validateConfig()) {
          return {
            content: [{ type: "text", text: "Error: Triple Whale API credentials not configured. Please set TRIPLE_WHALE_API_KEY and TRIPLE_WHALE_SHOP_ID environment variables." }],
            isError: true
          };
        }

        try {
          const result = await getAvailableDimensions();
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(result, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error fetching available dimensions: ${error.response?.data?.message || error.message}`
            }],
            isError: true
          };
        }
      },
      { description: "Get list of available dimensions for the shop" }
    );

    // Add shop resource
    server.resource(
      "shop",
      new ResourceTemplate("triplewhale://shop", { list: undefined }),
      async (uri) => {
        if (!validateConfig()) {
          return {
            contents: [{
              uri: uri.href,
              text: "Error: Triple Whale API credentials not configured. Please set TRIPLE_WHALE_API_KEY and TRIPLE_WHALE_SHOP_ID environment variables."
            }]
          };
        }

        try {
          const shopInfo = await getShopInfo();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(shopInfo, null, 2)
            }]
          };
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error fetching shop info: ${error.response?.data?.message || error.message}`
            }]
          };
        }
      }
    );

    // Add metrics resource
    server.resource(
      "metrics",
      new ResourceTemplate("triplewhale://metrics", { list: undefined }),
      async (uri) => {
        if (!validateConfig()) {
          return {
            contents: [{
              uri: uri.href,
              text: "Error: Triple Whale API credentials not configured. Please set TRIPLE_WHALE_API_KEY and TRIPLE_WHALE_SHOP_ID environment variables."
            }]
          };
        }

        try {
          const metrics = await getAvailableMetrics();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(metrics, null, 2)
            }]
          };
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error fetching available metrics: ${error.response?.data?.message || error.message}`
            }]
          };
        }
      }
    );

    // Add dimensions resource
    server.resource(
      "dimensions",
      new ResourceTemplate("triplewhale://dimensions", { list: undefined }),
      async (uri) => {
        if (!validateConfig()) {
          return {
            contents: [{
              uri: uri.href,
              text: "Error: Triple Whale API credentials not configured. Please set TRIPLE_WHALE_API_KEY and TRIPLE_WHALE_SHOP_ID environment variables."
            }]
          };
        }

        try {
          const dimensions = await getAvailableDimensions();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(dimensions, null, 2)
            }]
          };
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error fetching available dimensions: ${error.response?.data?.message || error.message}`
            }]
          };
        }
      }
    );

    export { server };
