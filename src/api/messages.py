from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime
import os
from openai import OpenAI
from supabase import create_client, Client
from dotenv import load_dotenv
from .auth import get_current_user, User

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv('SUPABASE_URL', ''),
    os.getenv('SUPABASE_KEY', '')
)

# Initialize Together AI client
together_client = OpenAI(
    api_key=os.getenv('TOGETHER_AI_KEY'),
    base_url="https://api.together.xyz/v1"
)

router = APIRouter()

class MessageRequest(BaseModel):
    role: str
    content: str
    metadata: Dict[str, Any] = {}

class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    metadata: Dict[str, Any]
    created_at: str

@router.post("/messages", response_model=MessageResponse)
async def create_message(message: MessageRequest, current_user: User = Depends(get_current_user)):
    try:
        # 1. Generate AI response using Together AI
        try:
            response = together_client.chat.completions.create(
                model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": message.content}
                ],
                max_tokens=1000
            )
            ai_response = response.choices[0].message.content
        except Exception as e:
            print(f"Error generating AI response: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to generate AI response")

        # 2. Store in user_data table with training_data compatible schema
        user_message = {
            "user_id": str(current_user.id),
            "tool": "chat",  # Default tool for general chat
            "intent": "general_chat",  # Default intent
            "query": message.content,
            "response": ai_response,
            "systems": ["together_ai"],
            "workflow": ["receive_query", "generate_response"],
            "execution_details": [
                {
                    "step": "generate_response",
                    "tool": "together_ai",
                    "status": "success",
                    "timestamp": datetime.utcnow().isoformat()
                }
            ],
            "metadata": message.metadata,
            "follow_up_queries": [],
            "follow_up_responses": [],
            "follow_up_context": {},
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table('user_data').insert(user_message).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to store message")
        
        stored_message = result.data[0]
        
        # 3. Return formatted response
        return MessageResponse(
            id=stored_message['id'],
            role="assistant",
            content=ai_response,
            metadata={
                "status": "completed",
                "execution_details": stored_message['execution_details'],
                "systems": stored_message['systems'],
                "workflow": stored_message['workflow']
            },
            created_at=stored_message['created_at']
        )
        
    except Exception as e:
        print(f"Error processing message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/messages")
async def get_messages(current_user: User = Depends(get_current_user)):
    try:
        result = supabase.table('user_data')\
            .select('*')\
            .eq('user_id', str(current_user.id))\
            .order('created_at')\
            .execute()
        
        # Convert to chat format
        messages = []
        for record in result.data:
            # Add user message
            messages.append({
                "id": f"{record['id']}_user",
                "role": "user",
                "content": record['query'],
                "metadata": {
                    **record['metadata'],
                    "workflow": record['workflow'],
                    "systems": record['systems']
                },
                "created_at": record['created_at']
            })
            # Add assistant message
            messages.append({
                "id": f"{record['id']}_assistant",
                "role": "assistant",
                "content": record['response'],
                "metadata": {
                    "status": "completed",
                    "execution_details": record['execution_details'],
                    "feedback_score": record.get('feedback_score'),
                    "feedback_notes": record.get('feedback_notes'),
                    "systems": record['systems'],
                    "workflow": record['workflow'],
                    "follow_up_queries": record['follow_up_queries'],
                    "follow_up_responses": record['follow_up_responses']
                },
                "created_at": record['created_at']
            })
        
        return messages
    except Exception as e:
        print(f"Error fetching messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
