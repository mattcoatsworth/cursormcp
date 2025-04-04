"""
Configuration settings for the CursorMCP application.
All environment variables and configuration settings should be defined here.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
SRC_DIR = BASE_DIR / 'src'
DATA_DIR = BASE_DIR / 'data'
LOCAL_STORAGE_DIR = BASE_DIR / 'training_data_local'

# Create necessary directories
DATA_DIR.mkdir(exist_ok=True)
LOCAL_STORAGE_DIR.mkdir(exist_ok=True)

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")

# Together AI Configuration
TOGETHER_API_KEY = os.getenv('TOGETHER_API_KEY')
if not TOGETHER_API_KEY:
    raise ValueError("TOGETHER_API_KEY environment variable is not set")

# Model Configuration
DEFAULT_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo"

# Rate Limiting
DEFAULT_SLEEP_TIME = 2  # seconds between API calls
DEFAULT_EXAMPLES_PER_INTENT = 10

# Database Tables
TRAINING_DATA_TABLE = 'training_data'

# Tool Intents Configuration
TOOL_INTENTS = {
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
