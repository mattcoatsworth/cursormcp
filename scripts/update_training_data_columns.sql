-- Create the execute_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql;
END;
$$;

-- First, check if the columns exist
DO $$
BEGIN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'training_data' 
                  AND column_name = 'query_rating') THEN
        ALTER TABLE public.training_data
        ADD COLUMN query_rating INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'training_data' 
                  AND column_name = 'query_feedback') THEN
        ALTER TABLE public.training_data
        ADD COLUMN query_feedback TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'training_data' 
                  AND column_name = 'response_rating') THEN
        ALTER TABLE public.training_data
        ADD COLUMN response_rating INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'training_data' 
                  AND column_name = 'response_feedback') THEN
        ALTER TABLE public.training_data
        ADD COLUMN response_feedback TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'training_data' 
                  AND column_name = 'endpoint_rating') THEN
        ALTER TABLE public.training_data
        ADD COLUMN endpoint_rating INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'training_data' 
                  AND column_name = 'endpoint_feedback') THEN
        ALTER TABLE public.training_data
        ADD COLUMN endpoint_feedback TEXT;
    END IF;
END $$;

-- Add comments to the new columns
COMMENT ON COLUMN public.training_data.query_rating IS 'Rating (1-10) for the query quality';
COMMENT ON COLUMN public.training_data.query_feedback IS 'Feedback about the query';
COMMENT ON COLUMN public.training_data.response_rating IS 'Rating (1-10) for the response quality';
COMMENT ON COLUMN public.training_data.response_feedback IS 'Feedback about the response';
COMMENT ON COLUMN public.training_data.endpoint_rating IS 'Rating (1-10) for the endpoint quality';
COMMENT ON COLUMN public.training_data.endpoint_feedback IS 'Feedback about the endpoint';

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                  WHERE tablename = 'training_data' 
                  AND indexname = 'idx_training_data_query_rating') THEN
        CREATE INDEX idx_training_data_query_rating ON public.training_data(query_rating);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                  WHERE tablename = 'training_data' 
                  AND indexname = 'idx_training_data_response_rating') THEN
        CREATE INDEX idx_training_data_response_rating ON public.training_data(response_rating);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                  WHERE tablename = 'training_data' 
                  AND indexname = 'idx_training_data_endpoint_rating') THEN
        CREATE INDEX idx_training_data_endpoint_rating ON public.training_data(endpoint_rating);
    END IF;
END $$;

-- Update existing data to migrate old ratings to new columns
UPDATE public.training_data
SET 
    query_rating = rating,
    query_feedback = feedback,
    response_rating = rating,
    response_feedback = feedback,
    endpoint_rating = rating,
    endpoint_feedback = feedback
WHERE 
    rating IS NOT NULL 
    AND feedback IS NOT NULL
    AND query_rating IS NULL
    AND response_rating IS NULL
    AND endpoint_rating IS NULL; 