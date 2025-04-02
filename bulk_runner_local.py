import os
import json
import time
import requests
import random
import uuid
from datetime import datetime
from openai import OpenAI

# Configure Together AI API
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY") or "74419c1e494c4265e1e519411ecaed493f1dd0cd1fed16e2c8d00035870f5b51"
client = OpenAI(
    api_key=TOGETHER_API_KEY,
    base_url="https://api.together.xyz/v1"
)

# Directory for local storage
LOCAL_STORAGE_DIR = "training_data_local"
os.makedirs(LOCAL_STORAGE_DIR, exist_ok=True)

# Define all tool intents combinations we want to generate data for
# Simplified version for quick demo
tool_intents = {
    "Shopify": [
        "Check Order Status", 
        "View Sales Report"
    ],
    "Slack": [
        "Send Message", 
        "Search Messages"
    ],
    "OpenAI": [
        "Generate Content",
        "Summarize Text"
    ]
}

def generate_queries(tool, intent, count):
    """
    Generate a specified number of realistic user queries with system responses
    for a given tool and intent using Together AI's DeepSeek model.
    
    Args:
        tool (str): The e-commerce tool (e.g., Shopify, Klaviyo)
        intent (str): The specific intent within that tool
        count (int): Number of query/response pairs to generate
        
    Returns:
        list: List of dictionaries containing {"query": "...", "response": "..."}
    """
    try:
        print(f"Generating {count} {tool} query/response pairs for intent: {intent}")
        
        # Craft the prompt for DeepSeek
        system_prompt = f"""
        You are an assistant helping to generate training data for an e-commerce AI platform.
        Generate {count} different, realistic user queries that someone might ask about {tool} 
        with the intent to {intent}.
        
        For each query, also include a detailed and helpful MCP system response that addresses the query.
        
        Make the queries diverse in phrasing, complexity, and specificity. Include both:
        - Direct commands (e.g., "Show me all orders from last week")
        - Natural questions (e.g., "Can you tell me how my sales are doing?")
        
        Format your response as a JSON object with an array of items, each containing:
        {{
            "items": [
                {{
                    "query": "User's question or command",
                    "response": "Detailed system response"
                }},
                ...
            ]
        }}
        """
        
        # Call DeepSeek via Together AI to generate the queries and responses
        response = client.chat.completions.create(
            model="meta-llama/Llama-3.3-70B-Instruct-Turbo",  # Using Meta's Llama 3.3 70B Instruct Turbo via Together AI
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate {count} realistic {tool} query/response pairs for intent: {intent}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # Extract the items from the response
        if "items" in result:
            items = result["items"]
        else:
            # If the model didn't use the "items" key, try to find the first array
            for key, value in result.items():
                if isinstance(value, list) and len(value) > 0:
                    items = value
                    break
            else:
                # If we couldn't find an array, use a fallback
                print(f"Warning: Unexpected response format for {tool}/{intent}. Using fallback.")
                items = [{
                    "query": f"Tell me about {tool} {intent}",
                    "response": f"Here's information about {tool} {intent}..."
                }]
        
        # Ensure all items have query and response fields
        valid_items = []
        for item in items:
            if isinstance(item, dict) and "query" in item and "response" in item:
                valid_items.append(item)
        
        # Ensure we have at least some valid items
        if not valid_items:
            print(f"Warning: Failed to generate valid items for {tool}/{intent}. Using fallback.")
            valid_items = [{
                "query": f"Help me with {tool} {intent}",
                "response": f"I'd be happy to help with {tool} {intent}. Here's what you need to know..."
            }]
        
        print(f"Successfully generated {len(valid_items)} query/response pairs for {tool}/{intent}")
        return valid_items[:count]  # Limit to requested count
        
    except Exception as e:
        print(f"Error generating queries: {e}")
        # Return a simple fallback query/response pair if there's an error
        return [{
            "query": f"Help me with {tool} {intent}",
            "response": f"I'd be happy to help with {tool} {intent}. Here's what you need to know..."
        }] * count

def save_to_local(tool, intent, items):
    success = 0
    for item in items:
        try:
            # Generate a unique ID
            item_id = f"{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:8]}"
            
            # Create record
            record = {
                "id": item_id,
                "tool": tool,
                "intent": intent,
                "query": item["query"],
                "response": item["response"],
                "metadata": {
                    "generation_date": datetime.now().isoformat(),
                    "model": "meta-llama/Llama-3.3-70B-Instruct-Turbo"
                },
                "createdAt": datetime.now().isoformat(),
                "updatedAt": datetime.now().isoformat()
            }
            
            # Save to local file
            filename = os.path.join(LOCAL_STORAGE_DIR, f"{item_id}.json")
            with open(filename, "w") as f:
                json.dump(record, f, indent=2)
            
            success += 1
            
        except Exception as e:
            print(f"⚠️ Error saving local file: {e}")
    
    return success

def save_to_json(all_data):
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    filename = f"training_data_{timestamp}.json"
    with open(filename, "w") as f:
        json.dump(all_data, f, indent=2)
    print(f"\n📝 Saved backup to {filename}")
    return filename

# Main runner
def run_bulk(count_per_intent=10, sleep_time=2):
    total_saved = 0
    all_data = []
    
    print(f"{'=' * 60}")
    print(f"🚀 Starting MCP Training Data Generator (LOCAL MODE)")
    print(f"{'=' * 60}")
    print(f"• Generating {count_per_intent} examples per intent")
    print(f"• Total intents: {sum(len(intents) for intents in tool_intents.values())}")
    print(f"• Saving to directory: {LOCAL_STORAGE_DIR}")
    print(f"{'=' * 60}\n")
    
    for tool, intents in tool_intents.items():
        print(f"\n📊 Tool: {tool}")
        print(f"{'=' * 40}")
        
        for intent in intents:
            print(f"🔄 Generating: {tool} - {intent}")
            items = generate_queries(tool, intent, count_per_intent)
            
            if items:
                for item in items:
                    all_data.append({
                        "tool": tool,
                        "intent": intent,
                        "query": item["query"],
                        "response": item["response"],
                        "metadata": {
                            "generation_date": datetime.now().isoformat(),
                            "model": "meta-llama/Llama-3.3-70B-Instruct-Turbo"
                        }
                    })
                
                saved = save_to_local(tool, intent, items)
                total_saved += saved
                print(f"✅ Saved {saved}/{len(items)} records locally")
                
                # Sample output
                if len(items) > 0:
                    print(f"📝 Sample: \"{items[0]['query']}\" → \"{items[0]['response'][:60]}...\"")
                
                time.sleep(sleep_time)
    
    filename = save_to_json(all_data)
    
    print(f"\n{'=' * 60}")
    print(f"🎉 Generation Complete!")
    print(f"{'=' * 60}")
    print(f"• Total generated: {len(all_data)} examples")
    print(f"• Total saved locally: {total_saved}")
    print(f"• Backup saved to: {filename}")
    print(f"• Data directory: {LOCAL_STORAGE_DIR}")
    print(f"{'=' * 60}")
    
    return filename

if __name__ == "__main__":
    import sys
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate MCP training data and save locally")
    parser.add_argument("count", type=int, nargs="?", default=2, help="Number of examples per intent")
    parser.add_argument("--limit", type=int, help="Limit to this number of tool/intent combinations")
    
    args = parser.parse_args()
    
    print("MCP Training Data Generator Configuration (LOCAL MODE)")
    print("----------------------------------------")
    print(f"• Examples per intent: {args.count}")
    print("----------------------------------------")
    
    # Limit the number of tool/intent combinations if requested
    if args.limit:
        total_combinations = 0
        for tool, intents in list(tool_intents.items()):
            if total_combinations >= args.limit:
                del tool_intents[tool]
                continue
                
            if total_combinations + len(intents) > args.limit:
                # Trim the intents list
                tool_intents[tool] = intents[:args.limit - total_combinations]
            
            total_combinations += len(tool_intents[tool])
    
    # Run the generator
    run_bulk(count_per_intent=args.count)