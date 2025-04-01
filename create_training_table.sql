-- training_data table for MCP training data
CREATE TABLE IF NOT EXISTS public.training_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool TEXT NOT NULL,
  intent TEXT NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster searching
CREATE INDEX IF NOT EXISTS idx_training_data_tool ON public.training_data (tool);
CREATE INDEX IF NOT EXISTS idx_training_data_intent ON public.training_data (intent);
CREATE INDEX IF NOT EXISTS idx_training_data_tool_intent ON public.training_data (tool, intent);

-- Enable full text search for the query field
CREATE INDEX IF NOT EXISTS idx_training_data_query_fts ON public.training_data USING gin(to_tsvector('english', query));

-- Comments for documentation
COMMENT ON TABLE public.training_data IS 'Stores training data for MCP tools and intents';
COMMENT ON COLUMN public.training_data.tool IS 'The name of the e-commerce tool/service (e.g., Shopify, Klaviyo)';
COMMENT ON COLUMN public.training_data.intent IS 'The specific intent for the tool (e.g., Check Order Status)';
COMMENT ON COLUMN public.training_data.query IS 'The user query text';
COMMENT ON COLUMN public.training_data.response IS 'The system response text';
COMMENT ON COLUMN public.training_data.metadata IS 'Additional metadata about the training example';

-- Create training data table in Supabase
CREATE TABLE IF NOT EXISTS public.training_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    systems TEXT[] NOT NULL,
    workflow TEXT[] NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(query)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_training_data_systems ON public.training_data USING GIN (systems);
CREATE INDEX IF NOT EXISTS idx_training_data_workflow ON public.training_data USING GIN (workflow);
CREATE INDEX IF NOT EXISTS idx_training_data_metadata ON public.training_data USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_training_data_created_at ON public.training_data (created_at);

-- Enable full text search for the query field
CREATE INDEX IF NOT EXISTS idx_training_data_query_fts ON public.training_data USING gin(to_tsvector('english', query));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_training_data_updated_at
    BEFORE UPDATE ON public.training_data
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for training data statistics
CREATE OR REPLACE VIEW public.training_data_stats AS
SELECT 
    COUNT(*) as total_examples,
    COUNT(DISTINCT query) as unique_queries,
    AVG(array_length(workflow, 1)) as avg_workflow_length,
    jsonb_object_agg(
        system,
        count
    ) as systems_distribution
FROM (
    SELECT 
        unnest(systems) as system,
        COUNT(*) as count
    FROM public.training_data
    GROUP BY system
) as systems_count;

-- Create function to search training data
CREATE OR REPLACE FUNCTION public.search_training_data(
    search_query TEXT,
    system_filter TEXT[] DEFAULT NULL,
    min_workflow_length INTEGER DEFAULT NULL,
    max_workflow_length INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    query TEXT,
    response TEXT,
    systems TEXT[],
    workflow TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        td.id,
        td.query,
        td.response,
        td.systems,
        td.workflow,
        td.metadata,
        td.created_at,
        similarity(td.query, search_query) as similarity
    FROM public.training_data td
    WHERE 
        (system_filter IS NULL OR td.systems && system_filter)
        AND (min_workflow_length IS NULL OR array_length(td.workflow, 1) >= min_workflow_length)
        AND (max_workflow_length IS NULL OR array_length(td.workflow, 1) <= max_workflow_length)
        AND similarity(td.query, search_query) > 0.3
    ORDER BY similarity DESC;
END;
$$ LANGUAGE plpgsql;

-- Set up Row Level Security (RLS)
ALTER TABLE public.training_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.training_data
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policy to allow read operations for anon users
CREATE POLICY "Allow read operations for anon users" ON public.training_data
    FOR SELECT
    TO anon
    USING (true);