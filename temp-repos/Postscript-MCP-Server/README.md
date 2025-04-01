# Postscript MCP Server

    An MCP server for interacting with the Postscript SMS marketing platform API.

    ## Setup

    1. Install dependencies:
       ```
       npm install
       ```

    2. Configure your API key:
       - Create a `.env` file in the root directory
       - Add your Postscript API key: `POSTSCRIPT_API_KEY=your_api_key_here`

    3. Run the server:
       ```
       npm run dev
       ```

    4. Test with MCP Inspector:
       ```
       npm run inspect
       ```

    ## Features

    This MCP server provides access to the following Postscript API features:

    - **Shops**: Get information about your Postscript shops
    - **Subscribers**: Manage SMS subscribers (create, update, retrieve)
    - **Campaigns**: Create and retrieve SMS campaigns
    - **Messages**: Send direct messages to subscribers
    - **Keywords**: Retrieve SMS keywords

    ## Available Tools

    - `get_shops`: Get all Postscript shops
    - `get_shop`: Get a specific shop by ID
    - `get_subscribers`: Get subscribers for a shop
    - `get_subscriber`: Get a specific subscriber by ID
    - `create_subscriber`: Create a new subscriber
    - `update_subscriber`: Update an existing subscriber
    - `get_campaigns`: Get campaigns for a shop
    - `create_campaign`: Create a new campaign
    - `send_message`: Send a direct message to a subscriber
    - `get_keywords`: Get keywords for a shop

    ## Available Resources

    - `postscript://shops`: List all shops
    - `postscript://shops/{shopId}`: Get a specific shop
    - `postscript://shops/{shopId}/subscribers`: List subscribers for a shop
    - `postscript://shops/{shopId}/subscribers/{subscriberId}`: Get a specific subscriber
    - `postscript://shops/{shopId}/campaigns`: List campaigns for a shop

    ## API Documentation

    For more information about the Postscript API, see:
    - [Getting Started](https://developers.postscript.io/docs/getting-started)
    - [API Reference](https://developers.postscript.io/reference/new-object-identifiers)
