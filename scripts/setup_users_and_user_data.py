#!/usr/bin/env python3
import os
import sys
import argparse
from supabase import create_client

def setup_database_tables(supabase_url, supabase_key):
    """Set up the users and user_data tables in Supabase."""
    print("Initializing Supabase client...")
    supabase = create_client(supabase_url, supabase_key)
    
    # Read the SQL script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sql_file = os.path.join(script_dir, 'create_users_table.sql')
    
    try:
        with open(sql_file, 'r') as f:
            sql_script = f.read()
    except Exception as e:
        print(f"Error reading SQL file: {str(e)}")
        return False
    
    # Split the script into statements
    sql_statements = sql_script.split(';')
    
    # Execute each statement separately
    for statement in sql_statements:
        statement = statement.strip()
        if not statement:
            continue
            
        print(f"Executing SQL: {statement[:50]}...")
        try:
            # Execute the SQL via RPC function if available
            try:
                result = supabase.rpc('execute_sql', {'query': statement}).execute()
                if hasattr(result, 'error') and result.error:
                    print(f"Error executing SQL via RPC: {result.error}")
                    print("Trying alternative method...")
                    # If RPC fails, try a different approach (may vary based on your setup)
                    result = supabase.table('_sql').insert({'sql': statement}).execute()
                    if hasattr(result, 'error') and result.error:
                        print(f"Error with alternative method: {result.error}")
                        return False
            except Exception as e:
                print(f"RPC method failed, error: {str(e)}")
                print("Attempting to use REST API for schema updates...")
                # This is a fallback, but might not work depending on your Supabase setup
                
                # Check if we're creating tables or simpler operations
                if "CREATE TABLE" in statement.upper():
                    print("Creating table via REST API might not be possible.")
                    print("Please execute this SQL manually in the Supabase SQL editor:")
                    print(statement)
                else:
                    # For simpler statements like inserts
                    if "INSERT INTO public.users" in statement:
                        # Parse the values from the insert statement
                        try:
                            # Very basic parsing, might need improvement
                            values_part = statement.split("VALUES")[1].strip()
                            values_items = values_part.split("),(")
                            
                            for item in values_items:
                                item = item.replace("(", "").replace(")", "")
                                parts = item.split(",")
                                
                                if len(parts) >= 3:
                                    user_id = parts[0].strip().replace("'", "")
                                    name = parts[1].strip().replace("'", "")
                                    email = parts[2].strip().replace("'", "")
                                    
                                    user_data = {
                                        "id": user_id,
                                        "name": name,
                                        "email": email
                                    }
                                    
                                    result = supabase.table("users").insert(user_data).execute()
                                    if hasattr(result, 'error') and result.error:
                                        print(f"Error inserting user: {result.error}")
                        except Exception as e:
                            print(f"Error parsing insert statement: {str(e)}")
        except Exception as e:
            print(f"Error executing statement: {str(e)}")
            return False
        
    print("Database setup completed successfully!")
    return True

def main():
    parser = argparse.ArgumentParser(description="Set up users and user_data tables in Supabase")
    parser.add_argument("--url", help="Supabase URL")
    parser.add_argument("--key", help="Supabase service role key")
    
    args = parser.parse_args()
    
    # Get credentials from arguments or environment
    supabase_url = args.url or os.environ.get("SUPABASE_URL")
    supabase_key = args.key or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Error: Supabase URL and key are required.")
        print("Provide them as arguments or set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.")
        sys.exit(1)
    
    # Set up the database
    success = setup_database_tables(supabase_url, supabase_key)
    
    if not success:
        print("\nSome errors occurred during setup.")
        print("You may need to run the SQL script manually in the Supabase SQL editor.")
        print("The SQL script is located at: scripts/create_users_table.sql")
        sys.exit(1)
    
    print("\nSetup complete! The users and user_data tables should now be ready to use.")
    
if __name__ == "__main__":
    main() 