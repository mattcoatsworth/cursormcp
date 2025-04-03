import os
import json
import logging
import argparse
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role key for admin access
supabase: Client = create_client(supabase_url, supabase_key)

class TrainingDataAnalyzer:
    def __init__(self):
        self.supabase = supabase

    def get_training_data(self, limit: int = 100) -> List[Dict]:
        """Fetch training data from Supabase."""
        try:
            response = self.supabase.table('training_data').select('*').limit(limit).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching training data: {str(e)}")
            return []

    def analyze_ratings(self, data: List[Dict]) -> Dict:
        """Analyze ratings and feedback from training data."""
        analysis = {
            'old_ratings': {
                'feedback_score': {'count': 0, 'total': 0, 'average': 0},
                'rating': {'count': 0, 'total': 0, 'average': 0}
            },
            'new_ratings': {
                'query_ratings': {'count': 0, 'total': 0, 'average': 0},
                'response_ratings': {'count': 0, 'total': 0, 'average': 0},
                'endpoint_ratings': {'count': 0, 'total': 0, 'average': 0}
            },
            'feedback_counts': {
                'old': {
                    'feedback_notes': {},
                    'feedback': {}
                },
                'new': {
                    'query': {},
                    'response': {},
                    'endpoint': {}
                }
            }
        }

        for item in data:
            # Analyze old ratings
            if item.get('feedback_score') is not None:
                analysis['old_ratings']['feedback_score']['count'] += 1
                analysis['old_ratings']['feedback_score']['total'] += item['feedback_score']
            
            if item.get('rating') is not None:
                analysis['old_ratings']['rating']['count'] += 1
                analysis['old_ratings']['rating']['total'] += item['rating']
            
            # Analyze new ratings
            if item.get('query_rating') is not None:
                analysis['new_ratings']['query_ratings']['count'] += 1
                analysis['new_ratings']['query_ratings']['total'] += item['query_rating']
            
            if item.get('response_rating') is not None:
                analysis['new_ratings']['response_ratings']['count'] += 1
                analysis['new_ratings']['response_ratings']['total'] += item['response_rating']
            
            if item.get('endpoint_rating') is not None:
                analysis['new_ratings']['endpoint_ratings']['count'] += 1
                analysis['new_ratings']['endpoint_ratings']['total'] += item['endpoint_rating']
            
            # Analyze old feedback
            for feedback_type in ['feedback_notes', 'feedback']:
                feedback = item.get(feedback_type)
                if feedback:
                    if feedback not in analysis['feedback_counts']['old'][feedback_type]:
                        analysis['feedback_counts']['old'][feedback_type][feedback] = 0
                    analysis['feedback_counts']['old'][feedback_type][feedback] += 1
            
            # Analyze new feedback
            for feedback_type in ['query', 'response', 'endpoint']:
                feedback = item.get(f'{feedback_type}_feedback')
                if feedback:
                    if feedback not in analysis['feedback_counts']['new'][feedback_type]:
                        analysis['feedback_counts']['new'][feedback_type][feedback] = 0
                    analysis['feedback_counts']['new'][feedback_type][feedback] += 1

        # Calculate averages for old ratings
        for rating_type in ['feedback_score', 'rating']:
            if analysis['old_ratings'][rating_type]['count'] > 0:
                analysis['old_ratings'][rating_type]['average'] = (
                    analysis['old_ratings'][rating_type]['total'] / 
                    analysis['old_ratings'][rating_type]['count']
                )

        # Calculate averages for new ratings
        for rating_type in ['query_ratings', 'response_ratings', 'endpoint_ratings']:
            if analysis['new_ratings'][rating_type]['count'] > 0:
                analysis['new_ratings'][rating_type]['average'] = (
                    analysis['new_ratings'][rating_type]['total'] / 
                    analysis['new_ratings'][rating_type]['count']
                )

        return analysis

    def generate_report(self, analysis: Dict) -> str:
        """Generate a report from the analysis."""
        report = []
        report.append("Training Data Analysis Report")
        report.append("=" * 30)
        report.append(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

        # Old ratings section
        report.append("Old Ratings Analysis")
        report.append("-" * 20)
        for rating_type in ['feedback_score', 'rating']:
            report.append(f"{rating_type.replace('_', ' ').title()}:")
            report.append(f"  Total rated: {analysis['old_ratings'][rating_type]['count']}")
            report.append(f"  Average rating: {analysis['old_ratings'][rating_type]['average']:.2f}\n")

        # New ratings section
        report.append("New Ratings Analysis")
        report.append("-" * 20)
        for rating_type in ['query_ratings', 'response_ratings', 'endpoint_ratings']:
            name = rating_type.replace('_ratings', '').title()
            report.append(f"{name} Ratings:")
            report.append(f"  Total rated: {analysis['new_ratings'][rating_type]['count']}")
            report.append(f"  Average rating: {analysis['new_ratings'][rating_type]['average']:.2f}\n")

        # Old feedback section
        report.append("Old Feedback Analysis")
        report.append("-" * 20)
        for feedback_type in ['feedback_notes', 'feedback']:
            report.append(f"{feedback_type.replace('_', ' ').title()}:")
            for feedback, count in analysis['feedback_counts']['old'][feedback_type].items():
                report.append(f"  - {feedback}: {count} occurrences")
            report.append("")

        # New feedback section
        report.append("New Feedback Analysis")
        report.append("-" * 20)
        for feedback_type in ['query', 'response', 'endpoint']:
            report.append(f"{feedback_type.title()} Feedback:")
            for feedback, count in analysis['feedback_counts']['new'][feedback_type].items():
                report.append(f"  - {feedback}: {count} occurrences")
            report.append("")

        return "\n".join(report)

    def save_report(self, report: str, filename: str = "training_data_analysis_report.txt"):
        """Save the analysis report to a file."""
        try:
            with open(filename, 'w') as f:
                f.write(report)
            logger.info(f"Report saved to {filename}")
        except Exception as e:
            logger.error(f"Error saving report: {str(e)}")

def get_unanalyzed_training_data(limit: int = 10) -> List[Dict[str, Any]]:
    """Get training data entries that have either a rating or feedback."""
    try:
        # Get entries where either rating or feedback is not null
        result = supabase.table('training_data').select('*').or_(
            'rating.is.not.null,feedback.is.not.null'
        ).limit(limit).execute()
        return result.data
    except Exception as e:
        logger.error(f"Error getting training data: {str(e)}")
        return []

def update_training_data_with_rating(training_id: int, rating: int, feedback: str) -> bool:
    """Update training data with rating and feedback."""
    try:
        supabase.table('training_data').update({
            'rating': rating,
            'feedback': feedback
        }).eq('id', training_id).execute()
        return True
    except Exception as e:
        logger.error(f"Error updating training data: {str(e)}")
        return False

def create_system_training_entry(training_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a system training entry from training data."""
    return {
        'category': training_data.get('category', 'general'),
        'guidelines': {
            'query': training_data.get('query', ''),
            'response': training_data.get('response', ''),
            'rating': training_data.get('rating', 0),
            'feedback': training_data.get('feedback', '')
        },
        'is_active': True
    }

def insert_into_system_training(system_training_entry: Dict[str, Any]) -> bool:
    """Insert a system training entry into the system_training table."""
    try:
        supabase.table('system_training').insert(system_training_entry).execute()
        return True
    except Exception as e:
        logger.error(f"Error inserting into system_training: {str(e)}")
        return False

def analyze_training_data_interactive():
    """Interactively analyze training data."""
    print("\n=== Training Data Analysis Tool ===")
    print("This tool will help you review and update ratings and feedback on training data entries.")
    print("For each entry, you'll need to:")
    print("1. Review the current rating and feedback (if any)")
    print("2. Update the rating (1-10) if needed")
    print("3. Update the feedback if needed")
    print("4. Press Enter to continue to the next entry")
    print("\nPress Enter to start...")
    input()

    while True:
        # Get training data entries
        training_data_entries = get_unanalyzed_training_data(limit=1)
        
        if not training_data_entries:
            print("\nNo more training data entries found.")
            break
        
        entry = training_data_entries[0]
        
        # Display training data entry
        print("\n" + "="*80)
        print("Training Data Entry:")
        print("-"*80)
        print(f"ID: {entry.get('id', 'N/A')}")
        print(f"Intent: {entry.get('intent', 'N/A')}")
        print(f"Category: {entry.get('category', 'N/A')}")
        print(f"Query: {entry.get('query', 'N/A')}")
        print(f"Response: {entry.get('response', 'N/A')}")
        print(f"Current Rating: {entry.get('rating', 'Not rated')}")
        print(f"Current Feedback: {entry.get('feedback', 'No feedback')}")
        print("-"*80)
        
        # Get rating
        while True:
            try:
                rating_input = input("\nEnter new rating (1-10) or press Enter to keep current: ")
                if rating_input == "":
                    rating = entry.get('rating')
                    if rating is None:
                        print("No current rating. Please enter a rating (1-10).")
                        continue
                    break
                rating = int(rating_input)
                if 1 <= rating <= 10:
                    break
                print("Rating must be between 1 and 10.")
            except ValueError:
                print("Please enter a valid number.")
        
        # Get feedback
        feedback_input = input("\nEnter new feedback (press Enter to keep current): ")
        feedback = feedback_input if feedback_input else entry.get('feedback', '')
        
        # Update training data
        if update_training_data_with_rating(entry['id'], rating, feedback):
            print("\n✅ Rating and feedback updated successfully.")
            
            # If rating is high enough, move to system_training
            if rating >= 8:
                system_training_entry = create_system_training_entry(entry)
                if insert_into_system_training(system_training_entry):
                    print("✅ Entry moved to system_training table.")
                else:
                    print("❌ Failed to move entry to system_training table.")
        else:
            print("\n❌ Failed to update rating and feedback.")
        
        # Ask if user wants to continue
        continue_analysis = input("\nPress Enter to analyze next entry, or 'q' to quit: ")
        if continue_analysis.lower() == 'q':
            break

def analyze_training_data_batch(training_ids: List[int], ratings: List[int], feedbacks: List[str]):
    """Analyze training data in batch mode."""
    if len(training_ids) != len(ratings) or len(training_ids) != len(feedbacks):
        logger.error("Number of training IDs, ratings, and feedbacks must match")
        return False
    
    success = True
    for training_id, rating, feedback in zip(training_ids, ratings, feedbacks):
        if not update_training_data_with_rating(training_id, rating, feedback):
            success = False
    
    return success

def main():
    parser = argparse.ArgumentParser(description='Analyze training data and update ratings/feedback')
    parser.add_argument('--interactive', action='store_true', help='Run in interactive mode')
    parser.add_argument('--training-ids', type=int, nargs='+', help='List of training data IDs')
    parser.add_argument('--ratings', type=int, nargs='+', help='List of ratings (1-10)')
    parser.add_argument('--feedbacks', type=str, nargs='+', help='List of feedback comments')
    
    args = parser.parse_args()
    
    if args.interactive:
        analyze_training_data_interactive()
    elif args.training_ids and args.ratings and args.feedbacks:
        if analyze_training_data_batch(args.training_ids, args.ratings, args.feedbacks):
            logger.info("Successfully analyzed training data in batch mode")
        else:
            logger.error("Failed to analyze some training data entries")
    else:
        parser.print_help()

if __name__ == "__main__":
    main() 