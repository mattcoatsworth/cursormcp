-- Part 1: Create the table and basic structure
-- Drop existing table if it exists
DROP TABLE IF EXISTS public.training_data CASCADE;

-- Create the training_data table
CREATE TABLE public.training_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool TEXT NOT NULL,
  intent TEXT NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  systems TEXT[] DEFAULT '{}',
  workflow TEXT[] DEFAULT '{}',
  execution_details JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  follow_up_queries TEXT[] DEFAULT '{}',
  follow_up_responses TEXT[] DEFAULT '{}',
  follow_up_context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX idx_training_data_tool ON public.training_data (tool);
CREATE INDEX idx_training_data_intent ON public.training_data (intent);
CREATE INDEX idx_training_data_query ON public.training_data (query);
CREATE INDEX idx_training_data_follow_up ON public.training_data USING gin (follow_up_queries);

-- Temporarily disable RLS for testing
ALTER TABLE public.training_data DISABLE ROW LEVEL SECURITY;

-- Comments for documentation
COMMENT ON TABLE public.training_data IS 'Stores training data for MCP tools and intents';
COMMENT ON COLUMN public.training_data.tool IS 'The name of the e-commerce tool/service (e.g., Shopify, Klaviyo)';
COMMENT ON COLUMN public.training_data.intent IS 'The specific intent for the tool (e.g., Check Order Status)';
COMMENT ON COLUMN public.training_data.query IS 'The user query text';
COMMENT ON COLUMN public.training_data.response IS 'The system response text';
COMMENT ON COLUMN public.training_data.systems IS 'Array of systems involved in the workflow';
COMMENT ON COLUMN public.training_data.workflow IS 'Array of steps in the workflow';
COMMENT ON COLUMN public.training_data.execution_details IS 'Details about how the workflow was executed';
COMMENT ON COLUMN public.training_data.metadata IS 'Additional metadata about the training example';
COMMENT ON COLUMN public.training_data.follow_up_queries IS 'Array of follow-up queries that can be used after this response';
COMMENT ON COLUMN public.training_data.follow_up_responses IS 'Array of responses to the follow-up queries';
COMMENT ON COLUMN public.training_data.follow_up_context IS 'Context information needed for follow-up responses';

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_training_data_updated_at
    BEFORE UPDATE ON public.training_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for training data statistics
CREATE OR REPLACE VIEW public.training_data_stats AS
SELECT 
    COUNT(*) as total_examples,
    COUNT(DISTINCT query) as unique_queries,
    AVG(array_length(workflow, 1)) as avg_workflow_length,
    AVG(array_length(follow_up_queries, 1)) as avg_follow_ups,
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
    follow_up_queries TEXT[],
    follow_up_responses TEXT[],
    follow_up_context JSONB,
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
        td.follow_up_queries,
        td.follow_up_responses,
        td.follow_up_context,
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

-- Add execution_details column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'training_data' 
        AND column_name = 'execution_details'
    ) THEN
        ALTER TABLE public.training_data ADD COLUMN execution_details JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;