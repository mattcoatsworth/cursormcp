import os
import json
import time
from datetime import datetime
from typing import List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Get Python path from system_config
def get_python_path() -> str:
    """Get the Python path from system_config."""
    try:
        result = supabase.table("system_config").select("*").eq("key", "python_path").execute()
        if result.data:
            return result.data[0]["value"]
        else:
            # Default path if not found in config
            return "C:\\Users\\matth\\AppData\\Local\\Programs\\Python\\Python313\\python.exe"
    except Exception as e:
        print(f"Error getting Python path: {str(e)}")
        return "C:\\Users\\matth\\AppData\\Local\\Programs\\Python\\Python313\\python.exe"

def get_active_llm_algorithm():
    """Retrieve the active external LLM algorithm from Supabase."""
    try:
        result = supabase.table("external_llm_algorithm").select("*").eq("is_active", True).execute()
        if result.data:
            return result.data[0]
        else:
            print("No active external LLM algorithm found")
            return None
    except Exception as e:
        print(f"Error retrieving algorithm: {str(e)}")
        return None

def clean_response(response: str) -> str:
    """Clean the LLM response to get valid JSON."""
    # Remove markdown code block markers if present
    response = response.replace("```json", "").replace("```", "").strip()
    return response

def generate_training_data_with_llm(algorithm_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate training data using the external LLM with efficient rate limiting."""
    try:
        # Extract algorithm parameters
        llm_provider = algorithm_data.get("llm_provider", "openai")
        llm_model = algorithm_data.get("llm_model", "gpt-4o-mini")
        prompt_template = algorithm_data.get("prompt_template", "")
        parameters = algorithm_data.get("parameters", {})
        rate_limit = parameters.get("rate_limit", {})
        
        # Rate limiting parameters
        requests_per_minute = rate_limit.get("requests_per_minute", 400)
        batch_size = rate_limit.get("batch_size", 7)
        batch_delay = rate_limit.get("batch_delay_seconds", 2)
        total_count = parameters.get("count", 14)

        # Get system training data for context (limit to most recent 3 examples)
        system_training = supabase.table("system_training").select("*").eq("is_active", True).limit(3).execute()
        system_context = "Examples of tools and intents:\n"
        if system_training.data:
            for example in system_training.data:
                system_context += f"Tool: {example.get('category', '')}\n"
                if 'guidelines' in example:
                    system_context += f"Intent: {example['guidelines'].get('intent', '')}\n"
                    system_context += f"Example Query: {example['guidelines'].get('query_example', '')}\n"
                system_context += "---\n"

        all_training_data = []
        remaining_count = total_count
        batch_number = 1

        while remaining_count > 0:
            current_batch_size = min(batch_size, remaining_count)
            
            # Prepare the prompt for this batch
            prompt = f"""
            Generate {current_batch_size} high-quality training examples for a customer service AI system.
            Use these example tools and intents as inspiration:
            {system_context}

            Each example should include:
            1. A tool (e.g., Shopify, Klaviyo, Warehouse)
            2. An intent (e.g., Check Order Status, Process Return)
            3. A realistic user query
            4. A detailed, helpful response
            5. Relevant systems involved
            6. A workflow for handling the request
            7. Execution details
            8. Follow-up queries and responses
            9. Context information

            IMPORTANT: Your response must be a valid JSON array of objects. Each object must have these exact fields:
            - tool (string)
            - intent (string)
            - query (string)
            - response (string)
            - systems (array of strings)
            - workflow (array of strings)
            - execution_details (object)
            - follow_up_queries (array of strings)
            - follow_up_responses (array of strings)
            - follow_up_context (object)

            Example format:
            [
              {{
                "tool": "Shopify",
                "intent": "Check Order Status",
                "query": "Can you check the status of my order #12345?",
                "response": "I'll help you check the status of your order...",
                "systems": ["Shopify", "Warehouse"],
                "workflow": ["Verify order number", "Check order status", "Update customer"],
                "execution_details": {{"status": "processing", "estimated_time": "2-3 days"}},
                "follow_up_queries": ["When will it be delivered?", "Can I change the shipping address?"],
                "follow_up_responses": ["It should be delivered in 2-3 days...", "Yes, I can help you update the shipping address..."],
                "follow_up_context": {{"delivery_window": "2-3 days", "address_change_allowed": true}}
              }}
            ]

            IMPORTANT: Do not include any markdown formatting or code block markers in your response. Just return the raw JSON array.
            """

            print(f"\nProcessing batch {batch_number} ({current_batch_size} examples)...")
            
            # Generate training data using the LLM
            response = client.chat.completions.create(
                model=llm_model,
                messages=[
                    {"role": "system", "content": "You are a training data generator for a customer service AI system. You must always respond with valid JSON without any markdown formatting."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )

            # Debug the response
            response_content = response.choices[0].message.content
            print("\nRaw response from LLM:")
            print(response_content)
            
            # Clean and parse the response
            try:
                cleaned_response = clean_response(response_content)
                print("\nCleaned response:")
                print(cleaned_response)
                
                batch_data = json.loads(cleaned_response)
                if not isinstance(batch_data, list):
                    print("Error: Response is not a JSON array")
                    return []
                
                # Validate each example has all required fields
                required_fields = ["tool", "intent", "query", "response", "systems", "workflow", 
                                 "execution_details", "follow_up_queries", "follow_up_responses", 
                                 "follow_up_context"]
                
                valid_examples = []
                for example in batch_data:
                    if all(field in example for field in required_fields):
                        valid_examples.append(example)
                    else:
                        print(f"Warning: Skipping example missing required fields: {example}")
                
                all_training_data.extend(valid_examples)
                remaining_count -= len(valid_examples)
                batch_number += 1
                
                if remaining_count > 0:
                    print(f"Batch completed. Waiting {batch_delay} seconds before next batch...")
                    time.sleep(batch_delay)
            except json.JSONDecodeError as e:
                print(f"Error parsing LLM response as JSON: {str(e)}")
                print("Response that failed to parse:")
                print(cleaned_response)
                return []

        return all_training_data

    except Exception as e:
        print(f"Error generating training data with LLM: {str(e)}")
        return []

def insert_training_data(data: List[Dict[str, Any]]):
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
                "source": "llm_generated"
            }
            entry["is_active"] = True
            entry["created_at"] = datetime.now().isoformat()
            entry["updated_at"] = datetime.now().isoformat()
            entry["source_type"] = "external_llm"

        # Insert the data
        result = supabase.table("training_data").insert(data).execute()
        print(f"Successfully inserted {len(data)} training examples")
        return True
    except Exception as e:
        print(f"Error inserting training data: {str(e)}")
        return False

if __name__ == "__main__":
    # Get the active LLM algorithm
    algorithm_data = get_active_llm_algorithm()
    if not algorithm_data:
        print("Failed to get active LLM algorithm")
        exit(1)

    # Generate training data using the LLM
    training_data = generate_training_data_with_llm(algorithm_data)
    if not training_data:
        print("Failed to generate training data")
        exit(1)

    # Insert the generated data
    success = insert_training_data(training_data)
    if success:
        print("Training data generation and insertion completed successfully!")
    else:
        print("Failed to insert training data") 