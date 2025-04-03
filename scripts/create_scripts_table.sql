-- Create scripts table
CREATE TABLE IF NOT EXISTS public.scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    script_content TEXT NOT NULL,
    parameters JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, category)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_scripts_category ON public.scripts(category);
CREATE INDEX IF NOT EXISTS idx_scripts_name ON public.scripts(name); 