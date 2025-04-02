#!/bin/bash

# Script to generate complex cross-system training data covering all 13 integrations
# Usage: ./generate_complex_data.sh [small|medium|large|massive]
#
# This script generates complex cross-system training examples that involve:
# - Multiple systems/services in a single query (18 different scenarios)
# - Sequential API calls that depend on each other
# - Complex workflows that require data from one system to be used in another

# Set default values
BATCH_SIZE=5
EXAMPLES_PER_SCENARIO=2
BATCHES=1
TEMPERATURE=0.8
SIZE="small"

# Parse command line argument
if [ $# -ge 1 ]; then
  SIZE=$1
fi

# Set configuration based on size
case $SIZE in
  "small")
    BATCH_SIZE=6
    EXAMPLES_PER_SCENARIO=2
    BATCHES=1
    echo "Running SMALL complex generation (approx. 12 examples)"
    ;;
  "medium")
    BATCH_SIZE=9
    EXAMPLES_PER_SCENARIO=2
    BATCHES=2
    echo "Running MEDIUM complex generation (approx. 36 examples)"
    ;;
  "large")
    BATCH_SIZE=9
    EXAMPLES_PER_SCENARIO=3
    BATCHES=3
    echo "Running LARGE complex generation (approx. 81 examples)"
    ;;
  "massive")
    BATCH_SIZE=18
    EXAMPLES_PER_SCENARIO=3
    BATCHES=2
    echo "Running MASSIVE complex generation (approx. 108 examples across all 18 scenarios)"
    ;;
  *)
    echo "Unknown size: $SIZE. Using small."
    ;;
esac

# Run the generator
echo "Starting complex cross-system data generation with:"
echo "- Batch size: $BATCH_SIZE scenarios"
echo "- Examples per scenario: $EXAMPLES_PER_SCENARIO"
echo "- Number of batches: $BATCHES"
echo "- Temperature: $TEMPERATURE"
echo ""

python3 generate_complex_cross_system_data.py \
  --batch-size $BATCH_SIZE \
  --examples-per-scenario $EXAMPLES_PER_SCENARIO \
  --batches $BATCHES \
  --temperature $TEMPERATURE

echo ""
echo "Generation complete!"
echo "To view training data count, run: python -c \"from supabase import create_client; import os; supabase = create_client(os.environ.get('SUPABASE_URL'), os.environ.get('SUPABASE_SERVICE_ROLE_KEY')); result = supabase.table('training_data').select('id', count='exact').eq('tool', 'complex_interaction').execute(); print(result.count)\""