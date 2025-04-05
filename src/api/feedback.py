from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, validator, root_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
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

class DetailedFeedbackRequest(BaseModel):
    message_id: UUID
    rating: Optional[int] = None  # 1-5 overall rating
    feedback: Optional[str] = None  # Overall feedback
    query_rating: Optional[int] = None  # 1-5 query rating
    query_feedback: Optional[str] = None  # Query feedback
    response_rating: Optional[int] = None  # 1-5 response rating
    response_feedback: Optional[str] = None  # Response feedback
    endpoint_rating: Optional[int] = None  # 1-5 endpoint rating
    endpoint_feedback: Optional[str] = None  # Endpoint feedback

    @validator('feedback', 'query_feedback', 'response_feedback', 'endpoint_feedback')
    def validate_feedback_length(cls, v):
        if v is not None and len(v) > 1000:
            raise ValueError('Feedback text must be 1000 characters or less')
        return v

    @root_validator
    def validate_at_least_one_field(cls, values):
        # Check if at least one rating or feedback field is provided
        fields = ['rating', 'feedback', 'query_rating', 'query_feedback',
                 'response_rating', 'response_feedback', 'endpoint_rating', 'endpoint_feedback']
        if not any(values.get(field) is not None for field in fields):
            raise ValueError('At least one rating or feedback field must be provided')

@router.post("/feedback")
async def submit_feedback(feedback: DetailedFeedbackRequest, current_user: User = Depends(get_current_user)):
    try:
        # Validate rating ranges
        for rating in [feedback.rating, feedback.query_rating, feedback.response_rating, feedback.endpoint_rating]:
            if rating is not None and (rating < 1 or rating > 5):
                raise HTTPException(status_code=400, detail="All ratings must be between 1 and 5")
            
        # Update the user_data entry
        update_data = {
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Only include fields that were provided
        if feedback.rating is not None:
            update_data['rating'] = feedback.rating
        if feedback.feedback is not None:
            update_data['feedback'] = feedback.feedback
        if feedback.query_rating is not None:
            update_data['query_rating'] = feedback.query_rating
        if feedback.query_feedback is not None:
            update_data['query_feedback'] = feedback.query_feedback
        if feedback.response_rating is not None:
            update_data['response_rating'] = feedback.response_rating
        if feedback.response_feedback is not None:
            update_data['response_feedback'] = feedback.response_feedback
        if feedback.endpoint_rating is not None:
            update_data['endpoint_rating'] = feedback.endpoint_rating
        if feedback.endpoint_feedback is not None:
            update_data['endpoint_feedback'] = feedback.endpoint_feedback
            
        result = supabase.table('user_data')\
            .update(update_data)\
            .eq('id', str(feedback.message_id))\
            .eq('user_id', str(current_user.id))\
            .execute()
            
        if not result.data:
            raise HTTPException(status_code=404, detail="Message not found or unauthorized")
            
        return {"status": "success", "message": "Feedback recorded"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/feedback/stats")
async def get_feedback_stats(current_user: User = Depends(get_current_user)):
    try:
        result = supabase.rpc('get_user_feedback_stats', {
            'p_user_id': str(current_user.id)
        }).execute()
        
        if not result.data:
            return {
                "total_interactions": 0,
                "ratings": {
                    "overall": {
                        "avg": 0,
                        "distribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
                    },
                    "query": {
                        "avg": 0,
                        "distribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
                    },
                    "response": {
                        "avg": 0,
                        "distribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
                    },
                    "endpoint": {
                        "avg": 0,
                        "distribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
                    }
                },
                "feedback_over_time": []
            }
            
        return result.data[0]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
