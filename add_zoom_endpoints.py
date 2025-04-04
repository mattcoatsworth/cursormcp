import os
from dotenv import load_dotenv
from supabase import create_client, Client

def get_supabase_client() -> Client:
    """Get or create a Supabase client instance."""
    load_dotenv()
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Supabase credentials are not configured.")
    
    return create_client(supabase_url, supabase_key)

def add_zoom_endpoints() -> None:
    """Add Zoom endpoints to the api_endpoints table."""
    try:
        print("\n=== Adding Zoom Endpoints ===\n")
        
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Define the Zoom endpoints
        endpoints = [
            # Meetings
            {
                'service': 'Zoom',
                'resource': 'meetings',
                'action': 'list_meetings',
                'method': 'GET',
                'path': '/zoom/meetings',
                'parameters': {
                    'type': 'string',
                    'page_size': 'integer',
                    'next_page_token': 'string',
                    'from': 'string',
                    'to': 'string'
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            },
            {
                'service': 'Zoom',
                'resource': 'meetings',
                'action': 'create_meeting',
                'method': 'POST',
                'path': '/zoom/meetings',
                'parameters': {
                    'topic': {
                        'type': 'string',
                        'required': True,
                        'description': 'Meeting topic'
                    },
                    'type': {
                        'type': 'integer',
                        'required': True,
                        'description': 'Meeting type (1=instant, 2=scheduled, 3=recurring, 8=fixed recurring)'
                    },
                    'start_time': {
                        'type': 'string',
                        'required': False,
                        'description': 'Meeting start time'
                    },
                    'duration': {
                        'type': 'integer',
                        'required': False,
                        'description': 'Meeting duration in minutes'
                    }
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            },
            {
                'service': 'Zoom',
                'resource': 'meetings',
                'action': 'get_meeting',
                'method': 'GET',
                'path': '/zoom/meetings/{meetingId}',
                'parameters': {
                    'meetingId': {
                        'type': 'string',
                        'required': True,
                        'description': 'The meeting ID'
                    }
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            },
            {
                'service': 'Zoom',
                'resource': 'meetings',
                'action': 'update_meeting',
                'method': 'PATCH',
                'path': '/zoom/meetings/{meetingId}',
                'parameters': {
                    'meetingId': {
                        'type': 'string',
                        'required': True,
                        'description': 'The meeting ID'
                    },
                    'topic': {
                        'type': 'string',
                        'required': False,
                        'description': 'Meeting topic'
                    },
                    'start_time': {
                        'type': 'string',
                        'required': False,
                        'description': 'Meeting start time'
                    },
                    'duration': {
                        'type': 'integer',
                        'required': False,
                        'description': 'Meeting duration in minutes'
                    }
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            },
            {
                'service': 'Zoom',
                'resource': 'meetings',
                'action': 'delete_meeting',
                'method': 'DELETE',
                'path': '/zoom/meetings/{meetingId}',
                'parameters': {
                    'meetingId': {
                        'type': 'string',
                        'required': True,
                        'description': 'The meeting ID'
                    }
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            },
            
            # Users
            {
                'service': 'Zoom',
                'resource': 'users',
                'action': 'list_users',
                'method': 'GET',
                'path': '/zoom/users',
                'parameters': {
                    'status': 'string',
                    'page_size': 'integer',
                    'next_page_token': 'string',
                    'role_id': 'string'
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            },
            {
                'service': 'Zoom',
                'resource': 'users',
                'action': 'create_user',
                'method': 'POST',
                'path': '/zoom/users',
                'parameters': {
                    'action': {
                        'type': 'string',
                        'required': True,
                        'description': 'Action to take (create, autoCreate, custCreate, ssoCreate)'
                    },
                    'user_info': {
                        'type': 'object',
                        'required': True,
                        'description': 'User information'
                    }
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            },
            {
                'service': 'Zoom',
                'resource': 'users',
                'action': 'get_user',
                'method': 'GET',
                'path': '/zoom/users/{userId}',
                'parameters': {
                    'userId': {
                        'type': 'string',
                        'required': True,
                        'description': 'The user ID'
                    }
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            },
            {
                'service': 'Zoom',
                'resource': 'users',
                'action': 'update_user',
                'method': 'PATCH',
                'path': '/zoom/users/{userId}',
                'parameters': {
                    'userId': {
                        'type': 'string',
                        'required': True,
                        'description': 'The user ID'
                    },
                    'first_name': {
                        'type': 'string',
                        'required': False,
                        'description': 'User\'s first name'
                    },
                    'last_name': {
                        'type': 'string',
                        'required': False,
                        'description': 'User\'s last name'
                    },
                    'type': {
                        'type': 'integer',
                        'required': False,
                        'description': 'User type (1=basic, 2=licensed, 3=on-prem)'
                    }
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            },
            {
                'service': 'Zoom',
                'resource': 'users',
                'action': 'delete_user',
                'method': 'DELETE',
                'path': '/zoom/users/{userId}',
                'parameters': {
                    'userId': {
                        'type': 'string',
                        'required': True,
                        'description': 'The user ID'
                    },
                    'action': {
                        'type': 'string',
                        'required': True,
                        'description': 'Action to take (delete, disassociate)'
                    }
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            },
            
            # Webinars
            {
                'service': 'Zoom',
                'resource': 'webinars',
                'action': 'list_webinars',
                'method': 'GET',
                'path': '/zoom/webinars',
                'parameters': {
                    'page_size': 'integer',
                    'next_page_token': 'string',
                    'from': 'string',
                    'to': 'string'
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            },
            {
                'service': 'Zoom',
                'resource': 'webinars',
                'action': 'create_webinar',
                'method': 'POST',
                'path': '/zoom/webinars',
                'parameters': {
                    'topic': {
                        'type': 'string',
                        'required': True,
                        'description': 'Webinar topic'
                    },
                    'type': {
                        'type': 'integer',
                        'required': True,
                        'description': 'Webinar type (5=webinar, 6=recurring webinar)'
                    },
                    'start_time': {
                        'type': 'string',
                        'required': False,
                        'description': 'Webinar start time'
                    },
                    'duration': {
                        'type': 'integer',
                        'required': False,
                        'description': 'Webinar duration in minutes'
                    }
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            },
            {
                'service': 'Zoom',
                'resource': 'webinars',
                'action': 'get_webinar',
                'method': 'GET',
                'path': '/zoom/webinars/{webinarId}',
                'parameters': {
                    'webinarId': {
                        'type': 'string',
                        'required': True,
                        'description': 'The webinar ID'
                    }
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            },
            {
                'service': 'Zoom',
                'resource': 'webinars',
                'action': 'update_webinar',
                'method': 'PATCH',
                'path': '/zoom/webinars/{webinarId}',
                'parameters': {
                    'webinarId': {
                        'type': 'string',
                        'required': True,
                        'description': 'The webinar ID'
                    },
                    'topic': {
                        'type': 'string',
                        'required': False,
                        'description': 'Webinar topic'
                    },
                    'start_time': {
                        'type': 'string',
                        'required': False,
                        'description': 'Webinar start time'
                    },
                    'duration': {
                        'type': 'integer',
                        'required': False,
                        'description': 'Webinar duration in minutes'
                    }
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            },
            {
                'service': 'Zoom',
                'resource': 'webinars',
                'action': 'delete_webinar',
                'method': 'DELETE',
                'path': '/zoom/webinars/{webinarId}',
                'parameters': {
                    'webinarId': {
                        'type': 'string',
                        'required': True,
                        'description': 'The webinar ID'
                    }
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            },
            
            # Recordings
            {
                'service': 'Zoom',
                'resource': 'recordings',
                'action': 'list_recordings',
                'method': 'GET',
                'path': '/zoom/recordings',
                'parameters': {
                    'from': 'string',
                    'to': 'string',
                    'page_size': 'integer',
                    'next_page_token': 'string'
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            },
            {
                'service': 'Zoom',
                'resource': 'recordings',
                'action': 'get_recording',
                'method': 'GET',
                'path': '/zoom/recordings/{meetingId}',
                'parameters': {
                    'meetingId': {
                        'type': 'string',
                        'required': True,
                        'description': 'The meeting ID'
                    }
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            },
            {
                'service': 'Zoom',
                'resource': 'recordings',
                'action': 'delete_recording',
                'method': 'DELETE',
                'path': '/zoom/recordings/{meetingId}',
                'parameters': {
                    'meetingId': {
                        'type': 'string',
                        'required': True,
                        'description': 'The meeting ID'
                    },
                    'action': {
                        'type': 'string',
                        'required': True,
                        'description': 'Action to take (trash, delete)'
                    }
                },
                'auth_type': 'Bearer',
                'auth_key': 'Authorization',
                'rate_limit': '30 requests per second'
            }
        ]
        
        # Insert each endpoint
        for endpoint in endpoints:
            try:
                result = supabase.table('api_endpoints').insert(endpoint).execute()
                if hasattr(result, 'error') and result.error:
                    print(f"❌ Error inserting endpoint {endpoint['action']}: {result.error}")
                else:
                    print(f"✅ Successfully added endpoint: {endpoint['action']}")
            except Exception as e:
                print(f"❌ Error inserting endpoint {endpoint['action']}: {e}")
                continue
        
        print("\n=== All Zoom Endpoints Added ===\n")
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        print("\n=== Endpoint Addition Failed ===\n")

if __name__ == "__main__":
    add_zoom_endpoints() 