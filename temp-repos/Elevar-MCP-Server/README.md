# Elevar MCP Server

    This is a Model Context Protocol (MCP) server for interacting with the Elevar API. It provides tools and resources for managing data sources and querying analytics data.

    ## Setup

    1. Clone this repository
    2. Install dependencies:
       ```
       npm install
       ```
    3. Create a `.env` file with your Elevar API key:
       ```
       ELEVAR_API_KEY=your_api_key_here
       ```
    4. Start the server:
       ```
       npm run dev
       ```

    ## Testing with MCP Inspector

    You can test the server using the MCP Inspector:

    ```
    npm run inspect
    ```

    This will open a web interface where you can:
    - Browse available resources
    - Test tools with different inputs
    - View server logs

    ## Available Resources

    - `elevar://account` - Get account information
    - `elevar://data-sources` - List all data sources
    - `elevar://data-source/{id}` - Get details for a specific data source

    ## Available Tools

    - `create_data_source` - Create a new data source
    - `update_data_source` - Update an existing data source
    - `delete_data_source` - Delete a data source
    - `query_data` - Query data from a data source
    - `get_metadata` - Get available metrics and dimensions for a data source

    ## API Documentation

    For more information about the Elevar API, see the [official documentation](https://docs.getelevar.com/docs/getting-started-overview).
