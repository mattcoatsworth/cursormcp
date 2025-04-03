-- Create user_data table to store user interactions and queries
CREATE TABLE IF NOT EXISTS user_data (
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_tool ON user_data(tool);
CREATE INDEX IF NOT EXISTS idx_user_data_intent ON user_data(intent);
CREATE INDEX IF NOT EXISTS idx_user_data_created_at ON user_data(created_at);

-- Create user_endpoints table to store user-specific API endpoints
CREATE TABLE IF NOT EXISTS user_endpoints (
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_endpoints_user_id ON user_endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_user_endpoints_service ON user_endpoints(service);

-- Create user_guidelines table to store user-specific guidelines
CREATE TABLE IF NOT EXISTS user_guidelines (
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_guidelines_user_id ON user_guidelines(user_id);
CREATE INDEX IF NOT EXISTS idx_user_guidelines_category ON user_guidelines(category);

-- Create user_training_data table to store user-specific training data
CREATE TABLE IF NOT EXISTS user_training_data (
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_training_data_user_id ON user_training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_training_data_tool ON user_training_data(tool);
CREATE INDEX IF NOT EXISTS idx_user_training_data_intent ON user_training_data(intent);

-- Create user_effectiveness_analysis table to store analysis of user data
CREATE TABLE IF NOT EXISTS user_effectiveness_analysis (
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_effectiveness_analysis_user_id ON user_effectiveness_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_user_effectiveness_analysis_category ON user_effectiveness_analysis(category);

-- Create user_validation_reports table to store validation reports for user data
CREATE TABLE IF NOT EXISTS user_validation_reports (
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_validation_reports_user_id ON user_validation_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_validation_reports_category ON user_validation_reports(category);

-- Create a view to combine user data with system guidelines
CREATE OR REPLACE VIEW user_data_with_guidelines AS
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
    user_data ud
LEFT JOIN 
    system_training sg ON sg.category = 'general' AND sg.is_active = TRUE;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_user_data_updated_at
BEFORE UPDATE ON user_data
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_endpoints_updated_at
BEFORE UPDATE ON user_endpoints
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_guidelines_updated_at
BEFORE UPDATE ON user_guidelines
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_training_data_updated_at
BEFORE UPDATE ON user_training_data
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a function to migrate data from user_data to user_training_data
CREATE OR REPLACE FUNCTION migrate_user_data_to_training(
    p_user_id UUID,
    p_tool TEXT,
    p_intent TEXT
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO user_training_data (
        user_id,
        tool,
        intent,
        query,
        response,
        execution_details,
        applied_guidelines,
        metadata
    )
    SELECT 
        user_id,
        tool,
        intent,
        query,
        response,
        execution_details,
        applied_guidelines,
        metadata
    FROM 
        user_data
    WHERE 
        user_id = p_user_id
        AND tool = p_tool
        AND intent = p_intent
        AND feedback_score >= 4
        AND is_archived = FALSE
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to analyze user data effectiveness
CREATE OR REPLACE FUNCTION analyze_user_data_effectiveness(
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
    v_analysis JSONB;
BEGIN
    -- Perform analysis (simplified for this example)
    SELECT 
        jsonb_build_object(
            'guideline_usage', jsonb_object_agg(
                g.id, COUNT(*)
            ),
            'effectiveness_by_category', jsonb_object_agg(
                g.category, AVG(ud.feedback_score)
            ),
            'most_effective_guidelines', (
                SELECT jsonb_agg(jsonb_build_object(
                    'id', g2.id,
                    'name', g2.name,
                    'category', g2.category,
                    'effectiveness_score', AVG(ud2.feedback_score)
                ))
                FROM user_data ud2
                JOIN jsonb_array_elements(ud2.applied_guidelines->'general_guidelines') AS ag ON true
                JOIN system_training g2 ON g2.id = (ag->>'id')::UUID
                WHERE ud2.user_id = p_user_id
                GROUP BY g2.id, g2.name, g2.category
                ORDER BY AVG(ud2.feedback_score) DESC
                LIMIT 5
            )
        )
    INTO v_analysis
    FROM 
        user_data ud
    JOIN jsonb_array_elements(ud.applied_guidelines->'general_guidelines') AS ag ON true
    JOIN system_training g ON g.id = (ag->>'id')::UUID
    WHERE 
        ud.user_id = p_user_id
        AND ud.feedback_score IS NOT NULL
    GROUP BY 
        g.id;
    
    -- Insert analysis results
    INSERT INTO user_effectiveness_analysis (
        user_id,
        category,
        name,
        description,
        guidelines,
        tags,
        source
    )
    VALUES (
        p_user_id,
        'analysis',
        'User Data Effectiveness Analysis',
        'Analysis of which guidelines lead to the most effective responses for this user',
        v_analysis,
        ARRAY['analysis', 'effectiveness', 'guidelines'],
        ARRAY['user_data', 'system_training']
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to validate user data
CREATE OR REPLACE FUNCTION validate_user_data(
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
    v_validation JSONB;
    v_valid_count INTEGER;
    v_invalid_count INTEGER;
    v_fixed_count INTEGER;
BEGIN
    -- Perform validation (simplified for this example)
    SELECT 
        COUNT(*) FILTER (WHERE 
            jsonb_typeof(execution_details) = 'array' AND
            jsonb_typeof(applied_guidelines) = 'object' AND
            applied_guidelines ? 'general_guidelines' AND
            applied_guidelines ? 'domain_guidelines' AND
            applied_guidelines ? 'system_guidelines'
        )
    INTO v_valid_count
    FROM 
        user_data
    WHERE 
        user_id = p_user_id;
    
    SELECT 
        COUNT(*) - v_valid_count
    INTO v_invalid_count
    FROM 
        user_data
    WHERE 
        user_id = p_user_id;
    
    -- Build validation results
    SELECT 
        jsonb_build_object(
            'valid_entries', v_valid_count,
            'invalid_entries', v_invalid_count,
            'fixed_entries', v_fixed_count,
            'total_entries', v_valid_count + v_invalid_count,
            'issues_by_type', jsonb_build_object(
                'Missing required category in applied_guidelines', 
                (
                    SELECT COUNT(*) 
                    FROM user_data 
                    WHERE user_id = p_user_id 
                    AND (
                        NOT applied_guidelines ? 'general_guidelines' OR
                        NOT applied_guidelines ? 'domain_guidelines' OR
                        NOT applied_guidelines ? 'system_guidelines'
                    )
                )
            )
        )
    INTO v_validation;
    
    -- Insert validation results
    INSERT INTO user_validation_reports (
        user_id,
        category,
        name,
        description,
        guidelines,
        tags,
        source
    )
    VALUES (
        p_user_id,
        'validation',
        'User Data Validation Report - ' || NOW(),
        'Validation report for user data',
        v_validation,
        ARRAY['validation', 'user_data'],
        ARRAY['user_data', 'system_training']
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql; 