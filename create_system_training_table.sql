-- Create execute_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION public.execute_sql(query text)
RETURNS SETOF json AS $$
BEGIN
    RETURN QUERY EXECUTE query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create system_training table for storing system instructions and guidelines
CREATE TABLE IF NOT EXISTS public.system_training (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,  -- e.g., 'warehouse_3pl', 'shopify', 'general'
    name TEXT NOT NULL,      -- e.g., 'Warehouse Operations Guidelines'
    description TEXT,        -- Optional description of what these guidelines cover
    guidelines JSONB NOT NULL, -- The actual guidelines/instructions
    tags TEXT[] DEFAULT '{}',
    source TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_training_category ON public.system_training (category);
CREATE INDEX IF NOT EXISTS idx_system_training_active ON public.system_training (is_active);

-- Add comments
COMMENT ON TABLE public.system_training IS 'Stores system training instructions and guidelines';
COMMENT ON COLUMN public.system_training.category IS 'Category of instructions (e.g., warehouse_3pl)';
COMMENT ON COLUMN public.system_training.name IS 'Name of the instruction set';
COMMENT ON COLUMN public.system_training.description IS 'Description of what these guidelines cover';
COMMENT ON COLUMN public.system_training.guidelines IS 'The actual guidelines/instructions in JSON format';
COMMENT ON COLUMN public.system_training.tags IS 'Tags for categorizing and searching guidelines';
COMMENT ON COLUMN public.system_training.source IS 'Source of the guidelines';
COMMENT ON COLUMN public.system_training.version IS 'Version number of the guidelines';
COMMENT ON COLUMN public.system_training.is_active IS 'Whether these guidelines are currently active';

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_system_training_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_training_timestamp
    BEFORE UPDATE ON public.system_training
    FOR EACH ROW
    EXECUTE FUNCTION update_system_training_updated_at(); 