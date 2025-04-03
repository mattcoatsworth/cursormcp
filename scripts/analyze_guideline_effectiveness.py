#!/usr/bin/env python3
"""
Script to analyze which system_training guidelines lead to the most effective responses.
This creates a feedback loop to refine the guidelines based on their effectiveness.
"""

import os
import json
import logging
import uuid
from typing import Dict, List, Any, Counter
from collections import defaultdict
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def connect_to_supabase() -> Client:
    """Connect to Supabase using environment variables"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set")
    
    return create_client(supabase_url, supabase_key)

def get_training_data(supabase: Client, limit: int = 1000) -> List[Dict[str, Any]]:
    """Fetch training data from the training_data table"""
    logger.info(f"Fetching up to {limit} training data entries")
    result = supabase.table('training_data').select('*').limit(limit).execute()
    
    if hasattr(result, 'error') and result.error:
        raise Exception(f"Error fetching training data: {result.error}")
    
    return result.data

def get_guidelines(supabase: Client) -> Dict[str, Dict[str, Any]]:
    """Fetch all guidelines from system_training table and index by ID"""
    logger.info("Fetching all guidelines from system_training table")
    result = supabase.table('system_training').select('*').execute()
    
    if hasattr(result, 'error') and result.error:
        raise Exception(f"Error fetching guidelines: {result.error}")
    
    # Index guidelines by ID for easier lookup
    guidelines_index = {}
    for guideline in result.data:
        guideline_id = guideline.get('id', '')
        if guideline_id:
            guidelines_index[guideline_id] = guideline
    
    return guidelines_index

def analyze_guideline_effectiveness(training_data: List[Dict[str, Any]], guidelines_index: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze which guidelines lead to the most effective responses"""
    # Initialize counters and metrics
    guideline_usage = Counter()
    guideline_effectiveness = defaultdict(lambda: {'count': 0, 'score': 0})
    category_effectiveness = defaultdict(lambda: {'count': 0, 'score': 0})
    
    # Process each training data entry
    for entry in training_data:
        # Skip entries without applied_guidelines
        if 'applied_guidelines' not in entry:
            continue
        
        applied_guidelines = entry['applied_guidelines']
        
        # Extract guideline IDs from all categories
        guideline_ids = []
        
        # General guidelines
        for guideline in applied_guidelines.get('general_guidelines', []):
            guideline_id = guideline.get('id', '')
            if guideline_id:
                guideline_ids.append(guideline_id)
        
        # Domain guidelines
        for guideline in applied_guidelines.get('domain_guidelines', []):
            guideline_id = guideline.get('id', '')
            if guideline_id:
                guideline_ids.append(guideline_id)
        
        # System guidelines
        for guideline in applied_guidelines.get('system_guidelines', []):
            guideline_id = guideline.get('id', '')
            if guideline_id:
                guideline_ids.append(guideline_id)
        
        # Skip if no guidelines were applied
        if not guideline_ids:
            continue
        
        # Calculate effectiveness score for this entry
        effectiveness_score = calculate_effectiveness_score(entry)
        
        # Update counters and metrics
        for guideline_id in guideline_ids:
            guideline_usage[guideline_id] += 1
            guideline_effectiveness[guideline_id]['count'] += 1
            guideline_effectiveness[guideline_id]['score'] += effectiveness_score
            
            # Update category effectiveness if guideline exists
            if guideline_id in guidelines_index:
                category = guidelines_index[guideline_id].get('category', 'unknown')
                category_effectiveness[category]['count'] += 1
                category_effectiveness[category]['score'] += effectiveness_score
    
    # Calculate average effectiveness scores
    for guideline_id, metrics in guideline_effectiveness.items():
        if metrics['count'] > 0:
            metrics['average_score'] = metrics['score'] / metrics['count']
    
    for category, metrics in category_effectiveness.items():
        if metrics['count'] > 0:
            metrics['average_score'] = metrics['score'] / metrics['count']
    
    # Prepare the analysis results
    analysis_results = {
        'guideline_usage': dict(guideline_usage),
        'guideline_effectiveness': dict(guideline_effectiveness),
        'category_effectiveness': dict(category_effectiveness),
        'recommendations': generate_recommendations(guideline_effectiveness, category_effectiveness, guidelines_index)
    }
    
    return analysis_results

def calculate_effectiveness_score(entry: Dict[str, Any]) -> float:
    """Calculate an effectiveness score for a training data entry"""
    score = 0.0
    
    # Check if the entry has execution_details
    if 'execution_details' in entry and entry['execution_details']:
        # If execution_details is present and not empty, add points
        score += 0.3
    
    # Check if the entry has follow-up queries
    if 'follow_up_queries' in entry and entry['follow_up_queries'] and len(entry['follow_up_queries']) > 0:
        # If follow-up queries are present, add points
        score += 0.2
    
    # Check if the entry has systems
    if 'systems' in entry and entry['systems'] and len(entry['systems']) > 0:
        # If systems are present, add points
        score += 0.2
    
    # Check if the entry has workflow
    if 'workflow' in entry and entry['workflow'] and len(entry['workflow']) > 0:
        # If workflow is present, add points
        score += 0.2
    
    # Check if the entry has metadata
    if 'metadata' in entry and entry['metadata']:
        # If metadata is present, add points
        score += 0.1
    
    return score

def generate_recommendations(guideline_effectiveness: Dict[str, Dict[str, Any]], 
                            category_effectiveness: Dict[str, Dict[str, Any]], 
                            guidelines_index: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Generate recommendations based on the analysis"""
    recommendations = []
    
    # Find the most effective guidelines
    sorted_guidelines = sorted(
        guideline_effectiveness.items(),
        key=lambda x: x[1].get('average_score', 0),
        reverse=True
    )
    
    # Add recommendations for the top 5 most effective guidelines
    for i, (guideline_id, metrics) in enumerate(sorted_guidelines[:5]):
        if guideline_id in guidelines_index:
            guideline = guidelines_index[guideline_id]
            recommendations.append({
                'type': 'guideline',
                'id': guideline_id,
                'category': guideline.get('category', 'unknown'),
                'name': guideline.get('name', 'unknown'),
                'effectiveness_score': metrics.get('average_score', 0),
                'usage_count': metrics.get('count', 0),
                'recommendation': f"Consider expanding guidelines in category '{guideline.get('category', 'unknown')}' based on the effectiveness of '{guideline.get('name', 'unknown')}'"
            })
    
    # Find the most effective categories
    sorted_categories = sorted(
        category_effectiveness.items(),
        key=lambda x: x[1].get('average_score', 0),
        reverse=True
    )
    
    # Add recommendations for the top 3 most effective categories
    for i, (category, metrics) in enumerate(sorted_categories[:3]):
        recommendations.append({
            'type': 'category',
            'category': category,
            'effectiveness_score': metrics.get('average_score', 0),
            'usage_count': metrics.get('count', 0),
            'recommendation': f"Focus on expanding guidelines in category '{category}' which shows high effectiveness"
        })
    
    # Find the least effective categories
    sorted_categories_reverse = sorted(
        category_effectiveness.items(),
        key=lambda x: x[1].get('average_score', 0)
    )
    
    # Add recommendations for the bottom 3 least effective categories
    for i, (category, metrics) in enumerate(sorted_categories_reverse[:3]):
        recommendations.append({
            'type': 'category',
            'category': category,
            'effectiveness_score': metrics.get('average_score', 0),
            'usage_count': metrics.get('count', 0),
            'recommendation': f"Review and improve guidelines in category '{category}' which shows low effectiveness"
        })
    
    return recommendations

def save_analysis_results(supabase: Client, analysis_results: Dict[str, Any]) -> None:
    """Save analysis results to a new table in Supabase"""
    logger.info("Saving analysis results to Supabase")
    
    # Create a new entry in the system_training table for the analysis results
    data = {
        'id': str(uuid.uuid4()),  # Generate a proper UUID
        'category': 'analysis',
        'name': 'Guideline Effectiveness Analysis',
        'description': 'Analysis of which system_training guidelines lead to the most effective responses',
        'guidelines': analysis_results,
        'tags': ['analysis', 'effectiveness', 'guidelines'],
        'source': ['system_training'],
        'version': 1,
        'is_active': True
    }
    
    result = supabase.table('system_training').insert(data).execute()
    
    if hasattr(result, 'error') and result.error:
        logger.error(f"Error saving analysis results: {result.error}")
    else:
        logger.info("Successfully saved analysis results")

def main():
    """Main function to analyze guideline effectiveness"""
    try:
        logger.info("Starting guideline effectiveness analysis")
        
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Get training data
        training_data = get_training_data(supabase)
        logger.info(f"Found {len(training_data)} training data entries")
        
        # Get guidelines
        guidelines_index = get_guidelines(supabase)
        logger.info(f"Found {len(guidelines_index)} guidelines")
        
        # Analyze guideline effectiveness
        analysis_results = analyze_guideline_effectiveness(training_data, guidelines_index)
        
        # Save analysis results
        save_analysis_results(supabase, analysis_results)
        
        # Print summary of recommendations
        logger.info("Analysis completed. Recommendations:")
        for i, recommendation in enumerate(analysis_results['recommendations']):
            logger.info(f"{i+1}. {recommendation['recommendation']}")
        
        logger.info("Guideline effectiveness analysis completed successfully")
        
    except Exception as e:
        logger.error(f"Error analyzing guideline effectiveness: {str(e)}")
        raise

if __name__ == "__main__":
    main() 