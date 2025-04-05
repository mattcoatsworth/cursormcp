"""
CLI script to generate training data and store it in Supabase.
"""
import argparse
from src.data_generation.generator import TrainingDataGenerator

def main():
    parser = argparse.ArgumentParser(description="Generate MCP training data and store in Supabase")
    parser.add_argument(
        "--count",
        type=int,
        default=10,
        help="Number of examples to generate per intent"
    )
    parser.add_argument(
        "--sleep",
        type=int,
        default=2,
        help="Seconds to wait between API calls"
    )
    
    args = parser.parse_args()
    
    print("MCP Training Data Generator")
    print("==========================")
    print(f"• Examples per intent: {args.count}")
    print(f"• Sleep time: {args.sleep}s")
    print("==========================\n")
    
    generator = TrainingDataGenerator()
    stats = generator.run_bulk_generation(
        count_per_intent=args.count,
        sleep_time=args.sleep
    )
    
    print("\n==========================")
    print("Generation Complete!")
    print("==========================")
    print(f"• Total generated: {stats['total_generated']} examples")
    print(f"• Total saved to Supabase: {stats['total_saved']} examples")
    
    if stats['errors']:
        print("\nErrors encountered:")
        for error in stats['errors']:
            print(f"• {error}")
    
    print("\nTool Statistics:")
    for tool, tool_stats in stats['tool_stats'].items():
        print(f"• {tool}:")
        print(f"  - Generated: {tool_stats['generated']}")
        print(f"  - Saved: {tool_stats['saved']}")
    print("==========================")

if __name__ == "__main__":
    main()
