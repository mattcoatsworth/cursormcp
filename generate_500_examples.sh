#!/bin/bash

# Script to generate 500 cross-system training examples
# This is a specialized script for generating a large dataset quickly

echo "=== GENERATING 500 CROSS-SYSTEM TRAINING EXAMPLES ==="
echo "This will generate approximately 500 complex cross-system examples"
echo "across all 18 integrated scenarios. This process may take some time."
echo ""

# First check for required API keys
# Environment variables are already set properly, but keep this for portability
if [[ -z "${OPENAI_API_KEY}" && -z "${replit_OPENAI_API_KEY}" ]]; then
  echo "ERROR: OPENAI_API_KEY environment variable is not set."
  echo "Please set this environment variable and try again."
  exit 1
fi

if [[ -z "${DATABASE_URL}" && -z "${replit_DATABASE_URL}" ]]; then
  echo "ERROR: DATABASE_URL environment variable is not set."
  echo "Please set this environment variable and try again."
  exit 1
fi

# Define generation parameters for 500 examples
# We'll do 18 scenarios with ~28 examples each (~504 total)
BATCH_SIZE=18  # Use all scenarios
EXAMPLES_PER_SCENARIO=7
BATCHES=4   # Run 4 batches of all scenarios
TEMPERATURE=0.8

echo "Starting massive cross-system data generation with:"
echo "- Using all 18 scenarios in each batch"
echo "- Generating $EXAMPLES_PER_SCENARIO examples per scenario"
echo "- Running $BATCHES batches"
echo "- Temperature: $TEMPERATURE"
echo "- Expected total: ~$(($BATCH_SIZE * $EXAMPLES_PER_SCENARIO * $BATCHES)) examples"
echo ""

# Run the generator with intensive settings
python3 generate_complex_cross_system_data.py \
  --batch-size $BATCH_SIZE \
  --examples-per-scenario $EXAMPLES_PER_SCENARIO \
  --batches $BATCHES \
  --temperature $TEMPERATURE

echo ""
echo "Generation complete!"

# Get final count of complex examples
# We're using the DATABASE_URL environment variable directly as it's already set
COMPLEX_COUNT=$(python -c "import psycopg2, os; conn = psycopg2.connect(os.environ.get('DATABASE_URL')); cur = conn.cursor(); cur.execute('SELECT COUNT(*) FROM training_data WHERE is_complex_multi_system = TRUE'); print(cur.fetchone()[0]); conn.close()" 2>/dev/null) || echo "Unknown"

echo "Current complex examples count: $COMPLEX_COUNT"
echo "Training data is ready for use!"