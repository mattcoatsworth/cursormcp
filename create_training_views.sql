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