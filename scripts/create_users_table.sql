-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check if user_data table exists, if not create it
CREATE TABLE IF NOT EXISTS public.user_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    tool TEXT,
    intent TEXT,
    query TEXT,
    response TEXT,
    execution_details JSONB DEFAULT '[]',
    applied_guidelines JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    feedback_score INTEGER,
    feedback_notes TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    systems JSONB DEFAULT '[]',
    workflow JSONB DEFAULT '[]',
    follow_up_queries JSONB DEFAULT '[]',
    follow_up_responses JSONB DEFAULT '[]',
    follow_up_context JSONB DEFAULT '{}'
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON public.user_data (user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_tool ON public.user_data (tool);
CREATE INDEX IF NOT EXISTS idx_user_data_intent ON public.user_data (intent);
CREATE INDEX IF NOT EXISTS idx_user_data_created_at ON public.user_data (created_at);

-- Create a default user for anonymous sessions
INSERT INTO public.users (id, name, email)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Anonymous User', 'anonymous@example.com'),
  ('00000000-0000-0000-0000-000000000001', 'System User', 'system@example.com'),
  ('00000000-0000-0000-0000-000000000002', 'Default User', 'default@example.com')
ON CONFLICT (id) DO NOTHING;

-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.combined_training_view;

-- Create views to join training_data and user_data for analytics
CREATE OR REPLACE VIEW public.combined_training_view AS
SELECT 
    id,
    'training' as source,
    tool,
    intent,
    query,
    response,
    execution_details,
    applied_guidelines,
    metadata,
    systems,
    workflow,
    created_at,
    updated_at,
    feedback_score,
    feedback_notes,
    is_archived
FROM public.training_data
UNION ALL
SELECT 
    id,
    'user' as source,
    tool,
    intent,
    query,
    response,
    execution_details,
    applied_guidelines,
    metadata,
    systems,
    workflow,
    created_at,
    updated_at,
    feedback_score,
    feedback_notes,
    is_archived
FROM public.user_data; 