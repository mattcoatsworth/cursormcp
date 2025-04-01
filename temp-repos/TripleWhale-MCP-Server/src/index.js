#!/usr/bin/env node
    import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
    import { server } from './server.js';
    import { validateConfig } from './config.js';

    console.log('Starting Triple Whale MCP server...');

    if (!validateConfig()) {
      console.warn('Warning: Triple Whale API credentials not configured. Please set TRIPLE_WHALE_API_KEY and TRIPLE_WHALE_SHOP_ID environment variables.');
      console.warn('The server will start, but API calls will fail until credentials are configured.');
    }

    // Start receiving messages on stdin and sending messages on stdout
    const transport = new StdioServerTransport();
    await server.connect(transport);
