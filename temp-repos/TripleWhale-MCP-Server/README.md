# Triple Whale MCP Server

    An MCP server for accessing Triple Whale e-commerce analytics data through the Triple Whale API.

    ## Features

    - Access to Blended Stats Table data
    - Shop information retrieval
    - Available metrics and dimensions discovery
    - MCP Inspector integration for testing

    ## Setup

    1. Clone this repository
    2. Install dependencies:
       ```
       npm install
       ```
    3. Create a `.env` file with your Triple Whale API credentials:
       ```
       TRIPLE_WHALE_API_KEY=your_api_key_here
       TRIPLE_WHALE_SHOP_ID=your_shop_id_here
       ```
    4. Run the server:
       ```
       npm run dev
       ```

    ## Testing with MCP Inspector

    To test the server with the MCP Inspector:

    ```
    npm run inspect
    ```

    This will open a web interface where you can:
    - Test all available tools with custom inputs
    - Browse available resources
    - View server logs and responses

    ## Available Tools

    - `get_blended_stats`: Get blended statistics from Triple Whale
    - `get_shop_info`: Get information about the configured shop
    - `get_available_metrics`: Get list of available metrics for the shop
    - `get_available_dimensions`: Get list of available dimensions for the shop

    ## Available Resources

    - `triplewhale://shop`: Information about the configured shop
    - `triplewhale://metrics`: List of available metrics
    - `triplewhale://dimensions`: List of available dimensions

    ## Example Usage

    ### Getting Blended Stats

    ```json
    {
      "dateRange": {
        "start": "2023-01-01",
        "end": "2023-01-31"
      },
      "metrics": [
        {
          "id": "revenue"
        },
        {
          "id": "orders"
        }
      ],
      "dimensions": [
        {
          "id": "utm_source"
        }
      ],
      "limit": 10
    }
    ```

    ## API Documentation

    For more information about the Triple Whale API, see:
    - [Blended Stats Table Documentation](https://triplewhale.readme.io/docs/blended-stats-table)
    - [Triple Whale API Reference](https://triplewhale.readme.io/reference/introduction-to-the-triple-whale-api)
