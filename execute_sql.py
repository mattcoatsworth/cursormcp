import os
from dotenv import load_dotenv
from supabase import create_client, Client

def get_supabase_client() -> Client:
    """Get or create a Supabase client instance."""
    load_dotenv()
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Supabase credentials are not configured. Check SUPABASE_URL and SUPABASE_KEY.")
    
    return create_client(supabase_url, supabase_key)

def execute_sql(sql_query: str) -> list:
    """Execute a SQL query in Supabase."""
    try:
        supabase = get_supabase_client()
        result = supabase.rpc('exec_sql', {'sql': sql_query}).execute()
        return result.data
    except Exception as e:
        print(f"Error executing SQL: {e}")
        return []

def main():
    """Main function to execute SQL from a file."""
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python execute_sql.py <sql_file>")
        sys.exit(1)
    
    sql_file = sys.argv[1]
    
    try:
        with open(sql_file, 'r') as f:
            sql_query = f.read()
        
        result = execute_sql(sql_query)
        print("SQL executed successfully")
        print("Result:", result)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 