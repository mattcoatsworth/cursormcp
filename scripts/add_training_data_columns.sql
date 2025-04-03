-- Add new columns to training_data table
ALTER TABLE public.training_data
ADD COLUMN IF NOT EXISTS query_rating INTEGER,
ADD COLUMN IF NOT EXISTS query_feedback TEXT,
ADD COLUMN IF NOT EXISTS response_rating INTEGER,
ADD COLUMN IF NOT EXISTS response_feedback TEXT,
ADD COLUMN IF NOT EXISTS endpoint_rating INTEGER,
ADD COLUMN IF NOT EXISTS endpoint_feedback TEXT;

-- Add comments to the new columns
COMMENT ON COLUMN public.training_data.query_rating IS 'Rating (1-10) for the query quality';
COMMENT ON COLUMN public.training_data.query_feedback IS 'Feedback about the query';
COMMENT ON COLUMN public.training_data.response_rating IS 'Rating (1-10) for the response quality';
COMMENT ON COLUMN public.training_data.response_feedback IS 'Feedback about the response';
COMMENT ON COLUMN public.training_data.endpoint_rating IS 'Rating (1-10) for the endpoint quality';
COMMENT ON COLUMN public.training_data.endpoint_feedback IS 'Feedback about the endpoint';

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_training_data_query_rating ON public.training_data(query_rating);
CREATE INDEX IF NOT EXISTS idx_training_data_response_rating ON public.training_data(response_rating);
CREATE INDEX IF NOT EXISTS idx_training_data_endpoint_rating ON public.training_data(endpoint_rating); 