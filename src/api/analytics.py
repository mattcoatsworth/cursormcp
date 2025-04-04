from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from .auth import get_current_user, User

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv('SUPABASE_URL', ''),
    os.getenv('SUPABASE_KEY', '')
)

router = APIRouter()

class TimeRange(BaseModel):
    start_date: datetime
    end_date: datetime
    interval: str  # 'day', 'week', 'month'

@router.get("/api/analytics/usage")
async def get_usage_analytics(
    time_range: Optional[TimeRange] = None,
    current_user: User = Depends(get_current_user)
):
    try:
        if not time_range:
            # Default to last 30 days
            time_range = TimeRange(
                start_date=datetime.utcnow() - timedelta(days=30),
                end_date=datetime.utcnow(),
                interval='day'
            )
            
        result = supabase.rpc('analyze_user_data_effectiveness', {
            'p_user_id': str(current_user.id)
        }).execute()
        
        return result.data[0] if result.data else {
            "total_interactions": 0,
            "interaction_trends": [],
            "top_intents": [],
            "system_usage": {},
            "effectiveness_metrics": {
                "avg_workflow_length": 0,
                "avg_follow_ups": 0,
                "avg_feedback_score": 0
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/analytics/compare")
async def compare_with_training(current_user: User = Depends(get_current_user)):
    """Compare user interactions with training data to identify patterns and differences"""
    try:
        result = supabase.rpc('compare_user_and_training_data', {
            'p_user_id': str(current_user.id)
        }).execute()
        
        return result.data[0] if result.data else {
            "similarity_score": 0,
            "unique_patterns": [],
            "common_patterns": [],
            "recommendations": []
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/analytics/effectiveness")
async def get_effectiveness_metrics(current_user: User = Depends(get_current_user)):
    """Get detailed effectiveness metrics for the user's interactions"""
    try:
        result = supabase.rpc('get_user_effectiveness_metrics', {
            'p_user_id': str(current_user.id)
        }).execute()
        
        return result.data[0] if result.data else {
            "workflow_efficiency": 0,
            "response_quality": 0,
            "user_satisfaction": 0,
            "areas_for_improvement": [],
            "successful_patterns": []
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
