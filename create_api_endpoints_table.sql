-- Create api_endpoints table
CREATE TABLE IF NOT EXISTS public.api_endpoints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service TEXT NOT NULL,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    parameters JSONB DEFAULT '{}'::jsonb,
    auth_type TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    rate_limit TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(service, resource, action)
);

-- Create indexes for faster searching
CREATE INDEX IF NOT EXISTS idx_api_endpoints_service ON public.api_endpoints (service);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_resource ON public.api_endpoints (resource);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_action ON public.api_endpoints (action);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_api_endpoints_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_api_endpoints_updated_at
    BEFORE UPDATE ON public.api_endpoints
    FOR EACH ROW
    EXECUTE FUNCTION update_api_endpoints_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.api_endpoints IS 'Stores API endpoint definitions for various services';
COMMENT ON COLUMN public.api_endpoints.service IS 'The name of the service (e.g., Shopify, Klaviyo)';
COMMENT ON COLUMN public.api_endpoints.resource IS 'The resource type (e.g., products, orders)';
COMMENT ON COLUMN public.api_endpoints.action IS 'The specific action (e.g., list, get)';
COMMENT ON COLUMN public.api_endpoints.method IS 'The HTTP method (e.g., GET, POST)';
COMMENT ON COLUMN public.api_endpoints.path IS 'The API endpoint path';
COMMENT ON COLUMN public.api_endpoints.parameters IS 'Required parameters for the endpoint';
COMMENT ON COLUMN public.api_endpoints.auth_type IS 'The type of authentication required';
COMMENT ON COLUMN public.api_endpoints.auth_key IS 'The key used for authentication';
COMMENT ON COLUMN public.api_endpoints.rate_limit IS 'The rate limit for the endpoint'; 