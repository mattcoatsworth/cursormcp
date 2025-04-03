#!/usr/bin/env python3
"""
Script to create user data tables in Supabase.
This script will:
1. Connect to Supabase with service role key
2. Create the tables directly using SQL
3. Verify that the tables were created successfully
"""

import os
import logging
import argparse
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def connect_to_supabase() -> Client:
    """Connect to Supabase with service role key"""
    load_dotenv()
    
    supabase_url = os.getenv("https://jmpxvzuxbyfjrttxwtnn.supabase.co")
    service_role_key = os.getenv("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptcHh2enV4YnlmanJ0dHh3dG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzI5MDQ2NCwiZXhwIjoyMDU4ODY2NDY0fQ.796c1dass2GiHo6rwn0BeAYJQ71iyaJjrHObWYUV4rQ")
    
    if not supabase_url or not service_role_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
    
    # Create the client with the service role key
    return create_client(
        supabase_url=supabase_url,
        supabase_key=service_role_key
    )

def execute_sql(supabase: Client, sql: str) -> bool:
    """Execute SQL using Supabase Management API"""
    try:
        # Get the project ID from the URL
        project_id = os.getenv("jmpxvzuxbyfjrttxwtnn")
        if not project_id:
            raise ValueError("SUPABASE_PROJECT_ID must be set in .env file")
        
        # Get the management API key
        management_key = os.getenv("sbp_aec9141ee427b300938adeab7fa12b4ccdc26aec")
        if not management_key:
            raise ValueError("SUPABASE_MANAGEMENT_KEY must be set in .env file")
        
        # Set up the request
        url = f"https://api.supabase.com/v1/projects/{project_id}/sql"
        headers = {
            "Authorization": f"Bearer {management_key}",
            "Content-Type": "application/json"
        }
        data = {"query": sql}
        
        # Make the request
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        return True
    except Exception as e:
        logger.error(f"Error executing SQL: {e}")
        return False

def create_tables(supabase: Client) -> bool:
    """Create all tables"""
    logger.info("Creating tables")
    
    sql = """
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
    """
    
    return execute_sql(supabase, sql)

def verify_tables(supabase: Client) -> bool:
    """Verify that the tables were created successfully"""
    logger.info("Verifying tables")
    
    # Get the project ID and management key
    project_id = os.getenv("SUPABASE_PROJECT_ID")
    management_key = os.getenv("SUPABASE_MANAGEMENT_KEY")
    
    if not project_id or not management_key:
        raise ValueError("SUPABASE_PROJECT_ID and SUPABASE_MANAGEMENT_KEY must be set in .env file")
    
    tables_to_check = [
        "user_data",
        "user_endpoints",
        "user_guidelines",
        "user_training_data",
        "user_effectiveness_analysis",
        "user_validation_reports"
    ]
    
    headers = {
        "Authorization": f"Bearer {management_key}",
        "Content-Type": "application/json"
    }
    
    for table in tables_to_check:
        try:
            logger.info(f"Checking table {table}...")
            # Try to select from the table using the Management API
            url = f"https://api.supabase.com/v1/projects/{project_id}/sql"
            data = {"query": f"SELECT COUNT(*) FROM public.{table}"}
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            logger.info(f"✓ Table {table} exists and is accessible")
            
            # Try to get the table structure
            data = {"query": f"SELECT * FROM public.{table} LIMIT 1"}
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            logger.info(f"  - Table structure verified")
            
        except Exception as e:
            logger.error(f"✗ Error verifying table {table}: {e}")
            return False
    
    # Verify the view
    try:
        logger.info("Checking user_data_with_guidelines view...")
        url = f"https://api.supabase.com/v1/projects/{project_id}/sql"
        data = {"query": "SELECT COUNT(*) FROM public.user_data_with_guidelines"}
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        logger.info("✓ View user_data_with_guidelines exists and is accessible")
    except Exception as e:
        logger.error(f"✗ Error verifying view: {e}")
        return False
    
    logger.info("All tables and view verified successfully")
    return True

def main():
    """Main function to create tables"""
    parser = argparse.ArgumentParser(description="Create user data tables in Supabase")
    parser.add_argument("--verify-only", action="store_true", help="Only verify tables without creating them")
    args = parser.parse_args()
    
    try:
        logger.info("Starting table creation process")
        
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        if not args.verify_only:
            # Create tables
            if not create_tables(supabase):
                logger.error("Failed to create tables")
                return
        
        # Verify tables
        if not verify_tables(supabase):
            logger.error("Failed to verify tables")
            return
        
        logger.info("Table creation process completed successfully")
        
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        raise

if __name__ == "__main__":
    main() 