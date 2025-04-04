import os
import json
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def get_active_algorithm():
    """Retrieve the active training data algorithm from Supabase."""
    try:
        result = supabase.table("training_data_algorithm").select("*").eq("is_active", True).execute()
        if result.data:
            return result.data[0]
        else:
            print("No active training data algorithm found")
            return None
    except Exception as e:
        print(f"Error retrieving algorithm: {str(e)}")
        return None

def execute_algorithm(algorithm_data):
    """Execute the training data algorithm and generate training data."""
    try:
        # Extract the algorithm code
        algorithm_code = algorithm_data.get("algorithm", "")
        if not algorithm_code:
            print("No algorithm code found")
            return None

        # Create a namespace for the algorithm execution
        namespace = {}
        
        # Execute the algorithm code
        exec(algorithm_code, namespace)
        
        # Call the generate_training_data function
        if "generate_training_data" in namespace:
            training_data = namespace["generate_training_data"]()
            return training_data
        else:
            print("generate_training_data function not found in algorithm")
            return None
    except Exception as e:
        print(f"Error executing algorithm: {str(e)}")
        return None

def insert_training_data(data):
    """Insert the generated training data into Supabase."""
    try:
        if not data:
            print("No training data to insert")
            return False

        # Add metadata to each entry
        for entry in data:
            entry["metadata"] = {
                "generation_date": datetime.now().isoformat(),
                "algorithm_version": "1.0",
                "source": "algorithm_generated"
            }
            entry["is_active"] = True
            entry["created_at"] = datetime.now().isoformat()
            entry["updated_at"] = datetime.now().isoformat()

        # Insert the data
        result = supabase.table("training_data").insert(data).execute()
        print(f"Successfully inserted {len(data)} training examples")
        return True
    except Exception as e:
        print(f"Error inserting training data: {str(e)}")
        return False

if __name__ == "__main__":
    # Get the active algorithm
    algorithm_data = get_active_algorithm()
    if not algorithm_data:
        print("Failed to get active algorithm")
        exit(1)

    # Execute the algorithm to generate training data
    training_data = execute_algorithm(algorithm_data)
    if not training_data:
        print("Failed to generate training data")
        exit(1)

    # Insert the generated data
    success = insert_training_data(training_data)
    if success:
        print("Training data generation and insertion completed successfully!")
    else:
        print("Failed to insert training data") 