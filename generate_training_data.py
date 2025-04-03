#!/usr/bin/env python3
"""
Script to generate training data responses following system_training guidelines,
track applied guidelines, and store everything in the training_data table.
"""

import os
import json
import uuid
import pytz
from datetime import datetime, timezone
from typing import Dict, List, Any
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def connect_to_supabase() -> Client:
    """Connect to Supabase using environment variables"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set")
    
    # Initialize Supabase client with proper configuration
    return create_client(
        supabase_url,
        supabase_key
    )

def get_system_guidelines(supabase: Client) -> Dict[str, Any]:
    """Fetch all system training guidelines"""
    print("\nFetching system guidelines...")
    result = supabase.table('system_training').select('*').execute()
    
    if hasattr(result, 'error') and result.error:
        raise Exception(f"Error fetching system guidelines: {result.error}")
        
    guidelines = {}
    for entry in result.data:
        # Skip duplicate system entries
        if entry['category'] == 'system' and 'system' in guidelines:
            continue
        guidelines[entry['category']] = entry
        print(f"Found guidelines for category: {entry['category']}")
    return guidelines

def get_executive_guidelines(supabase: Client) -> Dict[str, Any]:
    """Fetch executive perspective guidelines from system_training"""
    print("\nFetching executive perspective guidelines...")
    try:
        result = supabase.table('system_training').select('*').eq('category', 'executive_perspective').execute()
        
        if not result.data:
            raise Exception("No executive perspective guidelines found in system_training")
            
        return result.data[0]['guidelines']
    except Exception as e:
        print(f"Error fetching executive guidelines: {str(e)}")
        # Return default guidelines as fallback
        return {
            'query_transformation': {
                'operational_indicators': [
                    'how do i', 'how to', 'what is', 'where is', 'when should i',
                    'step by step', 'tutorial', 'guide', 'instructions',
                    'help me', 'tell me how', 'show me how'
                ],
                'executive_indicators': [
                    'strategy', 'roi', 'cost', 'revenue', 'growth',
                    'risk', 'performance', 'metrics', 'trends',
                    'optimization', 'efficiency', 'scale', 'expansion',
                    'competitive', 'market', 'strategic', 'investment',
                    'our', 'we', 'business', 'company'
                ],
                'transformations': {
                    'how do i': 'how can we',
                    'what is': "what's our strategy for",
                    'how to': 'how should we approach',
                    'tell me': 'what are our options for',
                    'show me': 'how can we analyze',
                    'where is': 'how should we track',
                    'when should i': 'when should our team',
                    'help me': 'what strategies exist for',
                    'i need': 'we need',
                    'my': 'our',
                    'i want': 'we aim',
                    'can i': 'can we'
                }
            }
        }

def validate_executive_perspective(query: str, guidelines: Dict[str, Any]) -> bool:
    """
    Check if query needs transformation to executive perspective.
    Returns False if transformation is needed, True if already executive.
    """
    query_lower = query.lower()
    
    # Get indicators from guidelines
    operational_indicators = guidelines['query_transformation']['operational_indicators']
    executive_indicators = guidelines['query_transformation']['executive_indicators']
    
    # If it has operational indicators or lacks executive indicators, 
    # it needs transformation
    needs_transformation = (
        any(indicator in query_lower for indicator in operational_indicators) or
        not any(indicator in query_lower for indicator in executive_indicators)
    )
    
    return not needs_transformation

def transform_to_executive_perspective(query: str, guidelines: Dict[str, Any]) -> str:
    """Transform any query into executive perspective using guidelines"""
    query_lower = query.lower()
    
    # Get transformations from guidelines
    transformations = guidelines['query_transformation']['transformations']
    
    # First try exact phrase transformations
    transformed = query
    for operational, executive in transformations.items():
        if query_lower.startswith(operational):
            transformed = executive + query[len(operational):]
            break
    
    # If no exact matches, try word replacements
    if transformed == query:
        for operational, executive in transformations.items():
            transformed = transformed.replace(operational, executive)
    
    # Add strategic context if missing
    strategic_contexts = [
        'from a business perspective',
        'strategically',
        'for our business',
        'for our company',
        'considering our growth goals'
    ]
    
    # If query doesn't have strategic indicators, add context
    if not any(context in transformed.lower() for context in strategic_contexts):
        # Add strategic context based on query content
        if 'cost' in transformed.lower() or 'price' in transformed.lower():
            transformed += ' considering our financial objectives'
        elif 'customer' in transformed.lower():
            transformed += ' to improve customer experience'
        elif 'system' in transformed.lower() or 'tech' in transformed.lower():
            transformed += ' to enhance our technical infrastructure'
        else:
            transformed += ' from a business perspective'
    
    return transformed

def determine_applicable_guidelines(query: str, guidelines: Dict[str, Any]) -> Dict[str, Any]:
    """Determine which guidelines apply to the query"""
    print(f"\nAnalyzing query: {query}")
    applicable = {
        'workflow_context': [],
        'execution_details': [],
        'metadata': {
            'query_type': 'executive_strategic',
            'complexity': 'standard',
            'requires_auth': False,
            'perspective': 'executive'
        }
    }
    
    query_lower = query.lower()
    
    # Business Impact Categories
    if any(term in query_lower for term in ['cost', 'revenue', 'profit', 'margin', 'investment']):
        applicable['workflow_context'].append({
            'type': 'business_metrics',
            'scope': 'financial_impact',
            'integration_points': ['financial_reporting', 'cost_analysis']
        })
    
    # Strategic Operations
    if any(term in query_lower for term in ['warehouse', '3pl', 'fulfillment', 'inventory', 'shipping']):
        applicable['workflow_context'].append({
            'type': 'operations_strategy',
            'scope': 'fulfillment_optimization',
            'integration_points': ['supply_chain', 'logistics_partners']
        })
    
    # Technology Strategy
    if any(term in query_lower for term in ['api', 'system', 'integration', 'platform']):
        applicable['workflow_context'].append({
            'type': 'technology_strategy',
            'scope': 'infrastructure_planning',
            'integration_points': ['tech_stack', 'vendor_management']
        })
        applicable['metadata']['requires_auth'] = True
    
    # Customer Insights
    if any(term in query_lower for term in ['customer', 'satisfaction', 'experience', 'retention']):
        applicable['workflow_context'].append({
            'type': 'customer_strategy',
            'scope': 'experience_optimization',
            'integration_points': ['analytics', 'feedback_systems']
        })
    
    # Risk Management
    if any(term in query_lower for term in ['risk', 'security', 'compliance', 'liability']):
        applicable['execution_details'].append({
            'type': 'risk_management',
            'priority': 'high',
            'requires_monitoring': True,
            'stakeholders': ['board', 'executive_team', 'legal']
        })
    
    # Set complexity based on scope
    if len(applicable['workflow_context']) > 1:
        applicable['metadata']['complexity'] = 'complex'
    
    # Ensure there's always a context
    if not applicable['workflow_context']:
        applicable['workflow_context'].append({
            'type': 'business_strategy',
            'scope': 'general_operations',
            'integration_points': ['executive_dashboard']
        })
    
    return applicable

def generate_response(query: str, applicable_guidelines: Dict[str, Any], guidelines: Dict[str, Any]) -> str:
    """Generate a response following the applicable guidelines"""
    print("\nGenerating response...")
    
    # Map query types to detailed responses
    response_templates = {
        # VIP Customer Analytics
        "vip_customer_journey": {
            "query": "What's the customer journey of our VIP customers?",
            "response": """Based on our analysis of VIP customer data across our integrated platforms:

1. Acquisition & First Purchase:
- Average time to first purchase: 3.2 days
- Primary acquisition channels: 
  * Direct traffic (45%)
  * Email marketing (25%)
  * Social media (20%)
  * Referrals (10%)

2. Purchase Behavior:
- Average order value: $450
- Purchase frequency: 4.8 times per year
- Lifetime value (LTV): $2,303
- Preferred payment methods:
  * Credit card (65%)
  * PayPal (25%)
  * Shop Pay (10%)

3. Engagement Metrics:
- Email open rate: 78%
- Click-through rate: 32%
- Social media engagement: 4.2x higher than regular customers
- Customer satisfaction score: 4.8/5

4. Key Touchpoints:
- Initial website visit → Email signup (2.1 days)
- First purchase → VIP status (3.2 days)
- Regular engagement → Loyalty program (5.4 days)

5. Retention & Loyalty:
- 12-month retention rate: 92%
- Referral rate: 35%
- Program participation: 88%

This data is sourced from our integrated platforms:
- Shopify: Purchase behavior and order data
- Klaviyo: Email engagement and customer journey
- Triple Whale: Attribution and LTV metrics
- Gorgias: Customer support interactions

Would you like me to dive deeper into any specific aspect of the VIP customer journey?""",
            "metadata": {
                "query_type": "vip_customer_journey",
                "complexity": "high",
                "context": "customer_analytics",
                "data_sources": ["shopify", "klaviyo", "triple_whale", "gorgias"]
            }
        },
        "vip_acquisition_channels": {
            "query": "Show me the acquisition channels and lifetime value of our VIP customers",
            "response": """Here's a detailed breakdown of VIP customer acquisition and value metrics:

1. Acquisition Channel Performance:
- Direct Traffic:
  * 45% of VIP customers
  * Average LTV: $2,450
  * Time to first purchase: 2.8 days

- Email Marketing:
  * 25% of VIP customers
  * Average LTV: $2,303
  * Time to first purchase: 3.2 days

- Social Media:
  * 20% of VIP customers
  * Average LTV: $2,150
  * Time to first purchase: 3.5 days

- Referrals:
  * 10% of VIP customers
  * Average LTV: $2,800
  * Time to first purchase: 2.5 days

2. Channel-Specific Metrics:
- Email Campaign Performance:
  * Open rate: 78%
  * Click-through rate: 32%
  * Conversion rate: 15%

- Social Media Engagement:
  * Instagram: 4.2x higher engagement
  * Facebook: 3.8x higher engagement
  * TikTok: 4.5x higher engagement

3. ROI by Channel:
- Direct Traffic: 4.2x ROI
- Email Marketing: 5.8x ROI
- Social Media: 3.9x ROI
- Referrals: 6.2x ROI

Data sourced from:
- Triple Whale: Attribution and LTV metrics
- Klaviyo: Email campaign performance
- Shopify: Purchase data
- Social media platforms: Engagement metrics

Would you like to explore any specific channel in more detail?""",
            "metadata": {
                "query_type": "vip_acquisition_channels",
                "complexity": "high",
                "context": "customer_analytics",
                "data_sources": ["triple_whale", "klaviyo", "shopify", "social_media"]
            }
        },
        "vip_time_to_purchase": {
            "query": "What's the average time to first purchase for our VIP segment?",
            "response": """Here's the detailed analysis of time to first purchase for our VIP customers:

1. Overall Metrics:
- Average time to first purchase: 3.2 days
- Median time to first purchase: 2.8 days
- 75th percentile: 4.1 days
- 90th percentile: 5.3 days

2. Breakdown by Acquisition Channel:
- Direct Traffic: 2.8 days
- Email Marketing: 3.2 days
- Social Media: 3.5 days
- Referrals: 2.5 days

3. Correlation with LTV:
- < 2 days: $2,800 average LTV
- 2-3 days: $2,450 average LTV
- 3-4 days: $2,303 average LTV
- 4-5 days: $2,150 average LTV
- > 5 days: $1,950 average LTV

4. Key Factors Affecting Time to Purchase:
- Email engagement: 78% open rate
- Website engagement: 4.2 pages per session
- Cart abandonment rate: 12%
- Return visitor rate: 65%

Data sourced from:
- Shopify: Purchase timing data
- Klaviyo: Email engagement metrics
- Triple Whale: Attribution data
- Google Analytics: Website behavior

Would you like to explore any specific aspect of the time to purchase analysis?""",
            "metadata": {
                "query_type": "vip_time_to_purchase",
                "complexity": "medium",
                "context": "customer_analytics",
                "data_sources": ["shopify", "klaviyo", "triple_whale", "google_analytics"]
            }
        },
        "vip_comparison": {
            "query": "How do our VIP customers compare to regular customers in terms of engagement and spending?",
            "response": """Here's a comprehensive comparison between VIP and regular customers:

1. Spending Metrics:
VIP Customers:
- Average order value: $450 (2.8x higher)
- Purchase frequency: 4.8 times/year (3.2x higher)
- Lifetime value: $2,303 (4.5x higher)
- Cart abandonment rate: 12% (2.3x lower)

Regular Customers:
- Average order value: $160
- Purchase frequency: 1.5 times/year
- Lifetime value: $512
- Cart abandonment rate: 28%

2. Engagement Metrics:
VIP Customers:
- Email open rate: 78% (2.1x higher)
- Click-through rate: 32% (2.8x higher)
- Social media engagement: 4.2x higher
- Customer satisfaction: 4.8/5 (0.8 points higher)

Regular Customers:
- Email open rate: 37%
- Click-through rate: 11%
- Social media engagement: Baseline
- Customer satisfaction: 4.0/5

3. Loyalty Metrics:
VIP Customers:
- 12-month retention: 92% (2.4x higher)
- Referral rate: 35% (3.5x higher)
- Program participation: 88% (4.4x higher)
- Return rate: 8% (2.5x lower)

Regular Customers:
- 12-month retention: 38%
- Referral rate: 10%
- Program participation: 20%
- Return rate: 20%

4. Customer Journey:
VIP Customers:
- Time to first purchase: 3.2 days
- Average session duration: 8.5 minutes
- Pages per session: 4.2
- Mobile vs desktop: 65% mobile

Regular Customers:
- Time to first purchase: 5.8 days
- Average session duration: 4.2 minutes
- Pages per session: 2.8
- Mobile vs desktop: 55% mobile

Data sourced from:
- Shopify: Purchase and return data
- Klaviyo: Email engagement metrics
- Triple Whale: Attribution and LTV data
- Gorgias: Customer satisfaction scores
- Google Analytics: Website behavior

Would you like to explore any specific aspect of this comparison in more detail?""",
            "metadata": {
                "query_type": "vip_comparison",
                "complexity": "high",
                "context": "customer_analytics",
                "data_sources": ["shopify", "klaviyo", "triple_whale", "gorgias", "google_analytics"]
            }
        },
        "vip_touchpoints": {
            "query": "What are the key touchpoints in our VIP customer journey?",
            "response": """Here's a detailed analysis of key touchpoints in the VIP customer journey:

1. Initial Engagement:
- First website visit → Email signup: 2.1 days
- Email signup → First purchase: 3.2 days
- First purchase → VIP status: Immediate
- VIP status → Loyalty program: 5.4 days

2. Communication Touchpoints:
- Welcome email: 100% delivery rate, 82% open rate
- VIP program introduction: 95% delivery rate, 78% open rate
- Personalized recommendations: 4.2x higher engagement
- Birthday/anniversary communications: 88% engagement rate

3. Purchase Journey:
- Cart creation → Purchase: 2.8 hours
- Abandoned cart recovery: 65% success rate
- Post-purchase follow-up: 92% satisfaction rate
- Product review requests: 78% response rate

4. Support Interactions:
- Average response time: 1.2 hours
- Resolution rate: 98%
- Customer satisfaction: 4.8/5
- Support ticket volume: 2.3x lower than regular customers

5. Loyalty Program Engagement:
- Points earning: 4.8x higher than regular customers
- Points redemption: 3.2x higher than regular customers
- Special event participation: 88% attendance rate
- Referral program: 35% participation rate

6. Digital Engagement:
- Mobile app usage: 4.2x higher than regular customers
- Social media interaction: 4.5x higher engagement
- Website visits: 3.8x more frequent
- Session duration: 2.1x longer

Data sourced from:
- Klaviyo: Email engagement and journey data
- Shopify: Purchase and cart data
- Gorgias: Support interaction metrics
- Triple Whale: Attribution and engagement data
- Mobile app analytics: Usage statistics

Would you like to explore any specific touchpoint in more detail?""",
            "metadata": {
                "query_type": "vip_touchpoints",
                "complexity": "high",
                "context": "customer_analytics",
                "data_sources": ["klaviyo", "shopify", "gorgias", "triple_whale", "mobile_app"]
            }
        },
        'shopify': {
            'order_status': "I'll check the order status using the Shopify Orders API endpoint. This will provide real-time order information including fulfillment status and tracking details.",
            'inventory': "I'll query the Shopify Inventory API to get current stock levels across all locations. This includes available inventory, reserved stock, and low stock alerts.",
            'sales_data': "I'll retrieve sales data from the Shopify Analytics API, which includes revenue, order volume, and product performance metrics."
        },
        'woocommerce': {
            'product_prices': "I'll use the WooCommerce Products API to update pricing. This endpoint allows bulk price updates and supports scheduled price changes.",
            'order_volume': "I'll query the WooCommerce Orders API to analyze order volume trends and patterns.",
            'customer_data': "I'll access customer information through the WooCommerce Customers API, which provides detailed customer profiles and purchase history."
        },
        'amazon': {
            'inventory_sync': "I'll use the Amazon Selling Partner API to sync inventory levels. This includes the Inventory API for stock updates and the Fulfillment API for order management.",
            'seller_performance': "I'll retrieve seller metrics from the Amazon Selling Partner API's Performance Reports endpoint.",
            'order_details': "I'll fetch order information using the Amazon Orders API, which provides comprehensive order data including shipping and tracking details."
        },
        'ebay': {
            'list_products': "I'll use the eBay Inventory API to create and update product listings. This includes the Inventory API for stock management and the Marketing API for promotions.",
            'sales_performance': "I'll analyze sales data through the eBay Analytics API, which provides detailed performance metrics and trends.",
            'inventory_status': "I'll check inventory levels using the eBay Inventory API, which shows current stock levels and listing status across all eBay marketplaces."
        },
        'walmart': {
            'product_listings': "I'll update product information using the Walmart Marketplace API. This includes the Items API for product details and the Inventory API for stock levels.",
            'marketplace_performance': "I'll retrieve performance metrics from the Walmart Analytics API, which provides sales and inventory analytics.",
            'order_history': "I'll access order data through the Walmart Orders API, which includes order status, shipping details, and customer information."
        },
        'quickbooks': {
            'sync_sales': "I'll use the QuickBooks API to sync sales data. This includes the Sales API for transaction data and the Sync API for real-time updates.",
            'transaction_status': "I'll check transaction status through the QuickBooks Transactions API, which provides detailed financial records.",
            'financial_reports': "I'll generate reports using the QuickBooks Reports API, which includes standard financial reports and custom analytics."
        },
        'shipstation': {
            'shipping_labels': "I'll create shipping labels using the ShipStation Shipping API. This includes label generation, rate shopping, and tracking information.",
            'shipping_volume': "I'll analyze shipping volume through the ShipStation Analytics API, which provides detailed shipping metrics and trends.",
            'tracking_data': "I'll retrieve tracking information using the ShipStation Tracking API, which provides real-time shipment status and delivery updates."
        },
        '3pl': {
            'inventory_levels': "I'll check inventory levels using the 3PL Inventory API. This provides real-time stock levels and warehouse status.",
            'fulfillment_rate': "I'll analyze fulfillment performance through the 3PL Analytics API, which tracks order processing and shipping metrics.",
            'shipping_status': "I'll check shipping status using the 3PL Tracking API, which provides detailed shipment information and delivery updates."
        },
        'email_marketing': {
            'campaign_emails': "I'll send campaign emails using the Email Marketing API. This includes campaign creation, scheduling, and audience targeting.",
            'campaign_performance': "I'll analyze campaign metrics through the Email Analytics API, which provides detailed performance data and engagement rates.",
            'subscriber_analytics': "I'll retrieve subscriber data using the Subscriber API, which includes engagement metrics and list management tools."
        },
        'crm': {
            'customer_records': "I'll update customer records using the CRM API. This includes contact management, interaction history, and customer profiles.",
            'engagement_rate': "I'll analyze engagement through the CRM Analytics API, which tracks customer interactions and relationship metrics.",
            'interaction_history': "I'll retrieve interaction data using the CRM History API, which provides detailed customer communication records."
        },
        'analytics': {
            'sales_reports': "I'll generate sales reports using the Analytics API. This includes revenue tracking, order analysis, and performance metrics.",
            'conversion_rate': "I'll analyze conversion data through the Analytics Conversion API, which tracks sales funnel performance and optimization opportunities.",
            'traffic_analytics': "I'll retrieve traffic data using the Analytics Traffic API, which provides detailed visitor behavior and site performance metrics."
        },
        'payment_gateway': {
            'process_refunds': "I'll process refunds using the Payment Gateway API. This includes transaction management, refund processing, and payment reconciliation.",
            'success_rate': "I'll analyze payment success rates through the Payment Analytics API, which tracks transaction performance and error rates.",
            'transaction_history': "I'll retrieve transaction data using the Payment History API, which provides detailed payment records and financial reconciliation."
        },
        'social_media': {
            'post_content': "I'll post content using the Social Media API. This includes content creation, scheduling, and engagement management.",
            'social_engagement': "I'll analyze engagement through the Social Analytics API, which tracks audience interaction and content performance.",
            'social_analytics': "I'll retrieve analytics data using the Social Metrics API, which provides detailed performance metrics and audience insights."
        },
        'inventory_management': {
            'stock_levels': "I'll update stock levels using the Inventory Management API. This includes real-time stock updates and inventory synchronization.",
            'turnover_rate': "I'll analyze inventory turnover through the Inventory Analytics API, which tracks stock movement and optimization metrics.",
            'stock_alerts': "I'll check stock alerts using the Inventory Alerts API, which provides low stock notifications and reorder recommendations."
        },
        'customer_support': {
            'support_tickets': "I'll create support tickets using the Customer Support API. This includes ticket management, response tracking, and resolution monitoring.",
            'resolution_rate': "I'll analyze resolution metrics through the Support Analytics API, which tracks ticket handling and customer satisfaction.",
            'customer_feedback': "I'll retrieve feedback data using the Support Feedback API, which provides customer satisfaction metrics and improvement opportunities."
        },
        'accounting': {
            'sync_financial': "I'll sync financial data using the Accounting API. This includes transaction synchronization and financial record management.",
            'revenue_trend': "I'll analyze revenue trends through the Financial Analytics API, which tracks income patterns and growth metrics.",
            'financial_reports': "I'll generate reports using the Financial Reports API, which provides standard accounting reports and custom financial analytics."
        },
        # Strategic Business Operations
        "market_position": {
            "query": "What's our current market position and competitive advantage in our key segments?",
            "response": """Based on our market analysis across integrated platforms:

1. Market Position:
- Market share: 15% in primary segment
- Growth rate: 28% YoY
- Brand recognition: 65% in target market
- Customer satisfaction: 4.8/5

2. Competitive Advantages:
- Integrated platform ecosystem
- Advanced analytics capabilities
- Strong customer loyalty program
- Efficient supply chain

3. Key Segments Performance:
- Enterprise: 35% revenue growth
- Mid-market: 42% revenue growth
- SMB: 28% revenue growth

4. Market Opportunities:
- Emerging markets: 45% growth potential
- New product categories: 38% expansion opportunity
- Digital transformation: 52% market readiness

Data sourced from:
- Market research platforms
- Internal analytics
- Customer feedback systems
- Industry reports

Would you like to explore any specific aspect of our market position?""",
            "metadata": {
                "query_type": "market_analysis",
                "complexity": "high",
                "context": "business_strategy",
                "data_sources": ["market_research", "analytics", "customer_feedback"]
            }
        },
    }
    
    # Determine the most relevant template based on query content
    query_lower = query.lower()
    best_match = None
    best_match_score = 0
    
    for template_key, template in response_templates.items():
        # Calculate match score based on keyword overlap
        template_keywords = set(template["query"].lower().split())
        query_keywords = set(query_lower.split())
        overlap = len(template_keywords.intersection(query_keywords))
        score = overlap / len(template_keywords)
        
        if score > best_match_score:
            best_match_score = score
            best_match = template
    
    if best_match and best_match_score > 0.3:  # Threshold for minimum match
        return best_match["response"], best_match["metadata"]
    
    # Default response if no specific template matches
    return f"""Based on our analysis of the query "{query}", here are the key insights:

1. Strategic Impact:
- Business value: High
- Implementation complexity: Medium
- Time to value: 3-6 months

2. Key Considerations:
- Market position
- Competitive advantage
- Resource allocation
- Risk management

3. Recommended Actions:
- Conduct thorough analysis
- Develop implementation plan
- Set clear metrics
- Monitor progress

4. Success Metrics:
- Revenue impact
- Market share
- Customer satisfaction
- Operational efficiency

Would you like me to elaborate on any specific aspect of this analysis?""", {
        "query_type": "general",
        "complexity": "medium",
        "context": "strategic_analysis"
    }

def store_training_data(supabase: Client, query: str, response: str, 
                       applicable_guidelines: Dict[str, Any], version: str = "1.0") -> None:
    """Store the generated response and metadata in training_data table"""
    print("\nStoring training data...")
    
    # Determine primary category from guidelines
    category = "system"
    if applicable_guidelines['workflow_context']:
        category = applicable_guidelines['workflow_context'][0]['type']
    
    # Get current time in EST with 12-hour format
    est = pytz.timezone('America/New_York')
    current_time = datetime.now(est).replace(year=datetime.now().year)
    formatted_time = current_time.strftime("%Y-%m-%d %I:%M:%S %p EST")
    
    training_data = {
        'id': str(uuid.uuid4()),
        'tool': 'system',
        'intent': 'response',
        'query': query,
        'response': response,
        'applied_guidelines': applicable_guidelines,
        'timestamp': formatted_time,
        'version': version,
        'source': ['system_generated'],
        'is_active': True
    }
    
    print("Training data to store:")
    print(json.dumps(training_data, indent=2))
    
    result = supabase.table('training_data').insert(training_data).execute()
    
    if hasattr(result, 'error') and result.error:
        raise Exception(f"Error storing training data: {result.error}")
    print("Successfully stored training data")

def process_training_query(query: str, version: str = "1.0"):
    """Process a training query and store the result"""
    try:
        print(f"\n{'='*50}")
        print(f"Original query: {query}")
        
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Get executive guidelines
        executive_guidelines = get_executive_guidelines(supabase)
        
        # Always transform if not in executive perspective
        if not validate_executive_perspective(query, executive_guidelines):
            transformed_query = transform_to_executive_perspective(query, executive_guidelines)
            print(f"Transformed to executive perspective: {transformed_query}")
            query = transformed_query
        
        print(f"Processing query: {query}")
        print(f"{'='*50}")
        
        # Get system guidelines
        guidelines = get_system_guidelines(supabase)
        
        # Determine applicable guidelines
        applicable_guidelines = determine_applicable_guidelines(query, guidelines)
        
        # Generate response
        response, metadata = generate_response(query, applicable_guidelines, guidelines)
        
        # Store in training_data table
        store_training_data(supabase, query, response, applicable_guidelines, version)
        
        print("\nSummary:")
        print(f"Query: {query}")
        print(f"Response: {response}")
        print("Applied guidelines:")
        print(json.dumps(applicable_guidelines, indent=2))
        print(f"{'='*50}\n")
        
    except Exception as e:
        print(f"\nError processing query: {str(e)}")
        if hasattr(e, 'response'):
            print(f"Response: {e.response.text if hasattr(e.response, 'text') else e.response}")

def main():
    """Main function"""
    # Example queries to process from e-commerce executive perspective
    example_queries = [
        # VIP Customer Analytics
        "What's the customer journey of our VIP customers?",
        "Show me the acquisition channels and lifetime value of our VIP customers",
        "What's the average time to first purchase for our VIP segment?",
        "How do our VIP customers compare to regular customers in terms of engagement and spending?",
        "What are the key touchpoints in our VIP customer journey?",
        
        # Strategic Business Operations
        "What's our current market position and competitive advantage in our key segments?",
        "How can we optimize our supply chain to reduce costs while maintaining service quality?",
        "What are the growth opportunities in our current customer base?",
        
        # Financial Strategy
        "What's our ROI across different marketing channels and how can we optimize spend?",
        "How can we improve our working capital efficiency and cash flow management?",
        "What's our pricing strategy effectiveness and where can we optimize margins?",
        
        # Customer Experience & Growth
        "How can we enhance customer lifetime value through improved retention strategies?",
        "What are the key drivers of customer satisfaction and how can we improve them?",
        "How can we expand our market share in underserved customer segments?",
        
        # Technology & Innovation
        "What's our technology roadmap for scaling operations efficiently?",
        "How can we leverage data analytics to drive better business decisions?",
        "What are the key risks in our current tech stack and how can we mitigate them?",
        
        # Risk Management
        "What are our key operational risks and how can we strengthen our risk management?",
        "How can we ensure compliance while maintaining operational efficiency?",
        "What's our disaster recovery strategy and how can we improve it?",
        
        # Market Strategy
        "What are the emerging market trends we should capitalize on?",
        "How can we differentiate our brand in a crowded market?",
        "What's our expansion strategy for new market opportunities?",
        
        # Performance Metrics
        "What are our key performance indicators and how can we improve them?",
        "How can we better align our metrics with strategic objectives?",
        "What's our benchmarking strategy against industry standards?",
        
        # Team & Culture
        "How can we build a more resilient and innovative organizational culture?",
        "What's our talent acquisition and retention strategy?",
        "How can we improve cross-functional collaboration and efficiency?",
        
        # Product Strategy
        "What's our product portfolio strategy and how can we optimize it?",
        "How can we improve our product development process?",
        "What are the opportunities for product innovation and differentiation?",
        
        # Operational Excellence
        "How can we achieve better operational efficiency across our value chain?",
        "What's our strategy for continuous improvement in core processes?",
        "How can we better balance cost control with service quality?",
        
        # Digital Transformation
        "What's our digital transformation roadmap and how can we accelerate it?",
        "How can we better leverage automation to improve efficiency?",
        "What are the key digital capabilities we need to develop?",
        
        # Customer Insights
        "How can we better understand and anticipate customer needs?",
        "What are the key customer segments we should focus on?",
        "How can we improve our customer feedback and insights process?",
        
        # Supply Chain Strategy
        "What's our supply chain optimization strategy?",
        "How can we improve supplier relationships and performance?",
        "What are the key supply chain risks and how can we address them?",
        
        # Marketing Strategy
        "What's our integrated marketing strategy and how can we improve it?",
        "How can we better measure marketing ROI and effectiveness?",
        "What are the key marketing channels we should focus on?",
        
        # Financial Planning
        "What's our long-term financial strategy and how can we improve it?",
        "How can we optimize our capital structure and funding strategy?",
        "What are the key financial metrics we should track and improve?"
    ]
    
    print("Starting training data generation...")
    for query in example_queries:
        process_training_query(query)
    print("\nProcessing completed")

if __name__ == "__main__":
    main() 