-- Enable the uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_algorithm table
CREATE TABLE IF NOT EXISTS public.user_algorithm (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    version TEXT NOT NULL,
    algorithm TEXT NOT NULL,
    parameters JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_data_algorithm table
CREATE TABLE IF NOT EXISTS public.training_data_algorithm (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    version TEXT NOT NULL,
    algorithm TEXT NOT NULL,
    parameters JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create old_training_data_algorithms table
CREATE TABLE IF NOT EXISTS public.old_training_data_algorithms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    version TEXT NOT NULL,
    algorithm TEXT NOT NULL,
    parameters JSONB DEFAULT '{}'::jsonb,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_reason TEXT
);

-- Add rating and feedback columns to training_data table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'training_data' AND column_name = 'rating') THEN
        ALTER TABLE public.training_data ADD COLUMN rating INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'training_data' AND column_name = 'feedback') THEN
        ALTER TABLE public.training_data ADD COLUMN feedback TEXT;
    END IF;
END $$;

-- Create system_training table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_training (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    guidelines JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 