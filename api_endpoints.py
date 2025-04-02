"""
API endpoint definitions for all integrated software systems.
Each system's endpoints are defined with their full specifications including:
- HTTP method
- Endpoint path
- Required parameters
- Authentication requirements
- Rate limits
- Response format
"""

from typing import Dict, Any

SHOPIFY_ENDPOINTS = {
    "shop": {
        "get": {
            "method": "GET",
            "path": "/admin/api/2023-10/shop.json",
            "parameters": {},
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        },
        "get_details": {
            "method": "GET",
            "path": "/admin/api/2023-10/shop/details.json",
            "parameters": {},
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        },
        "load_storefronts": {
            "method": "GET",
            "path": "/admin/api/2023-10/shop.json",
            "parameters": {},
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        }
    },
    "products": {
        "list": {
            "method": "GET",
            "path": "/admin/api/2023-10/products.json",
            "parameters": {
                "limit": "integer",
                "title": "string",
                "fields": "string",
                "created_at_min": "string",
                "created_at_max": "string",
                "updated_at_min": "string",
                "updated_at_max": "string",
                "published_at_min": "string",
                "published_at_max": "string",
                "published_status": "string",
                "collection_id": "string",
                "handle": "string",
                "product_type": "string",
                "vendor": "string",
                "status": "string",
                "after_cursor": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        },
        "get": {
            "method": "GET",
            "path": "/admin/api/2023-10/products/{product_id}.json",
            "parameters": {
                "product_id": "string",
                "fields": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        },
        "get_by_collection": {
            "method": "GET",
            "path": "/admin/api/2023-10/collections/{collection_id}/products.json",
            "parameters": {
                "collection_id": "string",
                "limit": "integer",
                "fields": "string",
                "after_cursor": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        },
        "get_by_ids": {
            "method": "GET",
            "path": "/admin/api/2023-10/products.json",
            "parameters": {
                "ids": "array",
                "fields": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        },
        "search": {
            "method": "GET",
            "path": "/admin/api/2023-10/products.json",
            "parameters": {
                "query": "string",
                "limit": "integer",
                "fields": "string",
                "after_cursor": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        }
    },
    "orders": {
        "list": {
            "method": "GET",
            "path": "/admin/api/2023-10/orders.json",
            "parameters": {
                "limit": "integer",
                "status": "string",
                "financial_status": "string",
                "fulfillment_status": "string",
                "created_at_min": "string",
                "created_at_max": "string",
                "updated_at_min": "string",
                "updated_at_max": "string",
                "processed_at_min": "string",
                "processed_at_max": "string",
                "fields": "string",
                "page_info": "string",
                "query": "string",
                "cursor": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        },
        "get": {
            "method": "GET",
            "path": "/admin/api/2023-10/orders/{order_id}.json",
            "parameters": {
                "order_id": "string",
                "fields": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        },
        "get_sales": {
            "method": "GET",
            "path": "/admin/api/2023-10/orders.json",
            "parameters": {
                "created_at_min": "string",
                "created_at_max": "string",
                "limit": "integer",
                "cursor": "string",
                "fields": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        }
    },
    "customers": {
        "list": {
            "method": "GET",
            "path": "/admin/api/2023-10/customers.json",
            "parameters": {
                "limit": "integer",
                "fields": "string",
                "page_info": "string",
                "next": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        },
        "get": {
            "method": "GET",
            "path": "/admin/api/2023-10/customers/{customer_id}.json",
            "parameters": {
                "customer_id": "string",
                "fields": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        },
        "tag": {
            "method": "PUT",
            "path": "/admin/api/2023-10/customers/{customer_id}.json",
            "parameters": {
                "customer_id": "string",
                "tags": "array"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        }
    },
    "draft_orders": {
        "create": {
            "method": "POST",
            "path": "/admin/api/2023-10/draft_orders.json",
            "parameters": {
                "line_items": "array",
                "email": "string",
                "shipping_address": "object",
                "note": "string",
                "tags": "string",
                "tax_exempt": "boolean",
                "applied_discount": "object",
                "customer": "object",
                "use_customer_default_address": "boolean"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        },
        "complete": {
            "method": "PUT",
            "path": "/admin/api/2023-10/draft_orders/{draft_order_id}/complete.json",
            "parameters": {
                "draft_order_id": "string",
                "payment_pending": "boolean"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        }
    },
    "discounts": {
        "create": {
            "method": "POST",
            "path": "/admin/api/2023-10/price_rules.json",
            "parameters": {
                "title": "string",
                "code": "string",
                "value_type": "string",
                "value": "number",
                "starts_at": "string",
                "ends_at": "string",
                "applies_once_per_customer": "boolean",
                "usage_limit": "integer",
                "customer_selection": "string",
                "target_type": "string",
                "target_selection": "string",
                "allocation_method": "string",
                "prerequisite_subtotal_range": "object",
                "prerequisite_quantity_range": "object",
                "prerequisite_shipping_price_range": "object"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        },
        "create_code": {
            "method": "POST",
            "path": "/admin/api/2023-10/discount_codes.json",
            "parameters": {
                "code": "string",
                "price_rule_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        }
    },
    "collections": {
        "list": {
            "method": "GET",
            "path": "/admin/api/2023-10/custom_collections.json",
            "parameters": {
                "limit": "integer",
                "name": "string",
                "product_id": "string",
                "handle": "string",
                "updated_at_min": "string",
                "updated_at_max": "string",
                "published_at_min": "string",
                "published_at_max": "string",
                "published_status": "string",
                "fields": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        }
    },
    "variants": {
        "list": {
            "method": "GET",
            "path": "/admin/api/2023-10/products/{product_id}/variants.json",
            "parameters": {
                "product_id": "string",
                "limit": "integer",
                "fields": "string",
                "since_id": "string",
                "presentment_currencies": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        },
        "get": {
            "method": "GET",
            "path": "/admin/api/2023-10/variants/{variant_id}.json",
            "parameters": {
                "variant_id": "string",
                "fields": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        },
        "get_by_ids": {
            "method": "GET",
            "path": "/admin/api/2023-10/variants.json",
            "parameters": {
                "ids": "array",
                "fields": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        }
    },
    "webhooks": {
        "list": {
            "method": "GET",
            "path": "/admin/api/2023-10/webhooks.json",
            "parameters": {
                "limit": "integer",
                "since_id": "string",
                "fields": "string",
                "topic": "string",
                "address": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        },
        "create": {
            "method": "POST",
            "path": "/admin/api/2023-10/webhooks.json",
            "parameters": {
                "topic": "string",
                "address": "string",
                "format": "string",
                "fields": "array",
                "metafield_namespaces": "array"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        },
        "delete": {
            "method": "DELETE",
            "path": "/admin/api/2023-10/webhooks/{webhook_id}.json",
            "parameters": {
                "webhook_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        },
        "manage": {
            "method": "POST",
            "path": "/admin/api/2023-10/webhooks.json",
            "parameters": {
                "action": "string",  # subscribe, find, unsubscribe
                "topic": "string",
                "address": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "X-Shopify-Access-Token"
            },
            "rate_limit": "2 requests per second"
        }
    }
}

TRIPLE_WHALE_ENDPOINTS = {
    "account": {
        "info": {
            "method": "GET",
            "path": "/account/info",
            "parameters": {},
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "analytics": {
        "sales": {
            "method": "GET",
            "path": "/analytics/sales",
            "parameters": {
                "from": "string",  # YYYY-MM-DD format
                "to": "string"     # YYYY-MM-DD format
            },
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "attribution": {
        "overview": {
            "method": "GET",
            "path": "/attribution/overview",
            "parameters": {},
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        },
        "source": {
            "method": "GET",
            "path": "/attribution/sources/{source}",
            "parameters": {
                "source": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "campaigns": {
        "list": {
            "method": "GET",
            "path": "/campaigns",
            "parameters": {},
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        },
        "platform": {
            "method": "GET",
            "path": "/campaigns/{platform}",
            "parameters": {
                "platform": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "cohorts": {
        "analysis": {
            "method": "GET",
            "path": "/cohorts/analysis",
            "parameters": {
                "days": "integer"  # Default: 30
            },
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "blended_stats": {
        "table": {
            "method": "POST",
            "path": "/shops/{shopId}/blended-stats-table",
            "parameters": {
                "dateRange": {
                    "start": "string",  # YYYY-MM-DD format
                    "end": "string"     # YYYY-MM-DD format
                },
                "comparisonDateRange": {
                    "start": "string",  # YYYY-MM-DD format
                    "end": "string"     # YYYY-MM-DD format
                },
                "metrics": [
                    {
                        "id": "string",
                        "name": "string"
                    }
                ],
                "dimensions": [
                    {
                        "id": "string",
                        "name": "string"
                    }
                ],
                "filters": [
                    {
                        "dimension": "string",
                        "operator": "string",
                        "value": "string|number"
                    }
                ],
                "limit": "integer",
                "offset": "integer"
            },
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "shop": {
        "info": {
            "method": "GET",
            "path": "/shops/{shopId}",
            "parameters": {
                "shopId": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        },
        "metrics": {
            "method": "GET",
            "path": "/shops/{shopId}/metrics",
            "parameters": {
                "shopId": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        },
        "dimensions": {
            "method": "GET",
            "path": "/shops/{shopId}/dimensions",
            "parameters": {
                "shopId": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        }
    }
}

# Northbeam endpoints
NORTHBEAM_ENDPOINTS = {
    "account": {
        "info": {
            "method": "GET",
            "path": "/account",
            "parameters": {},
            "auth": {
                "type": "Header",
                "key": "X-API-KEY"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "metrics": {
        "performance": {
            "method": "GET",
            "path": "/metrics/performance",
            "parameters": {
                "start_date": "string",  # YYYY-MM-DD format
                "end_date": "string"     # YYYY-MM-DD format
            },
            "auth": {
                "type": "Header",
                "key": "X-API-KEY"
            },
            "rate_limit": "60 requests per minute"
        },
        "channels": {
            "method": "GET",
            "path": "/metrics/channels",
            "parameters": {
                "start_date": "string",  # YYYY-MM-DD format
                "end_date": "string",    # YYYY-MM-DD format
                "channel": "string"      # Optional: specific channel to filter by
            },
            "auth": {
                "type": "Header",
                "key": "X-API-KEY"
            },
            "rate_limit": "60 requests per minute"
        },
        "campaigns": {
            "method": "GET",
            "path": "/metrics/campaigns",
            "parameters": {
                "start_date": "string",  # YYYY-MM-DD format
                "end_date": "string",    # YYYY-MM-DD format
                "platform": "string"     # Optional: specific platform to filter by
            },
            "auth": {
                "type": "Header",
                "key": "X-API-KEY"
            },
            "rate_limit": "60 requests per minute"
        },
        "roas": {
            "method": "GET",
            "path": "/metrics/roas",
            "parameters": {
                "start_date": "string",  # YYYY-MM-DD format
                "end_date": "string",    # YYYY-MM-DD format
                "channel": "string"      # Optional: specific channel to filter by
            },
            "auth": {
                "type": "Header",
                "key": "X-API-KEY"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "attribution": {
        "get": {
            "method": "GET",
            "path": "/attribution",
            "parameters": {
                "start_date": "string",  # YYYY-MM-DD format
                "end_date": "string",    # YYYY-MM-DD format
                "model": "string"        # Optional: attribution model (default, first_touch, last_touch, linear, position_based, time_decay)
            },
            "auth": {
                "type": "Header",
                "key": "X-API-KEY"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "query": {
        "execute": {
            "method": "POST",
            "path": "/query",
            "parameters": {
                "brand": "string",
                "start_date": "string",  # YYYY-MM-DD format
                "end_date": "string",    # YYYY-MM-DD format
                "metrics": "array",      # Array of metric names
                "dimensions": "array"    # Array of dimension names
            },
            "auth": {
                "type": "Header",
                "key": "X-API-KEY"
            },
            "rate_limit": "60 requests per minute"
        }
    }
}

# Gorgias endpoints
GORGIAS_ENDPOINTS = {
    "account": {
        "info": {
            "method": "GET",
            "path": "/account",
            "parameters": {},
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "tickets": {
        "list": {
            "method": "GET",
            "path": "/tickets",
            "parameters": {
                "limit": "integer",      # Default: 20
                "offset": "integer",     # Default: 0
                "status": "string",      # Optional: filter by status
                "order_by": "string",    # Optional: field to order by
                "order_dir": "string"    # Optional: asc or desc
            },
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/tickets/{ticket_id}",
            "parameters": {
                "ticket_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        },
        "create": {
            "method": "POST",
            "path": "/tickets",
            "parameters": {
                "subject": "string",
                "message": "string",
                "customer_email": "string",
                "priority": "string"     # Optional: normal, high, urgent
            },
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        },
        "update": {
            "method": "PUT",
            "path": "/tickets/{ticket_id}",
            "parameters": {
                "ticket_id": "string",
                "status": "string",
                "priority": "string",
                "subject": "string",
                "tags": "array"
            },
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "customers": {
        "list": {
            "method": "GET",
            "path": "/customers",
            "parameters": {
                "limit": "integer",      # Default: 20
                "offset": "integer",     # Default: 0
                "email": "string"        # Optional: filter by email
            },
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/customers/{customer_id}",
            "parameters": {
                "customer_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "analytics": {
        "satisfaction": {
            "method": "GET",
            "path": "/analytics/satisfaction",
            "parameters": {
                "start_date": "string",  # YYYY-MM-DD format
                "end_date": "string"     # YYYY-MM-DD format
            },
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        },
        "performance": {
            "metrics": {
                "method": "GET",
                "path": "/analytics/satisfaction",
                "parameters": {
                    "days": "integer"        # Optional: number of days to analyze
                },
                "auth": {
                    "type": "Bearer",
                    "key": "api_key"
                },
                "rate_limit": "60 requests per minute"
            },
            "summary": {
                "method": "GET",
                "path": "/analytics/summary",
                "parameters": {},
                "auth": {
                    "type": "Bearer",
                    "key": "api_key"
                },
                "rate_limit": "60 requests per minute"
            }
        },
        "satisfaction_surveys": {
            "list": {
                "method": "GET",
                "path": "/satisfaction-surveys",
                "parameters": {
                    "limit": "integer",      # Default: 20
                    "offset": "integer"      # Default: 0
                },
                "auth": {
                    "type": "Bearer",
                    "key": "api_key"
                },
                "rate_limit": "60 requests per minute"
            }
        },
        "integrations": {
            "list": {
                "method": "GET",
                "path": "/integrations",
                "parameters": {
                    "limit": "integer",      # Default: 20
                    "offset": "integer"      # Default: 0
                },
                "auth": {
                    "type": "Bearer",
                    "key": "api_key"
                },
                "rate_limit": "60 requests per minute"
            }
        }
    }
}

# Postscript endpoints
POSTSCRIPT_ENDPOINTS = {
    "account": {
        "get": {
            "method": "GET",
            "path": "/v1/account",
            "parameters": {},
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "shops": {
        "list": {
            "method": "GET",
            "path": "/v1/shops",
            "parameters": {},
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/v1/shops/{shop_id}",
            "parameters": {
                "shop_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "subscribers": {
        "list": {
            "method": "GET",
            "path": "/v1/subscribers",
            "parameters": {
                "limit": "integer",
                "page": "integer"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        },
        "search": {
            "method": "GET",
            "path": "/v1/subscribers/search",
            "parameters": {
                "phone": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        },
        "create": {
            "method": "POST",
            "path": "/v1/subscribers",
            "parameters": {
                "phone": "string",
                "email": "string",
                "first_name": "string",
                "last_name": "string",
                "tags": "array",
                "custom_attributes": "object"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        },
        "update": {
            "method": "PUT",
            "path": "/v1/subscribers/{subscriber_id}",
            "parameters": {
                "subscriber_id": "string",
                "email": "string",
                "first_name": "string",
                "last_name": "string",
                "tags": "array",
                "custom_attributes": "object"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "campaigns": {
        "list": {
            "method": "GET",
            "path": "/v1/campaigns",
            "parameters": {
                "limit": "integer",
                "page": "integer"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/v1/campaigns/{campaign_id}",
            "parameters": {
                "campaign_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        },
        "create": {
            "method": "POST",
            "path": "/v1/campaigns",
            "parameters": {
                "name": "string",
                "message": "string",
                "audience_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "messages": {
        "list": {
            "method": "GET",
            "path": "/v1/messages",
            "parameters": {
                "limit": "integer",
                "page": "integer"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        },
        "send": {
            "method": "POST",
            "path": "/v1/messages",
            "parameters": {
                "phone": "string",
                "message": "string",
                "type": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "keywords": {
        "list": {
            "method": "GET",
            "path": "/v1/keywords",
            "parameters": {
                "limit": "integer",
                "page": "integer"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "audiences": {
        "list": {
            "method": "GET",
            "path": "/v1/audiences",
            "parameters": {
                "limit": "integer",
                "page": "integer"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "analytics": {
        "get": {
            "method": "GET",
            "path": "/v1/analytics",
            "parameters": {
                "period": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        }
    }
}

# Google Calendar endpoints
GOOGLE_CALENDAR_ENDPOINTS = {
    "auth": {
        "authenticate": {
            "method": "GET",
            "path": "/oauth2/auth",
            "parameters": {},
            "auth": {
                "type": "None"
            },
            "rate_limit": "1000 requests per 100 seconds"
        },
        "callback": {
            "method": "POST",
            "path": "/oauth2/token",
            "parameters": {
                "code": "string",
                "state": "string"
            },
            "auth": {
                "type": "None"
            },
            "rate_limit": "1000 requests per 100 seconds"
        }
    },
    "calendars": {
        "list": {
            "method": "GET",
            "path": "/users/me/calendarList",
            "parameters": {
                "maxResults": "integer",
                "pageToken": "string",
                "showDeleted": "boolean",
                "showHidden": "boolean"
            },
            "auth": {
                "type": "OAuth2",
                "key": "access_token"
            },
            "rate_limit": "1000 requests per 100 seconds"
        },
        "get": {
            "method": "GET",
            "path": "/calendars/{calendarId}",
            "parameters": {
                "calendarId": "string"
            },
            "auth": {
                "type": "OAuth2",
                "key": "access_token"
            },
            "rate_limit": "1000 requests per 100 seconds"
        }
    },
    "events": {
        "list": {
            "method": "GET",
            "path": "/calendars/{calendarId}/events",
            "parameters": {
                "calendarId": "string",
                "timeMin": "string",
                "timeMax": "string",
                "maxResults": "integer",
                "singleEvents": "boolean",
                "orderBy": "string",
                "q": "string",
                "pageToken": "string",
                "timeZone": "string",
                "updatedMin": "string",
                "showDeleted": "boolean",
                "iCalUID": "string"
            },
            "auth": {
                "type": "OAuth2",
                "key": "access_token"
            },
            "rate_limit": "1000 requests per 100 seconds"
        },
        "get": {
            "method": "GET",
            "path": "/calendars/{calendarId}/events/{eventId}",
            "parameters": {
                "calendarId": "string",
                "eventId": "string",
                "timeZone": "string"
            },
            "auth": {
                "type": "OAuth2",
                "key": "access_token"
            },
            "rate_limit": "1000 requests per 100 seconds"
        },
        "create": {
            "method": "POST",
            "path": "/calendars/{calendarId}/events",
            "parameters": {
                "calendarId": "string",
                "summary": "string",
                "description": "string",
                "start": {
                    "dateTime": "string",
                    "timeZone": "string"
                },
                "end": {
                    "dateTime": "string",
                    "timeZone": "string"
                },
                "location": "string",
                "attendees": "array",
                "recurrence": "array",
                "reminders": {
                    "useDefault": "boolean",
                    "overrides": "array"
                },
                "conferenceData": "object",
                "visibility": "string",
                "transparency": "string",
                "colorId": "string"
            },
            "auth": {
                "type": "OAuth2",
                "key": "access_token"
            },
            "rate_limit": "1000 requests per 100 seconds"
        },
        "update": {
            "method": "PUT",
            "path": "/calendars/{calendarId}/events/{eventId}",
            "parameters": {
                "calendarId": "string",
                "eventId": "string",
                "summary": "string",
                "description": "string",
                "start": {
                    "dateTime": "string",
                    "timeZone": "string"
                },
                "end": {
                    "dateTime": "string",
                    "timeZone": "string"
                },
                "location": "string",
                "attendees": "array",
                "recurrence": "array",
                "reminders": {
                    "useDefault": "boolean",
                    "overrides": "array"
                },
                "conferenceData": "object",
                "visibility": "string",
                "transparency": "string",
                "colorId": "string"
            },
            "auth": {
                "type": "OAuth2",
                "key": "access_token"
            },
            "rate_limit": "1000 requests per 100 seconds"
        },
        "delete": {
            "method": "DELETE",
            "path": "/calendars/{calendarId}/events/{eventId}",
            "parameters": {
                "calendarId": "string",
                "eventId": "string",
                "sendNotifications": "boolean",
                "sendUpdates": "string"
            },
            "auth": {
                "type": "OAuth2",
                "key": "access_token"
            },
            "rate_limit": "1000 requests per 100 seconds"
        },
        "instances": {
            "method": "GET",
            "path": "/calendars/{calendarId}/events/{eventId}/instances",
            "parameters": {
                "calendarId": "string",
                "eventId": "string",
                "maxResults": "integer",
                "pageToken": "string",
                "timeMin": "string",
                "timeMax": "string",
                "timeZone": "string",
                "showDeleted": "boolean"
            },
            "auth": {
                "type": "OAuth2",
                "key": "access_token"
            },
            "rate_limit": "1000 requests per 100 seconds"
        }
    }
}

# Asana endpoints
ASANA_ENDPOINTS = {
    "workspaces": {
        "list": {
            "method": "GET",
            "path": "/workspaces",
            "parameters": {
                "limit": "integer"
            },
            "auth": {
                "type": "Bearer",
                "key": "access_token"
            },
            "rate_limit": "100 requests per minute"
        }
    },
    "projects": {
        "list": {
            "method": "GET",
            "path": "/projects",
            "parameters": {
                "workspace": "string",
                "limit": "integer"
            },
            "auth": {
                "type": "Bearer",
                "key": "access_token"
            },
            "rate_limit": "100 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/projects/{projectGid}",
            "parameters": {
                "projectGid": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "access_token"
            },
            "rate_limit": "100 requests per minute"
        },
        "task_counts": {
            "method": "GET",
            "path": "/projects/{projectGid}/task_counts",
            "parameters": {
                "projectGid": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "access_token"
            },
            "rate_limit": "100 requests per minute"
        },
        "sections": {
            "method": "GET",
            "path": "/projects/{projectGid}/sections",
            "parameters": {
                "projectGid": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "access_token"
            },
            "rate_limit": "100 requests per minute"
        },
        "statuses": {
            "method": "GET",
            "path": "/projects/{projectGid}/project_statuses",
            "parameters": {
                "projectGid": "string",
                "limit": "integer",
                "offset": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "access_token"
            },
            "rate_limit": "100 requests per minute"
        }
    },
    "tasks": {
        "list": {
            "method": "GET",
            "path": "/tasks",
            "parameters": {
                "project": "string",
                "workspace": "string",
                "assignee": "string",
                "completed": "boolean",
                "limit": "integer",
                "modified_since": "string",
                "opt_fields": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "access_token"
            },
            "rate_limit": "100 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/tasks/{taskGid}",
            "parameters": {
                "taskGid": "string",
                "opt_fields": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "access_token"
            },
            "rate_limit": "100 requests per minute"
        },
        "create": {
            "method": "POST",
            "path": "/tasks",
            "parameters": {
                "data": {
                    "name": "string",
                    "notes": "string",
                    "html_notes": "string",
                    "due_on": "string",
                    "assignee": "string",
                    "followers": "array",
                    "parent": "string",
                    "projects": "array",
                    "workspace": "string",
                    "approval_status": "string",
                    "assignee_status": "string",
                    "completed": "boolean",
                    "external": "object",
                    "is_rendered_as_separator": "boolean",
                    "liked": "boolean"
                }
            },
            "auth": {
                "type": "Bearer",
                "key": "access_token"
            },
            "rate_limit": "100 requests per minute"
        },
        "update": {
            "method": "PUT",
            "path": "/tasks/{taskGid}",
            "parameters": {
                "taskGid": "string",
                "data": {
                    "name": "string",
                    "notes": "string",
                    "html_notes": "string",
                    "due_on": "string",
                    "assignee": "string",
                    "completed": "boolean"
                }
            },
            "auth": {
                "type": "Bearer",
                "key": "access_token"
            },
            "rate_limit": "100 requests per minute"
        },
        "delete": {
            "method": "DELETE",
            "path": "/tasks/{taskGid}",
            "parameters": {
                "taskGid": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "access_token"
            },
            "rate_limit": "100 requests per minute"
        },
        "stories": {
            "list": {
                "method": "GET",
                "path": "/tasks/{taskGid}/stories",
                "parameters": {
                    "taskGid": "string",
                    "opt_fields": "string"
                },
                "auth": {
                    "type": "Bearer",
                    "key": "access_token"
                },
                "rate_limit": "100 requests per minute"
            },
            "create": {
                "method": "POST",
                "path": "/tasks/{taskGid}/stories",
                "parameters": {
                    "taskGid": "string",
                    "data": {
                        "text": "string"
                    }
                },
                "auth": {
                    "type": "Bearer",
                    "key": "access_token"
                },
                "rate_limit": "100 requests per minute"
            }
        },
        "dependencies": {
            "add": {
                "method": "POST",
                "path": "/tasks/{taskGid}/dependencies",
                "parameters": {
                    "taskGid": "string",
                    "data": {
                        "dependencies": "array"
                    }
                },
                "auth": {
                    "type": "Bearer",
                    "key": "access_token"
                },
                "rate_limit": "100 requests per minute"
            }
        },
        "dependents": {
            "add": {
                "method": "POST",
                "path": "/tasks/{taskGid}/dependents",
                "parameters": {
                    "taskGid": "string",
                    "data": {
                        "dependents": "array"
                    }
                },
                "auth": {
                    "type": "Bearer",
                    "key": "access_token"
                },
                "rate_limit": "100 requests per minute"
            }
        },
        "subtasks": {
            "create": {
                "method": "POST",
                "path": "/tasks/{taskGid}/subtasks",
                "parameters": {
                    "taskGid": "string",
                    "data": {
                        "name": "string",
                        "notes": "string",
                        "due_on": "string",
                        "assignee": "string"
                    }
                },
                "auth": {
                    "type": "Bearer",
                    "key": "access_token"
                },
                "rate_limit": "100 requests per minute"
            }
        }
    }
}

# Notion endpoints
NOTION_ENDPOINTS = {
    "blocks": {
        "append_children": {
            "method": "PATCH",
            "path": "/v1/blocks/{block_id}/children",
            "parameters": {
                "block_id": "string",      # Required: Parent block ID
                "children": "array"        # Required: Array of block objects
            },
            "auth": {
                "type": "Bearer",
                "key": "notion_token"
            },
            "rate_limit": "3 requests per second"
        },
        "retrieve": {
            "method": "GET",
            "path": "/v1/blocks/{block_id}",
            "parameters": {
                "block_id": "string"       # Required: Block ID
            },
            "auth": {
                "type": "Bearer",
                "key": "notion_token"
            },
            "rate_limit": "3 requests per second"
        },
        "retrieve_children": {
            "method": "GET",
            "path": "/v1/blocks/{block_id}/children",
            "parameters": {
                "block_id": "string",      # Required: Parent block ID
                "page_size": "integer",    # Optional: Number of blocks to retrieve (max: 100)
                "start_cursor": "string"   # Optional: Cursor for pagination
            },
            "auth": {
                "type": "Bearer",
                "key": "notion_token"
            },
            "rate_limit": "3 requests per second"
        },
        "delete": {
            "method": "DELETE",
            "path": "/v1/blocks/{block_id}",
            "parameters": {
                "block_id": "string"       # Required: Block ID
            },
            "auth": {
                "type": "Bearer",
                "key": "notion_token"
            },
            "rate_limit": "3 requests per second"
        }
    },
    "pages": {
        "retrieve": {
            "method": "GET",
            "path": "/v1/pages/{page_id}",
            "parameters": {
                "page_id": "string"        # Required: Page ID
            },
            "auth": {
                "type": "Bearer",
                "key": "notion_token"
            },
            "rate_limit": "3 requests per second"
        },
        "update": {
            "method": "PATCH",
            "path": "/v1/pages/{page_id}",
            "parameters": {
                "page_id": "string",       # Required: Page ID
                "properties": "object"     # Required: Properties to update
            },
            "auth": {
                "type": "Bearer",
                "key": "notion_token"
            },
            "rate_limit": "3 requests per second"
        }
    },
    "databases": {
        "list": {
            "method": "GET",
            "path": "/v1/databases",
            "parameters": {
                "page_size": "integer",    # Optional: Number of databases to retrieve
                "start_cursor": "string"     # Optional: Cursor for pagination
            },
            "auth": {
                "type": "Bearer",
                "key": "notion_token"
            },
            "rate_limit": "3 requests per second"
        },
        "create": {
            "method": "POST",
            "path": "/v1/databases",
            "parameters": {
                "parent": "object",        # Required: Parent object
                "title": "array",          # Required: Title as rich text array
                "properties": "object"     # Required: Property schema
            },
            "auth": {
                "type": "Bearer",
                "key": "notion_token"
            },
            "rate_limit": "3 requests per second"
        },
        "query": {
            "method": "POST",
            "path": "/v1/databases/{database_id}/query",
            "parameters": {
                "database_id": "string",   # Required: Database ID
                "filter": "object",        # Optional: Filter conditions
                "sorts": "array",          # Optional: Sorting conditions
                "page_size": "integer",    # Optional: Number of results (max: 100)
                "start_cursor": "string"   # Optional: Cursor for pagination
            },
            "auth": {
                "type": "Bearer",
                "key": "notion_token"
            },
            "rate_limit": "3 requests per second"
        },
        "retrieve": {
            "method": "GET",
            "path": "/v1/databases/{database_id}",
            "parameters": {
                "database_id": "string"    # Required: Database ID
            },
            "auth": {
                "type": "Bearer",
                "key": "notion_token"
            },
            "rate_limit": "3 requests per second"
        },
        "update": {
            "method": "PATCH",
            "path": "/v1/databases/{database_id}",
            "parameters": {
                "database_id": "string",   # Required: Database ID
                "title": "array",          # Optional: New title
                "description": "array",    # Optional: New description
                "properties": "object"     # Optional: Updated property schema
            },
            "auth": {
                "type": "Bearer",
                "key": "notion_token"
            },
            "rate_limit": "3 requests per second"
        }
    },
    "users": {
        "list": {
            "method": "GET",
            "path": "/v1/users",
            "parameters": {
                "page_size": "integer",    # Optional: Number of users to retrieve
                "start_cursor": "string"   # Optional: Cursor for pagination
            },
            "auth": {
                "type": "Bearer",
                "key": "notion_token"
            },
            "rate_limit": "3 requests per second"
        },
        "retrieve": {
            "method": "GET",
            "path": "/v1/users/{user_id}",
            "parameters": {
                "user_id": "string"        # Required: User ID
            },
            "auth": {
                "type": "Bearer",
                "key": "notion_token"
            },
            "rate_limit": "3 requests per second"
        },
        "retrieve_bot": {
            "method": "GET",
            "path": "/v1/users/me",
            "parameters": {},
            "auth": {
                "type": "Bearer",
                "key": "notion_token"
            },
            "rate_limit": "3 requests per second"
        }
    },
    "comments": {
        "create": {
            "method": "POST",
            "path": "/v1/comments",
            "parameters": {
                "parent": "object",        # Required: Parent object (page or block)
                "rich_text": "array"       # Required: Comment content as rich text
            },
            "auth": {
                "type": "Bearer",
                "key": "notion_token"
            },
            "rate_limit": "3 requests per second"
        },
        "retrieve": {
            "method": "GET",
            "path": "/v1/comments",
            "parameters": {
                "block_id": "string",      # Required: Block or page ID
                "page_size": "integer",    # Optional: Number of comments (max: 100)
                "start_cursor": "string"   # Optional: Cursor for pagination
            },
            "auth": {
                "type": "Bearer",
                "key": "notion_token"
            },
            "rate_limit": "3 requests per second"
        }
    },
    "search": {
        "query": {
            "method": "POST",
            "path": "/v1/search",
            "parameters": {
                "query": "string",         # Optional: Search text
                "filter": "object",        # Optional: Filter criteria
                "sort": "object",          # Optional: Sort criteria
                "page_size": "integer",    # Optional: Number of results (max: 100)
                "start_cursor": "string"   # Optional: Cursor for pagination
            },
            "auth": {
                "type": "Bearer",
                "key": "notion_token"
            },
            "rate_limit": "3 requests per second"
        }
    }
}

# Google Drive endpoints
GOOGLE_DRIVE_ENDPOINTS = {
    "files": {
        "list": {
            "method": "GET",
            "path": "/drive/v3/files",
            "parameters": {
                "q": "string",
                "pageSize": "integer",
                "fields": "string",
                "orderBy": "string"
            },
            "auth": {
                "type": "OAuth2",
                "key": "access_token"
            },
            "rate_limit": "1000 requests per 100 seconds"
        },
        "create": {
            "method": "POST",
            "path": "/upload/drive/v3/files",
            "parameters": {
                "name": "string",
                "mimeType": "string",
                "parents": "array"
            },
            "auth": {
                "type": "OAuth2",
                "key": "access_token"
            },
            "rate_limit": "1000 requests per 100 seconds"
        }
    }
}

# Figma endpoints
FIGMA_ENDPOINTS = {
    "files": {
        "get": {
            "method": "GET",
            "path": "/v1/files/{file_key}",
            "parameters": {
                "file_key": "string",
                "version": "string",
                "ids": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "access_token"
            },
            "rate_limit": "60 requests per minute"
        },
        "get_nodes": {
            "method": "GET",
            "path": "/v1/files/{file_key}/nodes",
            "parameters": {
                "file_key": "string",
                "ids": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "access_token"
            },
            "rate_limit": "60 requests per minute"
        }
    }
}

# Slack endpoints
SLACK_ENDPOINTS = {
    "chat": {
        "postMessage": {
            "method": "POST",
            "path": "/api/chat.postMessage",
            "parameters": {
                "channel": "string",
                "text": "string",
                "blocks": "array",
                "attachments": "array"
            },
            "auth": {
                "type": "Bearer",
                "key": "bot_token"
            },
            "rate_limit": "1 request per second"
        },
        "update": {
            "method": "POST",
            "path": "/api/chat.update",
            "parameters": {
                "channel": "string",
                "ts": "string",
                "text": "string",
                "blocks": "array"
            },
            "auth": {
                "type": "Bearer",
                "key": "bot_token"
            },
            "rate_limit": "1 request per second"
        }
    }
}

# Klaviyo endpoints
KLAVIYO_ENDPOINTS = {
    "profiles": {
        "list": {
            "method": "GET",
            "path": "/profiles",
            "parameters": {
                "filter": "string",
                "page_size": "integer",
                "page_cursor": "string",
                "include": "string",
                "fields": "object",
                "sort": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/profiles/{id}",
            "parameters": {
                "id": "string",
                "include": "string",
                "fields": "object"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "create": {
            "method": "POST",
            "path": "/profiles",
            "parameters": {
                "data": {
                    "type": "string",
                    "attributes": "object"
                }
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "update": {
            "method": "PATCH",
            "path": "/profiles/{id}",
            "parameters": {
                "id": "string",
                "data": {
                    "type": "string",
                    "attributes": "object"
                }
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "delete": {
            "method": "DELETE",
            "path": "/profiles/{id}",
            "parameters": {
                "id": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "lists": {
        "list": {
            "method": "GET",
            "path": "/lists",
            "parameters": {
                "filter": "string",
                "page_size": "integer",
                "page_cursor": "string",
                "include": "string",
                "fields": "object",
                "sort": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/lists/{id}",
            "parameters": {
                "id": "string",
                "include": "string",
                "fields": "object"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "create": {
            "method": "POST",
            "path": "/lists",
            "parameters": {
                "data": {
                    "type": "string",
                    "attributes": "object"
                }
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "add_profiles": {
            "method": "POST",
            "path": "/lists/{id}/relationships/profiles",
            "parameters": {
                "id": "string",
                "data": "array"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "segments": {
        "list": {
            "method": "GET",
            "path": "/segments",
            "parameters": {
                "filter": "string",
                "page_size": "integer",
                "page_cursor": "string",
                "include": "string",
                "fields": "object",
                "sort": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/segments/{id}",
            "parameters": {
                "id": "string",
                "include": "string",
                "fields": "object"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "events": {
        "list": {
            "method": "GET",
            "path": "/events",
            "parameters": {
                "filter": "string",
                "page_size": "integer",
                "page_cursor": "string",
                "include": "string",
                "fields": "object",
                "sort": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "create": {
            "method": "POST",
            "path": "/events",
            "parameters": {
                "data": {
                    "type": "string",
                    "attributes": "object"
                }
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "metrics": {
        "list": {
            "method": "GET",
            "path": "/metrics",
            "parameters": {
                "filter": "string",
                "page_size": "integer",
                "page_cursor": "string",
                "include": "string",
                "fields": "object",
                "sort": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/metrics/{id}",
            "parameters": {
                "id": "string",
                "include": "string",
                "fields": "object"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "campaigns": {
        "list": {
            "method": "GET",
            "path": "/campaigns",
            "parameters": {
                "filter": "string",
                "page_size": "integer",
                "page_cursor": "string",
                "include": "string",
                "fields": "object",
                "sort": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/campaigns/{id}",
            "parameters": {
                "id": "string",
                "include": "string",
                "fields": "object"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "create": {
            "method": "POST",
            "path": "/campaigns",
            "parameters": {
                "data": {
                    "type": "string",
                    "attributes": "object"
                }
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "send": {
            "method": "POST",
            "path": "/campaign-send-jobs",
            "parameters": {
                "data": {
                    "type": "string",
                    "attributes": "object"
                }
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "get_send_job": {
            "method": "GET",
            "path": "/campaign-send-jobs/{id}",
            "parameters": {
                "id": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "flows": {
        "list": {
            "method": "GET",
            "path": "/flows",
            "parameters": {
                "filter": "string",
                "page_size": "integer",
                "page_cursor": "string",
                "include": "string",
                "fields": "object",
                "sort": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/flows/{id}",
            "parameters": {
                "id": "string",
                "include": "string",
                "fields": "object"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "create": {
            "method": "POST",
            "path": "/flows",
            "parameters": {
                "data": {
                    "type": "string",
                    "attributes": "object"
                }
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "update_status": {
            "method": "PATCH",
            "path": "/flows/{id}",
            "parameters": {
                "id": "string",
                "data": {
                    "type": "string",
                    "attributes": "object"
                }
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "templates": {
        "list": {
            "method": "GET",
            "path": "/templates",
            "parameters": {
                "filter": "string",
                "page_size": "integer",
                "page_cursor": "string",
                "include": "string",
                "fields": "object",
                "sort": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/templates/{id}",
            "parameters": {
                "id": "string",
                "include": "string",
                "fields": "object"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "create": {
            "method": "POST",
            "path": "/templates",
            "parameters": {
                "data": {
                    "type": "string",
                    "attributes": "object"
                }
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "catalogs": {
        "list": {
            "method": "GET",
            "path": "/catalogs",
            "parameters": {
                "filter": "string",
                "page_size": "integer",
                "page_cursor": "string",
                "include": "string",
                "fields": "object",
                "sort": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/catalogs/{id}",
            "parameters": {
                "id": "string",
                "include": "string",
                "fields": "object"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "items": {
            "list": {
                "method": "GET",
                "path": "/catalog-items",
                "parameters": {
                    "filter": "string",
                    "page_size": "integer",
                    "page_cursor": "string",
                    "include": "string",
                    "fields": "object",
                    "sort": "string"
                },
                "auth": {
                    "type": "Header",
                    "key": "Klaviyo-API-Key"
                },
                "rate_limit": "60 requests per minute"
            },
            "get": {
                "method": "GET",
                "path": "/catalog-items/{id}",
                "parameters": {
                    "id": "string",
                    "include": "string",
                    "fields": "object"
                },
                "auth": {
                    "type": "Header",
                    "key": "Klaviyo-API-Key"
                },
                "rate_limit": "60 requests per minute"
            },
            "create": {
                "method": "POST",
                "path": "/catalog-items",
                "parameters": {
                    "data": {
                        "type": "string",
                        "attributes": {
                            "external_id": "string",
                            "title": "string",
                            "description": "string",
                            "url": "string",
                            "price": "number",
                            "image_full_url": "string",
                            "image_thumbnail_url": "string",
                            "images": "array",
                            "catalog_type": "string",
                            "custom_metadata": "object",
                            "published": "boolean"
                        }
                    }
                },
                "auth": {
                    "type": "Header",
                    "key": "Klaviyo-API-Key"
                },
                "rate_limit": "60 requests per minute"
            },
            "delete": {
                "method": "DELETE",
                "path": "/catalog-items/{id}",
                "parameters": {
                    "id": "string"
                },
                "auth": {
                    "type": "Header",
                    "key": "Klaviyo-API-Key"
                },
                "rate_limit": "60 requests per minute"
            }
        }
    },
    "tags": {
        "list": {
            "method": "GET",
            "path": "/tags",
            "parameters": {
                "filter": "string",
                "page_size": "integer",
                "page_cursor": "string",
                "include": "string",
                "fields": "object",
                "sort": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "create": {
            "method": "POST",
            "path": "/tags",
            "parameters": {
                "data": {
                    "type": "string",
                    "attributes": "object"
                }
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "add_to_resource": {
            "method": "POST",
            "path": "/tags/{id}/relationships/resources",
            "parameters": {
                "id": "string",
                "data": "array"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "webhooks": {
        "list": {
            "method": "GET",
            "path": "/webhooks",
            "parameters": {
                "filter": "string",
                "page_size": "integer",
                "page_cursor": "string",
                "include": "string",
                "fields": "object",
                "sort": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "create": {
            "method": "POST",
            "path": "/webhooks",
            "parameters": {
                "data": {
                    "type": "string",
                    "attributes": "object"
                }
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "delete": {
            "method": "DELETE",
            "path": "/webhooks/{id}",
            "parameters": {
                "id": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "data_privacy": {
        "request_deletion": {
            "method": "POST",
            "path": "/data-privacy-deletion-jobs",
            "parameters": {
                "data": {
                    "type": "string",
                    "attributes": "object"
                }
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "coupons": {
        "list": {
            "method": "GET",
            "path": "/coupons",
            "parameters": {
                "filter": "string",
                "page_size": "integer",
                "page_cursor": "string",
                "include": "string",
                "fields": "object",
                "sort": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "create_code": {
            "method": "POST",
            "path": "/coupon-codes",
            "parameters": {
                "data": {
                    "type": "string",
                    "attributes": "object"
                }
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "forms": {
        "list": {
            "method": "GET",
            "path": "/forms",
            "parameters": {
                "filter": "string",
                "page_size": "integer",
                "page_cursor": "string",
                "include": "string",
                "fields": "object",
                "sort": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/forms/{id}",
            "parameters": {
                "id": "string",
                "include": "string",
                "fields": "object"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "reviews": {
        "list": {
            "method": "GET",
            "path": "/product-reviews",
            "parameters": {
                "filter": "string",
                "page_size": "integer",
                "page_cursor": "string",
                "include": "string",
                "fields": "object",
                "sort": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/product-reviews/{id}",
            "parameters": {
                "id": "string",
                "include": "string",
                "fields": "object"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "images": {
        "list": {
            "method": "GET",
            "path": "/images",
            "parameters": {
                "filter": "string",
                "page_size": "integer",
                "page_cursor": "string",
                "include": "string",
                "fields": "object",
                "sort": "string"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/images/{id}",
            "parameters": {
                "id": "string",
                "include": "string",
                "fields": "object"
            },
            "auth": {
                "type": "Header",
                "key": "Klaviyo-API-Key"
            },
            "rate_limit": "60 requests per minute"
        }
    }
}

# Elevar endpoints
ELEVAR_ENDPOINTS = {
    "account": {
        "get": {
            "method": "GET",
            "path": "/v1/account",
            "parameters": {},
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "shops": {
        "get": {
            "method": "GET",
            "path": "/v1/shops/{shop_id}",
            "parameters": {
                "shop_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "tracking": {
        "issues": {
            "method": "GET",
            "path": "/v1/tracking/issues",
            "parameters": {
                "shop_id": "string",
                "start_date": "string",
                "end_date": "string",
                "severity": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "analytics": {
        "overview": {
            "method": "GET",
            "path": "/v1/analytics/overview",
            "parameters": {
                "shop_id": "string",
                "start_date": "string",
                "end_date": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "attribution": {
        "get": {
            "method": "GET",
            "path": "/v1/attribution",
            "parameters": {
                "shop_id": "string",
                "start_date": "string",
                "end_date": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "monitoring": {
        "data_quality": {
            "method": "GET",
            "path": "/v1/monitoring/data-quality",
            "parameters": {
                "shop_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "campaigns": {
        "performance": {
            "method": "GET",
            "path": "/v1/campaigns/performance",
            "parameters": {
                "shop_id": "string",
                "start_date": "string",
                "end_date": "string",
                "platform": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "apiKey"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "channels": {
        "performance": {
            "method": "GET",
            "path": "/channels/performance",
            "parameters": {
                "shop_id": "string",
                "start_date": "string",  # YYYY-MM-DD format
                "end_date": "string"     # YYYY-MM-DD format
            },
            "auth": {
                "type": "Bearer",
                "key": "api_key"
            },
            "rate_limit": "60 requests per minute"
        }
    }
}

# ShipStation endpoints
SHIPSTATION_ENDPOINTS = {
    "orders": {
        "list": {
            "method": "GET",
            "path": "/orders",
            "parameters": {
                "page": "integer",
                "pageSize": "integer",
                "sortBy": "string",
                "sortDir": "string",
                "orderStatus": "string",
                "orderNumber": "string",
                "customerName": "string",
                "itemKeyword": "string",
                "createDateStart": "string",
                "createDateEnd": "string",
                "modifyDateStart": "string",
                "modifyDateEnd": "string",
                "orderDateStart": "string",
                "orderDateEnd": "string"
            },
            "auth": {
                "type": "Basic",
                "key": "Authorization"
            },
            "rate_limit": "40 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/orders/{orderId}",
            "parameters": {
                "orderId": "string"
            },
            "auth": {
                "type": "Basic",
                "key": "Authorization"
            },
            "rate_limit": "40 requests per minute"
        },
        "create": {
            "method": "POST",
            "path": "/orders/createorder",
            "parameters": {
                "orderNumber": "string",
                "orderDate": "string",
                "orderStatus": "string",
                "customerName": "string",
                "customerEmail": "string",
                "items": "array",
                "amountPaid": "number",
                "taxAmount": "number",
                "shippingAmount": "number",
                "shippingAddress": "object",
                "billingAddress": "object",
                "tagIds": "array"
            },
            "auth": {
                "type": "Basic",
                "key": "Authorization"
            },
            "rate_limit": "40 requests per minute"
        },
        "update": {
            "method": "PUT",
            "path": "/orders/{orderId}",
            "parameters": {
                "orderId": "string",
                "orderNumber": "string",
                "orderDate": "string",
                "orderStatus": "string",
                "customerName": "string",
                "customerEmail": "string",
                "items": "array",
                "amountPaid": "number",
                "taxAmount": "number",
                "shippingAmount": "number",
                "shippingAddress": "object",
                "billingAddress": "object",
                "tagIds": "array"
            },
            "auth": {
                "type": "Basic",
                "key": "Authorization"
            },
            "rate_limit": "40 requests per minute"
        },
        "delete": {
            "method": "DELETE",
            "path": "/orders/{orderId}",
            "parameters": {
                "orderId": "string"
            },
            "auth": {
                "type": "Basic",
                "key": "Authorization"
            },
            "rate_limit": "40 requests per minute"
        }
    },
    "shipments": {
        "list": {
            "method": "GET",
            "path": "/shipments",
            "parameters": {
                "page": "integer",
                "pageSize": "integer",
                "sortBy": "string",
                "sortDir": "string",
                "shipDateStart": "string",
                "shipDateEnd": "string",
                "deliveryDateStart": "string",
                "deliveryDateEnd": "string",
                "trackingNumber": "string",
                "orderNumber": "string",
                "orderId": "string"
            },
            "auth": {
                "type": "Basic",
                "key": "Authorization"
            },
            "rate_limit": "40 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/shipments/{shipmentId}",
            "parameters": {
                "shipmentId": "string"
            },
            "auth": {
                "type": "Basic",
                "key": "Authorization"
            },
            "rate_limit": "40 requests per minute"
        },
        "create": {
            "method": "POST",
            "path": "/shipments/createshipment",
            "parameters": {
                "orderId": "string",
                "carrierCode": "string",
                "serviceCode": "string",
                "packageCode": "string",
                "confirmation": "string",
                "shipDate": "string",
                "weight": "object",
                "dimensions": "object",
                "insuranceOptions": "object",
                "internationalOptions": "object",
                "advancedOptions": "object",
                "testLabel": "boolean"
            },
            "auth": {
                "type": "Basic",
                "key": "Authorization"
            },
            "rate_limit": "40 requests per minute"
        },
        "void": {
            "method": "POST",
            "path": "/shipments/voidlabel",
            "parameters": {
                "shipmentId": "string"
            },
            "auth": {
                "type": "Basic",
                "key": "Authorization"
            },
            "rate_limit": "40 requests per minute"
        }
    },
    "warehouses": {
        "list": {
            "method": "GET",
            "path": "/warehouses",
            "parameters": {},
            "auth": {
                "type": "Basic",
                "key": "Authorization"
            },
            "rate_limit": "40 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/warehouses/{warehouseId}",
            "parameters": {
                "warehouseId": "string"
            },
            "auth": {
                "type": "Basic",
                "key": "Authorization"
            },
            "rate_limit": "40 requests per minute"
        },
        "create": {
            "method": "POST",
            "path": "/warehouses/createwarehouse",
            "parameters": {
                "warehouseName": "string",
                "warehouseCode": "string",
                "address": "object",
                "contactName": "string",
                "contactEmail": "string",
                "contactPhone": "string"
            },
            "auth": {
                "type": "Basic",
                "key": "Authorization"
            },
            "rate_limit": "40 requests per minute"
        },
        "update": {
            "method": "PUT",
            "path": "/warehouses/{warehouseId}",
            "parameters": {
                "warehouseId": "string",
                "warehouseName": "string",
                "warehouseCode": "string",
                "address": "object",
                "contactName": "string",
                "contactEmail": "string",
                "contactPhone": "string"
            },
            "auth": {
                "type": "Basic",
                "key": "Authorization"
            },
            "rate_limit": "40 requests per minute"
        }
    },
    "inventory": {
        "list": {
            "method": "GET",
            "path": "/inventory",
            "parameters": {
                "page": "integer",
                "pageSize": "integer",
                "sortBy": "string",
                "sortDir": "string",
                "sku": "string",
                "productName": "string",
                "warehouseId": "string"
            },
            "auth": {
                "type": "Basic",
                "key": "Authorization"
            },
            "rate_limit": "40 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/inventory/{sku}",
            "parameters": {
                "sku": "string"
            },
            "auth": {
                "type": "Basic",
                "key": "Authorization"
            },
            "rate_limit": "40 requests per minute"
        },
        "update": {
            "method": "PUT",
            "path": "/inventory/updateinventory",
            "parameters": {
                "sku": "string",
                "warehouseId": "string",
                "quantity": "integer",
                "location": "string",
                "note": "string"
            },
            "auth": {
                "type": "Basic",
                "key": "Authorization"
            },
            "rate_limit": "40 requests per minute"
        }
    }
}

# ShipHero endpoints
SHIPHERO_ENDPOINTS = {
    "orders": {
        "list": {
            "method": "GET",
            "path": "/api/v1/orders",
            "parameters": {
                "page": "integer",
                "per_page": "integer",
                "status": "string",
                "created_at_from": "string",
                "created_at_to": "string",
                "order_number": "string",
                "customer_email": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/api/v1/orders/{order_id}",
            "parameters": {
                "order_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        },
        "update": {
            "method": "PUT",
            "path": "/api/v1/orders/{order_id}",
            "parameters": {
                "order_id": "string",
                "status": "string",
                "shipping_method": "string",
                "tracking_number": "string",
                "notes": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "shipments": {
        "list": {
            "method": "GET",
            "path": "/api/v1/shipments",
            "parameters": {
                "page": "integer",
                "per_page": "integer",
                "status": "string",
                "created_at_from": "string",
                "created_at_to": "string",
                "order_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/api/v1/shipments/{shipment_id}",
            "parameters": {
                "shipment_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        },
        "create": {
            "method": "POST",
            "path": "/api/v1/shipments",
            "parameters": {
                "order_id": "string",
                "carrier": "string",
                "service": "string",
                "tracking_number": "string",
                "shipping_date": "string",
                "items": "array"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        },
        "void": {
            "method": "POST",
            "path": "/api/v1/shipments/{shipment_id}/void",
            "parameters": {
                "shipment_id": "string",
                "reason": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "inventory": {
        "list": {
            "method": "GET",
            "path": "/api/v1/inventory",
            "parameters": {
                "page": "integer",
                "per_page": "integer",
                "sku": "string",
                "warehouse_id": "string",
                "status": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/api/v1/inventory/{sku}",
            "parameters": {
                "sku": "string",
                "warehouse_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        },
        "update": {
            "method": "PUT",
            "path": "/api/v1/inventory/{sku}",
            "parameters": {
                "sku": "string",
                "warehouse_id": "string",
                "quantity": "integer",
                "location": "string",
                "note": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "warehouses": {
        "list": {
            "method": "GET",
            "path": "/api/v1/warehouses",
            "parameters": {},
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/api/v1/warehouses/{warehouse_id}",
            "parameters": {
                "warehouse_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        }
    }
}

# ShipBob endpoints
SHIPBOB_ENDPOINTS = {
    "orders": {
        "list": {
            "method": "GET",
            "path": "/api/v1/orders",
            "parameters": {
                "page": "integer",
                "limit": "integer",
                "status": "string",
                "created_at_from": "string",
                "created_at_to": "string",
                "order_number": "string",
                "customer_email": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/api/v1/orders/{order_id}",
            "parameters": {
                "order_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        },
        "update": {
            "method": "PUT",
            "path": "/api/v1/orders/{order_id}",
            "parameters": {
                "order_id": "string",
                "status": "string",
                "shipping_method": "string",
                "tracking_number": "string",
                "notes": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "shipments": {
        "list": {
            "method": "GET",
            "path": "/api/v1/shipments",
            "parameters": {
                "page": "integer",
                "limit": "integer",
                "status": "string",
                "created_at_from": "string",
                "created_at_to": "string",
                "order_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/api/v1/shipments/{shipment_id}",
            "parameters": {
                "shipment_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        },
        "create": {
            "method": "POST",
            "path": "/api/v1/shipments",
            "parameters": {
                "order_id": "string",
                "carrier": "string",
                "service": "string",
                "tracking_number": "string",
                "shipping_date": "string",
                "items": "array"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        },
        "void": {
            "method": "POST",
            "path": "/api/v1/shipments/{shipment_id}/void",
            "parameters": {
                "shipment_id": "string",
                "reason": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "inventory": {
        "list": {
            "method": "GET",
            "path": "/api/v1/inventory",
            "parameters": {
                "page": "integer",
                "limit": "integer",
                "sku": "string",
                "warehouse_id": "string",
                "status": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/api/v1/inventory/{sku}",
            "parameters": {
                "sku": "string",
                "warehouse_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        },
        "update": {
            "method": "PUT",
            "path": "/api/v1/inventory/{sku}",
            "parameters": {
                "sku": "string",
                "warehouse_id": "string",
                "quantity": "integer",
                "location": "string",
                "note": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        }
    },
    "warehouses": {
        "list": {
            "method": "GET",
            "path": "/api/v1/warehouses",
            "parameters": {},
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        },
        "get": {
            "method": "GET",
            "path": "/api/v1/warehouses/{warehouse_id}",
            "parameters": {
                "warehouse_id": "string"
            },
            "auth": {
                "type": "Bearer",
                "key": "Authorization"
            },
            "rate_limit": "60 requests per minute"
        }
    }
}

# Add ShipStation to the all_endpoints list
all_endpoints = [
    ("Shopify", SHOPIFY_ENDPOINTS),
    ("Klaviyo", KLAVIYO_ENDPOINTS),
    ("Postscript", POSTSCRIPT_ENDPOINTS),
    ("Gorgias", GORGIAS_ENDPOINTS),
    ("Northbeam", NORTHBEAM_ENDPOINTS),
    ("Triple Whale", TRIPLE_WHALE_ENDPOINTS),
    ("Elevar", ELEVAR_ENDPOINTS),
    ("ShipStation", SHIPSTATION_ENDPOINTS),
    ("ShipHero", SHIPHERO_ENDPOINTS),
    ("ShipBob", SHIPBOB_ENDPOINTS)  # Add ShipBob to the list
]

def get_endpoints_for_action(action: str) -> Dict[str, Any]:
    """Get relevant endpoints for a given high-level action"""
    return ACTION_TO_ENDPOINTS.get(action, {}) 

def handle_fulfillment_and_inventory(order_id: str, action: str) -> dict:
    """
    Handle fulfillment actions for orders.
    For stopping orders from shipping:
    1. Check Shopify order status
    2. If unfulfilled, check ShipStation for shipping label
    3. Void label if exists, otherwise remove from shipping batch
    
    Args:
        order_id: The ID of the order to process
        action: The fulfillment action to take ('void', 'pause', 'cancel', or 'refund')
        
    Returns:
        dict: Result of the operation including status and any error messages
    """
    try:
        # Step 1: Check Shopify order status first
        shopify_order = SHOPIFY_ENDPOINTS['orders']['get'](
            order_id=order_id
        )
        
        if not shopify_order.get('success'):
            raise Exception(f"Failed to get Shopify order status: {shopify_order.get('error')}")
            
        # Only proceed if order is unfulfilled
        if shopify_order.get('fulfillment_status') != 'unfulfilled':
            return {
                'success': False,
                'error': f"Order {order_id} is already fulfilled or cancelled"
            }
            
        # Step 2: Handle the fulfillment action
        if action == 'void':
            # Check if shipping label exists in ShipStation
            shipment = SHIPSTATION_ENDPOINTS['shipments']['get'](
                shipmentId=order_id
            )
            
            if shipment.get('success'):
                # Void the shipping label if it exists
                void_result = SHIPSTATION_ENDPOINTS['shipments']['void'](
                    shipmentId=order_id
                )
                if not void_result.get('success'):
                    raise Exception(f"Failed to void shipping label: {void_result.get('error')}")
            else:
                # If no label exists, just remove from shipping batch
                remove_result = SHIPSTATION_ENDPOINTS['orders']['update'](
                    orderId=order_id,
                    orderStatus='on_hold'
                )
                if not remove_result.get('success'):
                    raise Exception(f"Failed to remove order from shipping batch: {remove_result.get('error')}")
                    
        elif action == 'pause':
            # Pause the fulfillment
            pause_result = SHIPSTATION_ENDPOINTS['orders']['update'](
                orderId=order_id,
                orderStatus='on_hold'
            )
            if not pause_result.get('success'):
                raise Exception(f"Failed to pause fulfillment: {pause_result.get('error')}")
                
        elif action in ['cancel', 'refund']:
            # Handle cancellation or refund
            if action == 'cancel':
                cancel_result = SHIPSTATION_ENDPOINTS['orders']['update'](
                    orderId=order_id,
                    orderStatus='cancelled'
                )
                if not cancel_result.get('success'):
                    raise Exception(f"Failed to cancel order: {cancel_result.get('error')}")
            else:  # refund
                refund_result = SHIPSTATION_ENDPOINTS['orders']['update'](
                    orderId=order_id,
                    orderStatus='refunded'
                )
                if not refund_result.get('success'):
                    raise Exception(f"Failed to refund order: {refund_result.get('error')}")
        else:
            raise ValueError(f"Invalid action: {action}")
            
        return {
            'success': True,
            'fulfillment_action': action
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }