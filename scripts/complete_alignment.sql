
-- First, set up the execute_sql function
-- Create execute_sql function
CREATE OR REPLACE FUNCTION public.execute_sql(query text)
RETURNS SETOF json AS $$
BEGIN
    RETURN QUERY EXECUTE query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO service_role; 

-- Then, align the data structures
-- Add missing columns to training_data
ALTER TABLE public.training_data
ADD COLUMN IF NOT EXISTS feedback_score INTEGER,
ADD COLUMN IF NOT EXISTS feedback_notes TEXT,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Add missing columns to user_data
ALTER TABLE public.user_data
ADD COLUMN IF NOT EXISTS systems TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS workflow TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS follow_up_queries TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS follow_up_responses TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS follow_up_context JSONB DEFAULT '{}'::jsonb;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_training_data_feedback ON public.training_data(feedback_score);
CREATE INDEX IF NOT EXISTS idx_training_data_archived ON public.training_data(is_archived);
CREATE INDEX IF NOT EXISTS idx_user_data_systems ON public.user_data USING gin(systems);
CREATE INDEX IF NOT EXISTS idx_user_data_workflow ON public.user_data USING gin(workflow);
CREATE INDEX IF NOT EXISTS idx_user_data_follow_up ON public.user_data USING gin(follow_up_queries);

-- Add comments for documentation
COMMENT ON COLUMN public.training_data.feedback_score IS 'Quality score for the training data (1-5)';
COMMENT ON COLUMN public.training_data.feedback_notes IS 'Notes about the quality or effectiveness of the training data';
COMMENT ON COLUMN public.training_data.is_archived IS 'Whether this training data entry is archived';
COMMENT ON COLUMN public.user_data.systems IS 'Array of systems involved in the interaction';
COMMENT ON COLUMN public.user_data.workflow IS 'Array of steps in the workflow';
COMMENT ON COLUMN public.user_data.follow_up_queries IS 'Array of follow-up queries that can be used after this response';
COMMENT ON COLUMN public.user_data.follow_up_responses IS 'Array of responses to the follow-up queries';
COMMENT ON COLUMN public.user_data.follow_up_context IS 'Context information needed for follow-up responses';

-- Drop the view if it exists to avoid errors
DROP VIEW IF EXISTS public.combined_training_view;

-- Create a view to combine all data sources
CREATE OR REPLACE VIEW public.combined_training_view AS
SELECT 
    'training' as source_type,
    id,
    NULL as user_id,
    tool,
    intent,
    query,
    response,
    systems,
    workflow,
    execution_details,
    applied_guidelines,
    metadata,
    follow_up_queries,
    follow_up_responses,
    follow_up_context,
    feedback_score,
    feedback_notes,
    is_archived,
    created_at,
    updated_at
FROM public.training_data
WHERE is_active = TRUE AND is_archived = FALSE

UNION ALL

SELECT 
    'user' as source_type,
    id,
    user_id,
    tool,
    intent,
    query,
    response,
    systems,
    workflow,
    execution_details,
    applied_guidelines,
    metadata,
    follow_up_queries,
    follow_up_responses,
    follow_up_context,
    feedback_score,
    feedback_notes,
    is_archived,
    created_at,
    updated_at
FROM public.user_data
WHERE is_archived = FALSE; 
