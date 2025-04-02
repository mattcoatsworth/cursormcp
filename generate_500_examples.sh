#!/bin/bash

# Generate 500 training examples
echo "Generating 500 training examples..."

# Generate standard training data
echo "Generating standard training data..."
python fast_run_generator_loop.py --batch-size 25 --sleep-time 0.1

# Generate complex cross-system training data
echo "Generating complex cross-system training data..."
python generate_complex_cross_system_data.py --count 100 --batch-size 25

# Save progress to files
echo "Saving progress to generated_examples.json and complex_cross_system_examples.json..."

# Print summary
echo "Training data generation complete!"
echo "To view training data counts, run: python -c \"from supabase import create_client; import os; supabase = create_client(os.environ.get('SUPABASE_URL'), os.environ.get('SUPABASE_SERVICE_ROLE_KEY')); complex = supabase.table('training_data').select('id', count='exact').eq('tool', 'complex_interaction').execute(); print(f'Complex examples: {complex.count}')\""