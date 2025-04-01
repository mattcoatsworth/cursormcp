-- SQL commands for importing training data
-- Generated at 2025-03-31T23:59:57.930971

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS training_data (
    id TEXT PRIMARY KEY,
    tool TEXT NOT NULL,
    intent TEXT NOT NULL,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batch 1
INSERT INTO training_data (id, tool, intent, query, response, metadata, created_at, updated_at) VALUES
('20250331235942-5192db1d', 'Shopify', 'Check Order Status', 'Can you update me on the status of my recent orders?', 'To check the status of your recent orders, please log into your Shopify admin panel and navigate to ''Orders'' in the sidebar. Here, you can see a list of all your orders along with their current status, such as ''Pending'', ''Fulfilled'', or ''Shipped''. You can also use the search bar to quickly find a specific order by entering the order number or customer''s name.', '{"generation_date": "2025-03-31T23:59:42.393862", "model": "gpt-4o"}'::jsonb, '2025-03-31T23:59:42.393865', '2025-03-31T23:59:42.393867'),
('20250331235942-115cedbd', 'Shopify', 'Check Order Status', 'Show me the details of my last 5 orders.', 'To view the details of your last 5 orders, go to your Shopify admin dashboard and click on ''Orders'' from the left-hand menu. This will display a list of all your orders, with the most recent ones at the top. Click on each order number to see detailed information including the order status, customer details, items purchased, and any tracking information if the order has been shipped. This will help you stay updated on each order''s progress.', '{"generation_date": "2025-03-31T23:59:42.394165", "model": "gpt-4o"}'::jsonb, '2025-03-31T23:59:42.394169', '2025-03-31T23:59:42.394171')
ON CONFLICT (id) DO UPDATE SET
    tool = EXCLUDED.tool,
    intent = EXCLUDED.intent,
    query = EXCLUDED.query,
    response = EXCLUDED.response,
    metadata = EXCLUDED.metadata,
    updated_at = EXCLUDED.updated_at;
