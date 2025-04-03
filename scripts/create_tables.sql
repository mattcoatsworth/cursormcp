-- Enable the uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_data table
CREATE TABLE IF NOT EXISTS public.user_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    tool TEXT NOT NULL,
    intent TEXT NOT NULL,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    execution_details JSONB NOT NULL DEFAULT '[]'::jsonb,
    applied_guidelines JSONB NOT NULL DEFAULT '{"general_guidelines": [], "domain_guidelines": [], "system_guidelines": []}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    feedback_score INTEGER,
    feedback_notes TEXT,
    is_archived BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON public.user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_tool ON public.user_data(tool);
CREATE INDEX IF NOT EXISTS idx_user_data_intent ON public.user_data(intent);
CREATE INDEX IF NOT EXISTS idx_user_data_created_at ON public.user_data(created_at);

-- Create user_endpoints table
CREATE TABLE IF NOT EXISTS public.user_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    service TEXT NOT NULL,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    parameters JSONB DEFAULT '{}'::jsonb,
    auth_type TEXT NOT NULL,
    auth_key TEXT,
    rate_limit INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, service, resource, action)
);

CREATE INDEX IF NOT EXISTS idx_user_endpoints_user_id ON public.user_endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_user_endpoints_service ON public.user_endpoints(service);

-- Create user_guidelines table
CREATE TABLE IF NOT EXISTS public.user_guidelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    guidelines JSONB NOT NULL,
    tags TEXT[] DEFAULT '{}',
    source TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category, name)
);

CREATE INDEX IF NOT EXISTS idx_user_guidelines_user_id ON public.user_guidelines(user_id);
CREATE INDEX IF NOT EXISTS idx_user_guidelines_category ON public.user_guidelines(category);

-- Create user_training_data table
CREATE TABLE IF NOT EXISTS public.user_training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    tool TEXT NOT NULL,
    intent TEXT NOT NULL,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    execution_details JSONB NOT NULL DEFAULT '[]'::jsonb,
    applied_guidelines JSONB NOT NULL DEFAULT '{"general_guidelines": [], "domain_guidelines": [], "system_guidelines": []}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_user_training_data_user_id ON public.user_training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_training_data_tool ON public.user_training_data(tool);
CREATE INDEX IF NOT EXISTS idx_user_training_data_intent ON public.user_training_data(intent);

-- Create user_effectiveness_analysis table
CREATE TABLE IF NOT EXISTS public.user_effectiveness_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    guidelines JSONB NOT NULL,
    tags TEXT[] DEFAULT '{}',
    source TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_effectiveness_analysis_user_id ON public.user_effectiveness_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_user_effectiveness_analysis_category ON public.user_effectiveness_analysis(category);

-- Create user_validation_reports table
CREATE TABLE IF NOT EXISTS public.user_validation_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    guidelines JSONB NOT NULL,
    tags TEXT[] DEFAULT '{}',
    source TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_validation_reports_user_id ON public.user_validation_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_validation_reports_category ON public.user_validation_reports(category);

-- Create user_data_with_guidelines view
CREATE OR REPLACE VIEW public.user_data_with_guidelines AS
SELECT 
    ud.id,
    ud.user_id,
    ud.tool,
    ud.intent,
    ud.query,
    ud.response,
    ud.execution_details,
    ud.applied_guidelines,
    ud.metadata,
    ud.created_at,
    ud.updated_at,
    ud.feedback_score,
    ud.feedback_notes,
    ud.is_archived,
    sg.guidelines AS system_guidelines
FROM 
    public.user_data ud
LEFT JOIN 
    public.system_training sg ON sg.category = 'general' AND sg.is_active = TRUE; 