#!/usr/bin/env python3
"""
Training data verification and analysis tool using Supabase
"""

import os
import json
import argparse
from datetime import datetime
from supabase import create_client, Client
from collections import defaultdict
import pandas as pd
from typing import List, Dict, Any
import matplotlib.pyplot as plt
import seaborn as sns
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("training_verification.log"),
        logging.StreamHandler()
    ]
)

# Get Supabase credentials from environment variables
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")

class TrainingDataVerifier:
    def __init__(self):
        self.supabase: Client = None
        
    def connect(self):
        """Connect to Supabase"""
        self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
    def close(self):
        """Close Supabase connection"""
        self.supabase = None
            
    def get_training_stats(self) -> Dict[str, Any]:
        """Get overall training data statistics"""
        stats = {
            "total_examples": 0,
            "unique_queries": 0,
            "systems_distribution": defaultdict(int),
            "scenarios_distribution": defaultdict(int),
            "average_workflow_length": 0
        }
        
        try:
            # Get total examples
            result = self.supabase.table('training_data').select('*', count='exact').execute()
            stats["total_examples"] = result.count
            
            # Get unique queries
            result = self.supabase.table('training_data').select('query').execute()
            stats["unique_queries"] = len(set(row['query'] for row in result.data))
            
            # Get systems distribution
            result = self.supabase.table('training_data').select('systems').execute()
            for row in result.data:
                for system in row['systems']:
                    stats["systems_distribution"][system] += 1
                    
            # Get scenarios distribution
            result = self.supabase.table('training_data').select('metadata').execute()
            for row in result.data:
                scenario = row['metadata'].get('scenario')
                if scenario:
                    stats["scenarios_distribution"][scenario] += 1
                    
            # Get average workflow length
            result = self.supabase.table('training_data').select('workflow').execute()
            lengths = [len(row['workflow']) for row in result.data]
            stats["average_workflow_length"] = round(sum(lengths) / len(lengths), 2) if lengths else 0
            
        except Exception as e:
            logging.error(f"Error getting training stats: {str(e)}")
            raise
            
        return stats
        
    def analyze_query_quality(self, sample_size: int = 100) -> List[Dict[str, Any]]:
        """Analyze quality of generated queries"""
        try:
            # Get random sample
            result = self.supabase.table('training_data').select('*').limit(sample_size).execute()
            
            samples = []
            for row in result.data:
                query = row['query']
                response = row['response']
                systems = row['systems']
                workflow = row['workflow']
                metadata = row['metadata']
                
                # Basic quality metrics
                quality_score = 0
                quality_notes = []
                
                # Check query length
                if len(query.split()) < 5:
                    quality_notes.append("Query too short")
                elif len(query.split()) > 50:
                    quality_notes.append("Query too long")
                else:
                    quality_score += 1
                    
                # Check if query mentions all systems
                mentioned_systems = [s for s in systems if s.lower() in query.lower()]
                if len(mentioned_systems) == len(systems):
                    quality_score += 1
                else:
                    quality_notes.append(f"Missing systems: {set(systems) - set(mentioned_systems)}")
                    
                # Check response completeness
                if len(response.split()) > 100:
                    quality_score += 1
                else:
                    quality_notes.append("Response too short")
                    
                samples.append({
                    "query": query,
                    "response": response,
                    "systems": systems,
                    "workflow": workflow,
                    "metadata": metadata,
                    "quality_score": quality_score,
                    "quality_notes": quality_notes
                })
                
        except Exception as e:
            logging.error(f"Error analyzing query quality: {str(e)}")
            raise
            
        return samples
        
    def generate_visualizations(self, output_dir: str = "training_analysis"):
        """Generate visualizations of training data"""
        os.makedirs(output_dir, exist_ok=True)
        
        try:
            # Get systems distribution
            result = self.supabase.table('training_data').select('systems').execute()
            systems_data = []
            for row in result.data:
                for system in row['systems']:
                    systems_data.append({'System': system})
            
            # Create systems distribution plot
            plt.figure(figsize=(12, 6))
            systems_df = pd.DataFrame(systems_data)
            sns.countplot(data=systems_df, x='System')
            plt.xticks(rotation=45)
            plt.title('Distribution of Systems in Training Data')
            plt.tight_layout()
            plt.savefig(f"{output_dir}/systems_distribution.png")
            plt.close()
            
            # Get workflow length distribution
            result = self.supabase.table('training_data').select('workflow').execute()
            workflow_data = [{'Length': len(row['workflow'])} for row in result.data]
            
            # Create workflow length plot
            plt.figure(figsize=(10, 6))
            workflow_df = pd.DataFrame(workflow_data)
            sns.countplot(data=workflow_df, x='Length')
            plt.title('Distribution of Workflow Lengths')
            plt.tight_layout()
            plt.savefig(f"{output_dir}/workflow_lengths.png")
            plt.close()
            
        except Exception as e:
            logging.error(f"Error generating visualizations: {str(e)}")
            raise
            
    def export_sample(self, count: int = 100, output_file: str = "sample_training_data.json"):
        """Export a sample of training data for manual review"""
        try:
            result = self.supabase.table('training_data').select('*').limit(count).execute()
            
            samples = []
            for row in result.data:
                samples.append({
                    "query": row['query'],
                    "response": row['response'],
                    "systems": row['systems'],
                    "workflow": row['workflow'],
                    "metadata": row['metadata']
                })
                
            with open(output_file, 'w') as f:
                json.dump(samples, f, indent=2)
                
        except Exception as e:
            logging.error(f"Error exporting sample: {str(e)}")
            raise

def main():
    parser = argparse.ArgumentParser(description='Verify and analyze training data')
    parser.add_argument('--analyze', action='store_true', help='Analyze query quality')
    parser.add_argument('--visualize', action='store_true', help='Generate visualizations')
    parser.add_argument('--export', type=int, help='Export sample data (specify count)')
    args = parser.parse_args()
    
    verifier = TrainingDataVerifier()
    verifier.connect()
    
    try:
        # Get overall stats
        stats = verifier.get_training_stats()
        print("\nTraining Data Statistics:")
        print(f"Total Examples: {stats['total_examples']}")
        print(f"Unique Queries: {stats['unique_queries']}")
        print(f"Average Workflow Length: {stats['average_workflow_length']}")
        
        print("\nSystems Distribution:")
        for system, count in stats['systems_distribution'].items():
            print(f"{system}: {count}")
            
        if args.analyze:
            print("\nAnalyzing Query Quality...")
            samples = verifier.analyze_query_quality()
            
            quality_scores = [s['quality_score'] for s in samples]
            avg_quality = sum(quality_scores) / len(quality_scores)
            
            print(f"\nAverage Quality Score: {avg_quality:.2f}/3")
            print("\nQuality Issues:")
            for sample in samples:
                if sample['quality_notes']:
                    print(f"\nQuery: {sample['query'][:100]}...")
                    print(f"Issues: {', '.join(sample['quality_notes'])}")
                    
        if args.visualize:
            print("\nGenerating Visualizations...")
            verifier.generate_visualizations()
            print("Visualizations saved to training_analysis/")
            
        if args.export:
            print(f"\nExporting {args.export} samples...")
            verifier.export_sample(args.export)
            print("Sample data exported to sample_training_data.json")
            
    finally:
        verifier.close()

if __name__ == "__main__":
    main() 