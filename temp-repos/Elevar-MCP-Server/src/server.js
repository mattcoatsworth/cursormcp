import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
    import { z } from 'zod';
    import { elevarApi } from './api.js';

    // Create an MCP server for Elevar
    const server = new McpServer({
      name: "Elevar API",
      version: "1.0.0",
      description: "MCP server for interacting with Elevar's API for analytics and data management"
    });

    // Add a resource to get account information
    server.resource(
      "account",
      new ResourceTemplate("elevar://account", { list: undefined }),
      async (uri) => {
        try {
          const accountInfo = await elevarApi.getAccount();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(accountInfo, null, 2)
            }]
          };
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error fetching account information: ${error.message}`
            }]
          };
        }
      }
    );

    // Add a resource to get data sources
    server.resource(
      "dataSources",
      new ResourceTemplate("elevar://data-sources", { list: undefined }),
      async (uri) => {
        try {
          const dataSources = await elevarApi.getDataSources();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(dataSources, null, 2)
            }]
          };
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error fetching data sources: ${error.message}`
            }]
          };
        }
      }
    );

    // Add a resource to get specific data source
    server.resource(
      "dataSource",
      new ResourceTemplate("elevar://data-source/{id}", { list: undefined }),
      async (uri, { id }) => {
        try {
          const dataSource = await elevarApi.getDataSource(id);
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(dataSource, null, 2)
            }]
          };
        } catch (error) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error fetching data source ${id}: ${error.message}`
            }]
          };
        }
      }
    );

    // Add a tool to create a data source
    server.tool(
      "create_data_source",
      {
        name: z.string().describe("Name of the data source"),
        type: z.enum(["ga4", "shopify", "custom"]).describe("Type of data source"),
        properties: z.record(z.any()).optional().describe("Additional properties for the data source")
      },
      async ({ name, type, properties = {} }) => {
        try {
          const result = await elevarApi.createDataSource(name, type, properties);
          return {
            content: [{ 
              type: "text", 
              text: `Data source created successfully: ${JSON.stringify(result, null, 2)}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error creating data source: ${error.message}` 
            }],
            isError: true
          };
        }
      },
      { description: "Create a new data source in Elevar" }
    );

    // Add a tool to update a data source
    server.tool(
      "update_data_source",
      {
        id: z.string().describe("ID of the data source to update"),
        name: z.string().optional().describe("New name for the data source"),
        properties: z.record(z.any()).optional().describe("Updated properties for the data source")
      },
      async ({ id, name, properties }) => {
        try {
          const updateData = {};
          if (name) updateData.name = name;
          if (properties) updateData.properties = properties;
          
          const result = await elevarApi.updateDataSource(id, updateData);
          return {
            content: [{ 
              type: "text", 
              text: `Data source updated successfully: ${JSON.stringify(result, null, 2)}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error updating data source: ${error.message}` 
            }],
            isError: true
          };
        }
      },
      { description: "Update an existing data source in Elevar" }
    );

    // Add a tool to delete a data source
    server.tool(
      "delete_data_source",
      {
        id: z.string().describe("ID of the data source to delete")
      },
      async ({ id }) => {
        try {
          await elevarApi.deleteDataSource(id);
          return {
            content: [{ 
              type: "text", 
              text: `Data source ${id} deleted successfully` 
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error deleting data source: ${error.message}` 
            }],
            isError: true
          };
        }
      },
      { description: "Delete a data source from Elevar" }
    );

    // Add a tool to query data
    server.tool(
      "query_data",
      {
        dataSourceId: z.string().describe("ID of the data source to query"),
        metrics: z.array(z.string()).describe("Metrics to include in the query"),
        dimensions: z.array(z.string()).optional().describe("Dimensions to include in the query"),
        filters: z.array(z.object({
          dimension: z.string(),
          operator: z.string(),
          value: z.union([z.string(), z.number(), z.boolean()])
        })).optional().describe("Filters to apply to the query"),
        dateRange: z.object({
          startDate: z.string(),
          endDate: z.string()
        }).describe("Date range for the query")
      },
      async ({ dataSourceId, metrics, dimensions = [], filters = [], dateRange }) => {
        try {
          const result = await elevarApi.queryData(dataSourceId, {
            metrics,
            dimensions,
            filters,
            dateRange
          });
          return {
            content: [{ 
              type: "text", 
              text: `Query results: ${JSON.stringify(result, null, 2)}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error querying data: ${error.message}` 
            }],
            isError: true
          };
        }
      },
      { description: "Query data from an Elevar data source" }
    );

    // Add a tool to get available metrics and dimensions
    server.tool(
      "get_metadata",
      {
        dataSourceId: z.string().describe("ID of the data source")
      },
      async ({ dataSourceId }) => {
        try {
          const metadata = await elevarApi.getMetadata(dataSourceId);
          return {
            content: [{ 
              type: "text", 
              text: `Metadata for data source ${dataSourceId}:\n${JSON.stringify(metadata, null, 2)}` 
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error fetching metadata: ${error.message}` 
            }],
            isError: true
          };
        }
      },
      { description: "Get available metrics and dimensions for a data source" }
    );

    export { server };
