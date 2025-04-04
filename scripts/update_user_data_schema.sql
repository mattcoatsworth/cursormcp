-- Update user_data table to match training_data structure while preserving user-specific fields
DO $$ 
BEGIN
    -- Add missing columns from training_data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_data' AND column_name = 'systems') THEN
        ALTER TABLE public.user_data ADD COLUMN systems TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_data' AND column_name = 'workflow') THEN
        ALTER TABLE public.user_data ADD COLUMN workflow TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_data' AND column_name = 'follow_up_queries') THEN
        ALTER TABLE public.user_data ADD COLUMN follow_up_queries TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_data' AND column_name = 'follow_up_responses') THEN
        ALTER TABLE public.user_data ADD COLUMN follow_up_responses TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_data' AND column_name = 'follow_up_context') THEN
        ALTER TABLE public.user_data ADD COLUMN follow_up_context JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add indexes to match training_data
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_data' AND indexname = 'idx_user_data_follow_up') THEN
        CREATE INDEX idx_user_data_follow_up ON public.user_data USING gin (follow_up_queries);
    END IF;

    -- Add comments for documentation
    COMMENT ON COLUMN public.user_data.systems IS 'Array of systems involved in the workflow';
    COMMENT ON COLUMN public.user_data.workflow IS 'Array of steps in the workflow';
    COMMENT ON COLUMN public.user_data.follow_up_queries IS 'Array of follow-up queries that can be used after this response';
    COMMENT ON COLUMN public.user_data.follow_up_responses IS 'Array of responses to the follow-up queries';
    COMMENT ON COLUMN public.user_data.follow_up_context IS 'Context information needed for follow-up responses';
END $$;

-- Create view for user data statistics (similar to training_data_stats)
CREATE OR REPLACE VIEW public.user_data_stats AS
SELECT 
    user_id,
    COUNT(*) as total_interactions,
    COUNT(DISTINCT query) as unique_queries,
    AVG(array_length(workflow, 1)) as avg_workflow_length,
    AVG(array_length(follow_up_queries, 1)) as avg_follow_ups,
    AVG(feedback_score) as avg_feedback_score,
    jsonb_object_agg(
        system,
        count
    ) as systems_distribution,
    COUNT(*) FILTER (WHERE feedback_score >= 4) as positive_interactions,
    COUNT(*) FILTER (WHERE feedback_score <= 2) as negative_interactions
FROM (
    SELECT 
        user_id,
        query,
        workflow,
        follow_up_queries,
        feedback_score,
        unnest(systems) as system,
        COUNT(*) as count
    FROM public.user_data
    GROUP BY 
        user_id, 
        query, 
        workflow, 
        follow_up_queries, 
        feedback_score, 
        system
) as user_systems
GROUP BY user_id;

-- Create function to search user data (similar to search_training_data)
CREATE OR REPLACE FUNCTION public.search_user_data(
    p_user_id UUID,
    search_query TEXT,
    system_filter TEXT[] DEFAULT NULL,
    min_workflow_length INTEGER DEFAULT NULL,
    max_workflow_length INTEGER DEFAULT NULL,
    min_feedback_score INTEGER DEFAULT NULL
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
    feedback_score INTEGER,
    feedback_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ud.id,
        ud.query,
        ud.response,
        ud.systems,
        ud.workflow,
        ud.metadata,
        ud.follow_up_queries,
        ud.follow_up_responses,
        ud.follow_up_context,
        ud.feedback_score,
        ud.feedback_notes,
        ud.created_at,
        similarity(ud.query, search_query) as similarity
    FROM public.user_data ud
    WHERE 
        ud.user_id = p_user_id
        AND (system_filter IS NULL OR ud.systems && system_filter)
        AND (min_workflow_length IS NULL OR array_length(ud.workflow, 1) >= min_workflow_length)
        AND (max_workflow_length IS NULL OR array_length(ud.workflow, 1) <= max_workflow_length)
        AND (min_feedback_score IS NULL OR ud.feedback_score >= min_feedback_score)
        AND similarity(ud.query, search_query) > 0.3
    ORDER BY similarity DESC;
END;
$$ LANGUAGE plpgsql;
