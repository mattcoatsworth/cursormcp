-- Add missing columns from training_data to user_data table
ALTER TABLE public.user_data
    -- Add rating and feedback columns
    ADD COLUMN IF NOT EXISTS rating INTEGER,
    ADD COLUMN IF NOT EXISTS feedback TEXT,
    ADD COLUMN IF NOT EXISTS query_rating INTEGER,
    ADD COLUMN IF NOT EXISTS query_feedback TEXT,
    ADD COLUMN IF NOT EXISTS response_rating INTEGER,
    ADD COLUMN IF NOT EXISTS response_feedback TEXT,
    ADD COLUMN IF NOT EXISTS endpoint_rating INTEGER,
    ADD COLUMN IF NOT EXISTS endpoint_feedback TEXT,
    
    -- Add other training_data columns
    ADD COLUMN IF NOT EXISTS systems TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS workflow TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS follow_up_queries TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS follow_up_responses TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS follow_up_context JSONB DEFAULT '{}'::jsonb;

-- Add indexes to match training_data
CREATE INDEX IF NOT EXISTS idx_user_data_follow_up ON public.user_data USING gin (follow_up_queries);
CREATE INDEX IF NOT EXISTS idx_user_data_rating ON public.user_data(rating);
CREATE INDEX IF NOT EXISTS idx_user_data_query_rating ON public.user_data(query_rating);
CREATE INDEX IF NOT EXISTS idx_user_data_response_rating ON public.user_data(response_rating);
CREATE INDEX IF NOT EXISTS idx_user_data_endpoint_rating ON public.user_data(endpoint_rating);

-- Add comments for documentation
COMMENT ON COLUMN public.user_data.rating IS 'Overall rating for the interaction';
COMMENT ON COLUMN public.user_data.feedback IS 'Overall feedback text';
COMMENT ON COLUMN public.user_data.query_rating IS 'Rating specific to the user query';
COMMENT ON COLUMN public.user_data.query_feedback IS 'Feedback specific to the user query';
COMMENT ON COLUMN public.user_data.response_rating IS 'Rating specific to the system response';
COMMENT ON COLUMN public.user_data.response_feedback IS 'Feedback specific to the system response';
COMMENT ON COLUMN public.user_data.endpoint_rating IS 'Rating specific to the endpoint performance';
COMMENT ON COLUMN public.user_data.endpoint_feedback IS 'Feedback specific to the endpoint performance';
COMMENT ON COLUMN public.user_data.systems IS 'Array of systems involved in the workflow';
COMMENT ON COLUMN public.user_data.workflow IS 'Array of steps in the workflow';
COMMENT ON COLUMN public.user_data.follow_up_queries IS 'Array of follow-up queries that can be used after this response';
COMMENT ON COLUMN public.user_data.follow_up_responses IS 'Array of responses to the follow-up queries';
COMMENT ON COLUMN public.user_data.follow_up_context IS 'Context information needed for follow-up responses';

-- Update existing rows to populate the new columns with default values
UPDATE public.user_data
SET 
    -- Convert existing feedback_score to new rating columns if present
    rating = feedback_score,
    query_rating = feedback_score,
    response_rating = feedback_score,
    
    -- Convert existing feedback_notes to new feedback columns if present
    feedback = feedback_notes,
    query_feedback = feedback_notes,
    response_feedback = feedback_notes,
    
    -- Set other columns
    systems = COALESCE(
        (metadata->>'systems')::TEXT[], 
        ARRAY['together_ai']
    ),
    workflow = COALESCE(
        (metadata->>'workflow')::TEXT[],
        ARRAY['receive_query', 'generate_response']
    ),
    follow_up_queries = '{}',
    follow_up_responses = '{}',
    follow_up_context = '{}'::jsonb
WHERE 
    systems IS NULL 
    OR workflow IS NULL 
    OR follow_up_queries IS NULL 
    OR follow_up_responses IS NULL 
    OR follow_up_context IS NULL
    OR rating IS NULL
    OR query_rating IS NULL
    OR response_rating IS NULL
    OR endpoint_rating IS NULL;
