"""
Supabase client wrapper for database operations.
Provides a clean interface for interacting with the Supabase database.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
from supabase import create_client, Client

from config.settings import SUPABASE_URL, SUPABASE_KEY, TRAINING_DATA_TABLE

class SupabaseClient:
    def __init__(self):
        """Initialize Supabase client"""
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self._table = TRAINING_DATA_TABLE

    def insert_training_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Insert a single training data record.
        
        Args:
            data: Dictionary containing training data fields
                Required fields:
                - tool: str
                - intent: str
                - query: str
                - response: str
                - systems: List[str]
                - workflow: List[str]
                - execution_details: Dict
                - metadata: Dict
        
        Returns:
            Dict containing the inserted record
        """
        # Ensure required fields
        required_fields = ['tool', 'intent', 'query', 'response', 'systems', 
                         'workflow', 'execution_details', 'metadata']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")

        # Add timestamp if not present
        if 'metadata' not in data:
            data['metadata'] = {}
        if 'generated_at' not in data['metadata']:
            data['metadata']['generated_at'] = datetime.now().isoformat()

        result = self.client.table(self._table).insert(data).execute()
        return result.data[0] if result.data else {}

    def insert_many_training_data(self, data_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Insert multiple training data records.
        
        Args:
            data_list: List of dictionaries containing training data
        
        Returns:
            List of inserted records
        """
        if not data_list:
            return []

        result = self.client.table(self._table).insert(data_list).execute()
        return result.data if result.data else []

    def get_training_data(self, 
                         tool: Optional[str] = None,
                         intent: Optional[str] = None,
                         limit: int = 1000) -> List[Dict[str, Any]]:
        """
        Retrieve training data with optional filters.
        
        Args:
            tool: Filter by tool name
            intent: Filter by intent
            limit: Maximum number of records to return
        
        Returns:
            List of training data records
        """
        query = self.client.table(self._table).select('*')
        
        if tool:
            query = query.eq('tool', tool)
        if intent:
            query = query.eq('intent', intent)
            
        result = query.limit(limit).execute()
        return result.data if result.data else []

    def count_training_data(self) -> int:
        """Get total count of training data records"""
        result = self.client.table(self._table).select('*', count='exact').execute()
        return result.count if hasattr(result, 'count') else 0

    def delete_training_data(self, id: str) -> bool:
        """
        Delete a training data record by ID.
        
        Args:
            id: ID of the record to delete
        
        Returns:
            True if deletion was successful
        """
        result = self.client.table(self._table).delete().eq('id', id).execute()
        return bool(result.data)
