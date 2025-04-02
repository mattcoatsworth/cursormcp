#!/usr/bin/env python3
"""
Generate enhanced training data using comprehensive endpoint definitions.
This script creates training examples that accurately reflect the available API endpoints
and their capabilities across all integrated services.
"""

import os
import json
import time
import random
import argparse
from datetime import datetime
import openai
import asyncio
from tqdm import tqdm
import logging
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import endpoint definitions
from api_endpoints import (
    SHOPIFY_ENDPOINTS,
    KLAVIYO_ENDPOINTS,
    TRIPLE_WHALE_ENDPOINTS,
    NORTHBEAM_ENDPOINTS,
    GORGIAS_ENDPOINTS,
    POSTSCRIPT_ENDPOINTS,
    GOOGLE_CALENDAR_ENDPOINTS,
    ASANA_ENDPOINTS,
    SLACK_ENDPOINTS,
    NOTION_ENDPOINTS
)

# Model configuration
OPENAI_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo"  # Using Meta's Llama 3.3 70B Instruct Turbo via Together AI
MAX_TOKENS = 2048
TEMPERATURE = 0.7
TOP_P = 0.95
FREQUENCY_PENALTY = 0.0
PRESENCE_PENALTY = 0.0

# Add quality comparison flag
QUALITY_COMPARISON_RATIO = 0.05  # 5% of examples will use GPT for quality comparison

# Configuration
BATCH_SIZE = 5
OUTPUT_DIR = "enhanced_training_data"

# Add Together AI API configuration
# Replace the text between the quotes with your actual API key from Together AI
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY") or "74419c1e494c4265e1e519411ecaed493f1dd0cd1fed16e2c8d00035870f5b51"

if not TOGETHER_API_KEY or TOGETHER_API_KEY == "PASTE_YOUR_API_KEY_HERE":
    raise ValueError("Please replace 'PASTE_YOUR_API_KEY_HERE' with your actual Together AI API key")

# Define complex scenarios that require multiple services
COMPLEX_SCENARIOS = [
    {
        "name": "Customer Support Workflow",
        "description": "Handle customer support tickets and update customer information across systems",
        "systems": ["Gorgias", "Shopify", "Klaviyo"],
        "workflow": [
            "Check customer ticket in Gorgias",
            "Look up customer details in Shopify",
            "Update customer tags in Klaviyo",
            "Respond to ticket with relevant information"
        ],
        "requires_approval": True
    },
    {
        "name": "Marketing Campaign Launch",
        "description": "Launch a new marketing campaign across multiple channels",
        "systems": ["Shopify", "Klaviyo", "Postscript", "Slack"],
        "workflow": [
            "Create product collection in Shopify",
            "Set up email campaign in Klaviyo",
            "Configure SMS campaign in Postscript",
            "Notify team via Slack"
        ],
        "requires_approval": True
    },
    {
        "name": "Project Management Integration",
        "description": "Create and manage projects across different platforms",
        "systems": ["Asana", "Notion", "Slack", "Google Calendar"],
        "workflow": [
            "Create project in Asana",
            "Set up documentation in Notion",
            "Create project channel in Slack",
            "Schedule kickoff meeting in Google Calendar"
        ],
        "requires_approval": True
    }
]

# Define simple scenarios that don't require approval
SIMPLE_SCENARIOS = [
    {
        "name": "Sales Report",
        "description": "Get sales data from Shopify",
        "systems": ["Shopify"],
        "workflow": [
            "Fetch sales data from Shopify API"
        ],
        "requires_approval": False
    },
    {
        "name": "Customer List",
        "description": "Get list of customers from Klaviyo",
        "systems": ["Klaviyo"],
        "workflow": [
            "Fetch customer list from Klaviyo API"
        ],
        "requires_approval": False
    },
    {
        "name": "Ticket Status",
        "description": "Check ticket status in Gorgias",
        "systems": ["Gorgias"],
        "workflow": [
            "Fetch ticket status from Gorgias API"
        ],
        "requires_approval": False
    }
]

# Response generation guidelines
RESPONSE_GUIDELINES = """
1. Always provide clear, concise, and user-friendly responses
2. Never include technical terms or jargon
3. Never voluntarily direct users to external documentation or websites
4. Only provide external references when explicitly asked by the user
5. Always include step-by-step guidance
6. Always provide practical examples
7. Use simple, everyday language
8. Focus on actionable steps
9. Never mention APIs, endpoints, or technical implementation details
10. Never proactively suggest visiting external resources
11. Keep responses focused on the user's specific question
12. Provide complete solutions without external references by default
13. Use a conversational, helpful tone
14. Break down complex tasks into simple steps
15. Include relevant examples and use cases
16. Ensure all information is self-contained within the response unless specifically asked for external references
"""

def standardize_metadata(metadata: Dict, model: str) -> Dict:
    """Standardize metadata for training data insertion"""
    standardized = {
        "source": metadata.get("source", "enhanced_training_generator"),
        "generated_at": metadata.get("generated_at", datetime.now().isoformat()),
        "model": model,
        "is_multi_service": metadata.get("is_multi_service", False),
        "services_required": metadata.get("services_required", []),
        "scenario": metadata.get("scenario", ""),
        "description": metadata.get("description", ""),
        "complexity": metadata.get("complexity", "medium"),
        "response_parameters": {
            "is_user_friendly": metadata.get("is_user_friendly", True),
            "has_step_by_step_guidance": metadata.get("has_step_by_step_guidance", True),
            "has_practical_examples": metadata.get("has_practical_examples", True),
            "uses_simple_language": metadata.get("uses_simple_language", True),
            "has_actionable_steps": metadata.get("has_actionable_steps", True),
            "is_self_contained": metadata.get("is_self_contained", True),
            "has_external_references": metadata.get("has_external_references", False),
            "has_technical_terms": metadata.get("has_technical_terms", False),
            "response_length": metadata.get("response_length", 0),
            "has_error_handling": metadata.get("has_error_handling", True),
            "quality_score": metadata.get("quality_score", 0.0),
            "validation_status": metadata.get("validation_status", "valid")
        }
    }
    return standardized

class EnhancedTrainingDataGenerator:
    def __init__(self):
        self.openai_client = openai.AsyncOpenAI(
            api_key=TOGETHER_API_KEY,
            base_url="https://api.together.xyz/v1"
        )
        self.session = None
        
    async def initialize(self):
        """Initialize async session"""
        logger.info("Creating aiohttp session...")
        self.session = aiohttp.ClientSession()
        logger.info("Initialization complete!")
        
    async def close(self):
        """Clean up resources"""
        if self.session:
            await self.session.close()
            
    async def _generate_example(self, scenario: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a single training example"""
        try:
            # Determine if this should be a quality comparison example
            is_quality_comparison = random.random() < QUALITY_COMPARISON_RATIO
            
            # Use GPT-4 for quality comparison examples
            model = "gpt-4" if is_quality_comparison else OPENAI_MODEL
            
            # Create prompt with scenario details
            prompt = self._create_prompt(scenario)
            
            # Generate response using appropriate model
            response = await self._generate_response(prompt, model)
            
            # Parse response
            try:
                parsed = json.loads(response)
            except json.JSONDecodeError:
                print(f"Failed to parse response as JSON: {response}")
                return None
            
            # Validate response
            if not self._validate_response(parsed):
                return None
            
            # Create example with metadata
            example = {
                "tool": "Enhanced",
                "intent": scenario.get("intent", "complex_query"),
                "query": parsed["query"],
                "response": parsed["response"],
                "metadata": {
                    "source": "enhanced_training_generator",
                    "generated_at": datetime.now().isoformat(),
                    "model": model,  # Track which model generated this example
                    "is_multi_service": scenario.get("is_multi_service", False),
                    "services_required": scenario.get("services_required", []),
                    "scenario": scenario.get("name", ""),
                    "description": scenario.get("description", ""),
                    "complexity": scenario.get("complexity", "high"),
                    "is_quality_comparison": is_quality_comparison  # Track if this is a quality comparison example
                }
            }
            
            return example
            
        except Exception as e:
            print(f"Error generating example: {str(e)}")
            return None

    async def generate_batch(self, scenarios: List[Dict[str, Any]], batch_size: int = BATCH_SIZE):
        """Generate a batch of examples in parallel"""
        tasks = []
        for _ in range(batch_size):
            # Randomly choose between simple and complex scenarios with 50/50 ratio
            if random.random() < 0.5:  # 50% simple tasks, 50% complex tasks
                scenario = random.choice(SIMPLE_SCENARIOS)
            else:
                scenario = random.choice(COMPLEX_SCENARIOS)
            tasks.append(self._generate_example(scenario))
            
        results = await asyncio.gather(*tasks)
        return [r for r in results if r is not None]
        
    async def save_batch(self, batch: List[Dict[str, Any]], batch_id: str):
        """Save batch to file"""
        filename = f"{OUTPUT_DIR}/batch_{batch_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        # Standardize metadata for each example
        standardized_batch = [
            {
                **example,
                "metadata": standardize_metadata(
                    example.get('metadata', {}),
                    OPENAI_MODEL  # Use the model defined at the top of the file
                )
            }
            for example in batch
        ]
        
        with open(filename, 'w') as f:
            json.dump(standardized_batch, f, indent=2)
            
    def _create_prompt(self, scenario: Dict[str, Any]) -> str:
        """Create prompt for OpenAI"""
        # Get relevant endpoints for each system in the scenario
        system_endpoints = {}
        for system in scenario['systems']:
            if system == 'Shopify':
                system_endpoints[system] = SHOPIFY_ENDPOINTS
            elif system == 'Klaviyo':
                system_endpoints[system] = KLAVIYO_ENDPOINTS
            elif system == 'Triple Whale':
                system_endpoints[system] = TRIPLE_WHALE_ENDPOINTS
            elif system == 'Northbeam':
                system_endpoints[system] = NORTHBEAM_ENDPOINTS
            elif system == 'Gorgias':
                system_endpoints[system] = GORGIAS_ENDPOINTS
            elif system == 'Postscript':
                system_endpoints[system] = POSTSCRIPT_ENDPOINTS
            elif system == 'Google Calendar':
                system_endpoints[system] = GOOGLE_CALENDAR_ENDPOINTS
            elif system == 'Asana':
                system_endpoints[system] = ASANA_ENDPOINTS
            elif system == 'Slack':
                system_endpoints[system] = SLACK_ENDPOINTS
            elif system == 'Notion':
                system_endpoints[system] = NOTION_ENDPOINTS
                
        # Create endpoint documentation for the prompt
        endpoint_docs = []
        for system, endpoints in system_endpoints.items():
            endpoint_docs.append(f"Available {system} Endpoints:")
            for resource, operations in endpoints.items():
                for op_name, op_details in operations.items():
                    endpoint_docs.append(f"* {resource}.{op_name}: {op_details['method']} {op_details['path']}")
                    if 'parameters' in op_details:
                        endpoint_docs.append("  Parameters: " + ", ".join(op_details['parameters'].keys()))
                    if 'auth' in op_details:
                        endpoint_docs.append(f"  Auth: {op_details['auth']['type']} - {op_details['auth']['key']}")
                    
        endpoint_documentation = "\n".join(endpoint_docs)
        
        if scenario['requires_approval']:
            return f"""Generate a complete example following this EXACT format:

Founder's Command:
[Write a high-level business objective that a founder would give, e.g., "Create and send an email campaign to customers who purchased our premium product line"]

System Analysis and Approval Request:
1. Understanding of Request:
   - Primary Goal: [Clear statement of what needs to be accomplished]
   - Key Requirements: [List of specific requirements or constraints]
   - Expected Outcome: [What success looks like]

2. Proposed Approach:
   - Systems to be Used: {', '.join(scenario['systems'])}
   - High-Level Steps:
   {chr(10).join('  ' + str(i+1) + '. ' + step for i, step in enumerate(scenario['workflow']))}
   - Potential Impact: [Brief description of what will change in each system]

3. Available Endpoints:
{endpoint_documentation}

4. Authentication Requirements:
   - [List required API keys, tokens, or credentials for each system]
   - [Specify any OAuth flows or authentication methods]
   - [Include any required headers or authentication parameters]

5. Data Flow Overview:
   - [Brief description of how data will flow between systems]
   - [Key data transformations or mappings]
   - [Important validation or error handling]

Would you like me to proceed with this approach? Please confirm if this understanding and plan aligns with your requirements, or let me know if any adjustments are needed.

[If approved, the system will proceed with the detailed execution plan below]

Detailed Execution Plan:
1. Endpoint Identification:
   - Required Systems: {', '.join(scenario['systems'])}
   - Available Endpoints:
{endpoint_documentation}

2. Authentication Requirements:
   - [List required API keys, tokens, or credentials for each system]
   - [Specify any OAuth flows or authentication methods]
   - [Include any required headers or authentication parameters]

3. Data Flow:
   - [Detail how data flows between systems]
   - [Specify data transformations or mappings]
   - [Include any data validation or error handling]

4. Execution Steps:
   {chr(10).join('  ' + str(i+1) + '. ' + step for i, step in enumerate(scenario['workflow']))}

5. Response Format:
   [Write a detailed response that would appear in the chat box, explaining:
   - What was requested
   - How it was executed (including specific API endpoints used)
   - The data transformations performed
   - The final outcome or results]

Scenario Details:
- Name: {scenario['name']}
- Description: {scenario['description']}

IMPORTANT: Follow the format exactly as shown above. Your response MUST use the actual endpoints listed in the documentation above. Do not make up or invent new endpoints. Generate a complete example now:"""
        else:
            return f"""Generate a complete example following this EXACT format:

Founder's Command:
[Write a high-level business objective that a founder would give, e.g., "What were our sales last month?"]

System Execution Details:
1. Objective Understanding:
   - Primary Goal: [Clear statement of what needs to be accomplished]
   - Key Requirements: [List of specific requirements or constraints]
   - Expected Outcome: [What success looks like]

2. Endpoint Identification:
   - Required System: {', '.join(scenario['systems'])}
   - Available Endpoints:
{endpoint_documentation}

3. Authentication Requirements:
   - [List required API keys, tokens, or credentials]
   - [Specify any OAuth flows or authentication methods]
   - [Include any required headers or authentication parameters]

4. Execution Steps:
   {chr(10).join('  ' + str(i+1) + '. ' + step for i, step in enumerate(scenario['workflow']))}

5. Response Format:
   [Write a detailed response that would appear in the chat box, explaining:
   - What was requested
   - How it was executed (including specific API endpoints used)
   - The data transformations performed
   - The final outcome or results]

Scenario Details:
- Name: {scenario['name']}
- Description: {scenario['description']}

IMPORTANT: Follow the format exactly as shown above. Your response MUST use the actual endpoints listed in the documentation above. Do not make up or invent new endpoints. Generate a complete example now:"""
        
    def _parse_response(self, response: str, scenario: Dict[str, Any]) -> Dict[str, Any]:
        """Parse OpenAI response into structured format"""
        try:
            # Split response into sections
            sections = response.split("\n\n")
            founder_command = ""
            system_response = ""
            execution_details = {
                "endpoints": {},
                "authentication": {},
                "data_flow": {},
                "execution_steps": []
            }
            
            current_section = None
            for section in sections:
                if section.startswith("Founder's Command:"):
                    founder_command = section.replace("Founder's Command:", "").strip()
                elif section.startswith("System Analysis and Approval Request:"):
                    # Parse the analysis section
                    analysis_lines = section.split("\n")
                    for line in analysis_lines:
                        if line.startswith("- Primary Goal:"):
                            execution_details["primary_goal"] = line.replace("- Primary Goal:", "").strip()
                        elif line.startswith("- Key Requirements:"):
                            execution_details["key_requirements"] = line.replace("- Key Requirements:", "").strip()
                        elif line.startswith("- Expected Outcome:"):
                            execution_details["expected_outcome"] = line.replace("- Expected Outcome:", "").strip()
                elif section.startswith("2. Endpoint Identification:"):
                    current_section = "endpoints"
                    # Parse endpoints
                    lines = section.split("\n")
                    for line in lines:
                        if line.startswith("*"):
                            system = line.split(":")[0].replace("*", "").strip()
                            endpoint = line.split(":")[1].strip() if ":" in line else ""
                            execution_details["endpoints"][system] = endpoint
                elif section.startswith("3. Authentication Requirements:"):
                    current_section = "authentication"
                    # Parse authentication requirements
                    lines = section.split("\n")
                    for line in lines:
                        if line.startswith("-"):
                            execution_details["authentication"][line.replace("-", "").strip()] = True
                elif section.startswith("4. Data Flow:"):
                    current_section = "data_flow"
                    # Parse data flow
                    lines = section.split("\n")
                    for line in lines:
                        if line.startswith("-"):
                            execution_details["data_flow"][line.replace("-", "").strip()] = True
                elif section.startswith("4. Execution Steps:"):
                    current_section = "execution_steps"
                    # Parse execution steps
                    lines = section.split("\n")
                    for line in lines:
                        if line.strip().startswith(("1.", "2.", "3.", "4.", "5.")):
                            execution_details["execution_steps"].append(line.strip())
                elif section.startswith("5. Response Format:"):
                    system_response = section.replace("5. Response Format:", "").strip()
            
            return {
                "query": founder_command,
                "response": system_response,
                "systems": scenario['systems'],
                "workflow": scenario['workflow'],
                "execution_details": execution_details,
                "metadata": {
                    "scenario": scenario['name'],
                    "description": scenario['description'],
                    "generated_at": datetime.now().isoformat(),
                    "model": OPENAI_MODEL
                }
            }
            
        except Exception as e:
            logger.error(f"Error parsing response: {str(e)}")
            return None

    def _generate_with_model(self, tool: str, intent: str, model: str) -> Dict[str, Any]:
        """Generate an example using a specific model."""
        prompt = f"""
        Generate a training example for the following tool and intent:
        Tool: {tool}
        Intent: {intent}

        Follow these guidelines:
        {RESPONSE_GUIDELINES}

        The response should be:
        1. User-friendly and non-technical
        2. Self-contained (no external references)
        3. Include step-by-step guidance
        4. Provide practical examples
        5. Use simple, everyday language
        6. Focus on actionable steps
        7. Never mention technical implementation details
        8. Never direct users to external resources
        """
        
        # Generate the example using the specified model
        response = self.openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Generate a training example for {tool} with intent {intent}"}
            ],
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
            top_p=TOP_P,
            frequency_penalty=FREQUENCY_PENALTY,
            presence_penalty=PRESENCE_PENALTY
        )
        
        # Parse and validate the response
        example = self._parse_response(response.choices[0].message.content)
        
        # Validate the example meets our quality standards
        validator = QualityValidator()
        if not validator.validate_quality(example):
            raise ValueError("Generated example does not meet quality standards")
        
        return example

async def main():
    parser = argparse.ArgumentParser(description='Generate enhanced training data for MCP system')
    parser.add_argument('--count', type=int, default=100, help='Number of examples to generate')
    parser.add_argument('--batch-size', type=int, default=BATCH_SIZE, help='Batch size for generation')
    parser.add_argument('--temperature', type=float, default=TEMPERATURE, help='Temperature for generation')
    args = parser.parse_args()
    
    print(f"\nStarting enhanced training data generation...")
    print(f"Total examples to generate: {args.count}")
    print(f"Batch size: {args.batch_size}")
    print(f"Temperature: {args.temperature}")
    print(f"Using model: {OPENAI_MODEL}\n")
    
    # Initialize generator
    generator = EnhancedTrainingDataGenerator()
    await generator.initialize()
    
    try:
        # Calculate number of batches
        num_batches = (args.count + args.batch_size - 1) // args.batch_size
        
        # Generate batches with progress bar
        with tqdm(total=args.count, desc="Generating examples", unit="example") as pbar:
            for batch_idx in range(num_batches):
                print(f"\nGenerating batch {batch_idx + 1}/{num_batches}...")
                batch = await generator.generate_batch(COMPLEX_SCENARIOS, args.batch_size)
                batch_id = f"{batch_idx:04d}"
                
                await generator.save_batch(batch, batch_id)
                pbar.update(len(batch))
                
                print(f"Batch {batch_idx + 1} complete. Generated {len(batch)} examples.")
                print(f"Progress: {((batch_idx + 1) * args.batch_size)}/{args.count} examples")
                
                # Small delay to avoid rate limits
                await asyncio.sleep(1)
                
    finally:
        await generator.close()
        print("\nEnhanced training data generation complete!")

if __name__ == "__main__":
    asyncio.run(main()) 