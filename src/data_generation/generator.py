"""
Training data generator using Together AI's API.
Generates and stores training data in Supabase.
"""
import json
import time
from typing import List, Dict, Any
from datetime import datetime
from openai import OpenAI

from config.settings import (
    TOGETHER_API_KEY,
    DEFAULT_MODEL,
    DEFAULT_SLEEP_TIME,
    TOOL_INTENTS
)
from src.db.supabase_client import SupabaseClient

class TrainingDataGenerator:
    def __init__(self):
        """Initialize the generator with OpenAI and Supabase clients"""
        self.openai_client = OpenAI(
            api_key=TOGETHER_API_KEY,
            base_url="https://api.together.xyz/v1"
        )
        self.db = SupabaseClient()

    def generate_queries(self, tool: str, intent: str, count: int) -> List[Dict[str, Any]]:
        """
        Generate training data for a specific tool and intent.
        
        Args:
            tool: The tool name (e.g., Shopify, Slack)
            intent: The specific intent
            count: Number of examples to generate
        
        Returns:
            List of generated training data items
        """
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
        
        try:
            response = self.openai_client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Generate {count} realistic {tool} query/response pairs for intent: {intent}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Extract and format items
            items = []
            if "items" in result:
                raw_items = result["items"]
            else:
                # Fallback: find first array in response
                for key, value in result.items():
                    if isinstance(value, list) and len(value) > 0:
                        raw_items = value
                        break
                else:
                    raw_items = []
            
            # Format items for database insertion
            for item in raw_items:
                if "query" in item and "response" in item:
                    training_item = {
                        "tool": tool,
                        "intent": intent,
                        "query": item["query"],
                        "response": item["response"],
                        "systems": [tool],
                        "workflow": [intent],
                        "execution_details": {
                            "steps": ["Generate response"],
                            "status": "completed"
                        },
                        "metadata": {
                            "source": "together_ai",
                            "model": DEFAULT_MODEL,
                            "generated_at": datetime.now().isoformat()
                        }
                    }
                    items.append(training_item)
            
            return items
            
        except Exception as e:
            print(f"Error generating queries for {tool}/{intent}: {str(e)}")
            return []

    def run_bulk_generation(self, count_per_intent: int = 10, sleep_time: int = DEFAULT_SLEEP_TIME) -> Dict[str, Any]:
        """
        Generate training data for all tool/intent combinations and store in Supabase.
        
        Args:
            count_per_intent: Number of examples to generate per intent
            sleep_time: Seconds to wait between API calls
        
        Returns:
            Dict containing generation statistics
        """
        stats = {
            "total_generated": 0,
            "total_saved": 0,
            "errors": [],
            "tool_stats": {}
        }
        
        for tool, intents in TOOL_INTENTS.items():
            stats["tool_stats"][tool] = {
                "generated": 0,
                "saved": 0
            }
            
            for intent in intents:
                print(f"Generating {count_per_intent} examples for {tool}/{intent}")
                
                items = self.generate_queries(tool, intent, count_per_intent)
                if items:
                    try:
                        # Store in Supabase
                        saved_items = self.db.insert_many_training_data(items)
                        
                        stats["total_generated"] += len(items)
                        stats["total_saved"] += len(saved_items)
                        stats["tool_stats"][tool]["generated"] += len(items)
                        stats["tool_stats"][tool]["saved"] += len(saved_items)
                        
                        print(f"✅ Saved {len(saved_items)}/{len(items)} items")
                        
                    except Exception as e:
                        error_msg = f"Error saving {tool}/{intent} data: {str(e)}"
                        print(f"⚠️ {error_msg}")
                        stats["errors"].append(error_msg)
                
                time.sleep(sleep_time)
        
        return stats
