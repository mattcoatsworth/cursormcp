from dotenv import load_dotenv
import os
from supabase import create_client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# Query the training_data_algorithm table
result = supabase.table('training_data_algorithm').select('*').execute()

# Print the results
print("Current algorithms in the database:")
for algo in result.data:
    print(f"\nName: {algo['name']}")
    print(f"Version: {algo['version']}")
    print(f"Is Active: {algo['is_active']}")
    print("-" * 50) 