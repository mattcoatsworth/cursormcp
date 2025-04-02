#!/bin/bash

# Generate training data using the fast generator
echo "Generating training data..."
python fast_run_generator_loop.py --batch-size 25 --sleep-time 0.1

# Save progress to file
echo "Saving progress to generated_examples.json..."

# Print summary
echo "Training data generation complete!"
echo "To view training data count, run: python -c \"from supabase import create_client; import os; supabase = create_client(os.environ.get('SUPABASE_URL'), os.environ.get('SUPABASE_SERVICE_ROLE_KEY')); result = supabase.table('training_data').select('id', count='exact').execute(); print(result.count)\""