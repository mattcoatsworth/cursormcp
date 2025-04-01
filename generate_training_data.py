#!/usr/bin/env python3
"""
Optimized training data generator for MCP system using Supabase
"""

import os
import json
import time
import random
import argparse
from datetime import datetime
import openai
from supabase import create_client, Client
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
from typing import List, Dict, Any
import asyncio
import aiohttp
from tqdm import tqdm

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("training_generation.log"),
        logging.StreamHandler()
    ]
)

# Configuration
BATCH_SIZE = 50
MAX_WORKERS = 10
OPENAI_MODEL = "gpt-4-turbo-preview"
TEMP_DIR = "temp"
OUTPUT_DIR = "training_data_local"

# Get Supabase credentials from environment variables
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")

class TrainingDataGenerator:
    def __init__(self):
        self.openai_client = openai.AsyncOpenAI()
        self.session = None
        self.supabase: Client = None
        self.progress_bars = {}
        
    async def initialize(self):
        """Initialize async session and Supabase client"""
        self.session = aiohttp.ClientSession()
        self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
    async def close(self):
        """Clean up resources"""
        if self.session:
            await self.session.close()
            
    async def generate_example(self, scenario: Dict[str, Any], temperature: float = 0.8) -> Dict[str, Any]:
        """Generate a single training example using async OpenAI API"""
        prompt = self._create_prompt(scenario)
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a training data generator for a multi-service integration platform."},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature
            )
            
            result = response.choices[0].message.content
            return self._parse_response(result, scenario)
            
        except Exception as e:
            logging.error(f"Error generating example: {str(e)}")
            return None
            
    async def generate_batch(self, scenarios: List[Dict[str, Any]], batch_size: int = BATCH_SIZE):
        """Generate a batch of examples in parallel"""
        tasks = []
        for _ in range(batch_size):
            scenario = random.choice(scenarios)
            tasks.append(self.generate_example(scenario))
            
        results = await asyncio.gather(*tasks)
        return [r for r in results if r is not None]
        
    async def save_batch(self, batch: List[Dict[str, Any]], batch_id: str):
        """Save batch to both file and Supabase"""
        # Save to file
        filename = f"{OUTPUT_DIR}/batch_{batch_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        with open(filename, 'w') as f:
            json.dump(batch, f, indent=2)
            
        # Save to Supabase
        await self._save_to_supabase(batch)
        
    async def _save_to_supabase(self, batch: List[Dict[str, Any]]):
        """Save batch to Supabase"""
        try:
            # Prepare data for bulk insert
            values = [
                {
                    "query": example['query'],
                    "response": example['response'],
                    "systems": example['systems'],
                    "workflow": example['workflow'],
                    "metadata": example['metadata']
                }
                for example in batch
            ]
            
            # Bulk insert using Supabase
            result = self.supabase.table('training_data').upsert(
                values,
                on_conflict='query'
            ).execute()
            
            if result.error:
                raise Exception(f"Supabase error: {result.error}")
                
        except Exception as e:
            logging.error(f"Error saving to Supabase: {str(e)}")
            raise
            
    def _create_prompt(self, scenario: Dict[str, Any]) -> str:
        """Create prompt for OpenAI"""
        return f"""
        Generate a natural language query and its corresponding system response for the following scenario:
        
        Scenario: {scenario['name']}
        Systems: {', '.join(scenario['systems'])}
        Description: {scenario['description']}
        Workflow: {', '.join(scenario['workflow'])}
        
        Generate a realistic user query that would trigger this workflow and the expected system response.
        The response should include the sequence of API calls and their expected results.
        """
        
    def _parse_response(self, response: str, scenario: Dict[str, Any]) -> Dict[str, Any]:
        """Parse OpenAI response into structured format"""
        try:
            # Split response into query and system response
            parts = response.split("\n\nSystem Response:")
            query = parts[0].strip()
            system_response = parts[1].strip() if len(parts) > 1 else ""
            
            return {
                "query": query,
                "response": system_response,
                "systems": scenario['systems'],
                "workflow": scenario['workflow'],
                "metadata": {
                    "scenario": scenario['name'],
                    "generated_at": datetime.now().isoformat(),
                    "model": OPENAI_MODEL
                }
            }
        except Exception as e:
            logging.error(f"Error parsing response: {str(e)}")
            return None

async def main():
    parser = argparse.ArgumentParser(description='Generate training data for MCP system')
    parser.add_argument('--count', type=int, default=10000, help='Number of examples to generate')
    parser.add_argument('--batch-size', type=int, default=BATCH_SIZE, help='Batch size for generation')
    args = parser.parse_args()
    
    # Initialize generator
    generator = TrainingDataGenerator()
    await generator.initialize()
    
    try:
        # Load scenarios
        with open('generate_complex_cross_system_data.py', 'r') as f:
            content = f.read()
            # Extract COMPLEX_SCENARIOS from the file
            scenarios = eval(content.split('COMPLEX_SCENARIOS = ')[1].split('\n\n')[0])
        
        # Calculate number of batches
        num_batches = (args.count + args.batch_size - 1) // args.batch_size
        
        # Generate batches with progress bar
        with tqdm(total=args.count, desc="Generating training data") as pbar:
            for batch_idx in range(num_batches):
                batch = await generator.generate_batch(scenarios, args.batch_size)
                batch_id = f"{batch_idx:04d}"
                
                await generator.save_batch(batch, batch_id)
                pbar.update(len(batch))
                
                # Small delay to avoid rate limits
                await asyncio.sleep(1)
                
    finally:
        await generator.close()

if __name__ == "__main__":
    asyncio.run(main()) 