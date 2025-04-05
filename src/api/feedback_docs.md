# Feedback API Documentation

## Submit Feedback
`POST /feedback`

Submit detailed feedback for a message interaction.

### Request Body
```json
{
    "message_id": "uuid",
    "rating": 1-5,              // Optional: Overall interaction rating
    "feedback": "string",       // Optional: Overall feedback text
    "query_rating": 1-5,        // Optional: Query quality rating
    "query_feedback": "string", // Optional: Query feedback text
    "response_rating": 1-5,     // Optional: Response quality rating
    "response_feedback": "string", // Optional: Response feedback text
    "endpoint_rating": 1-5,     // Optional: Endpoint performance rating
    "endpoint_feedback": "string"  // Optional: Endpoint feedback text
}
```

### Validation Rules
- All rating fields must be between 1 and 5 when provided
- Feedback text fields have a maximum length of 1000 characters
- At least one rating or feedback field must be provided
- `message_id` must be a valid UUID of an existing message

### Response
```json
{
    "status": "success",
    "message": "Feedback recorded"
}
```

## Get Feedback Statistics
`GET /feedback/stats`

Get detailed feedback statistics for the authenticated user.

### Response
```json
{
    "total_interactions": 100,
    "ratings": {
        "overall": {
            "avg": 4.5,
            "distribution": {
                "1": 0,
                "2": 5,
                "3": 10,
                "4": 50,
                "5": 35
            }
        },
        "query": {
            "avg": 4.3,
            "distribution": {"1": 0, "2": 7, "3": 13, "4": 45, "5": 35}
        },
        "response": {
            "avg": 4.4,
            "distribution": {"1": 1, "2": 4, "3": 15, "4": 40, "5": 40}
        },
        "endpoint": {
            "avg": 4.6,
            "distribution": {"1": 0, "2": 2, "3": 8, "4": 55, "5": 35}
        }
    },
    "feedback_over_time": [
        {
            "date": "2025-04-04T00:00:00Z",
            "ratings": {
                "overall": 4.5,
                "query": 4.3,
                "response": 4.4,
                "endpoint": 4.6
            },
            "interaction_count": 10
        }
    ]
}
```
