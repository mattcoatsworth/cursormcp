#!/bin/bash

# Script to generate training data quickly using the parallel generator
# Usage: ./generate_training_data.sh [small|medium|large|massive]

# Set default values
WORKERS=4
EXAMPLES=10
BATCH_SIZE=10
SIZE="small"

# Parse command line argument
if [ $# -ge 1 ]; then
  SIZE=$1
fi

# Set configuration based on size
case $SIZE in
  "small")
    WORKERS=4
    EXAMPLES=10
    BATCH_SIZE=10
    echo "Running SMALL generation (approx. 400-600 examples)"
    ;;
  "medium")
    WORKERS=6
    EXAMPLES=25
    BATCH_SIZE=25
    echo "Running MEDIUM generation (approx. 2,000-3,000 examples)"
    ;;
  "large")
    WORKERS=8
    EXAMPLES=50
    BATCH_SIZE=25
    echo "Running LARGE generation (approx. 5,000-7,000 examples)"
    ;;
  "massive")
    WORKERS=10
    EXAMPLES=100
    BATCH_SIZE=25
    echo "Running MASSIVE generation (approx. 10,000-15,000 examples)"
    ;;
  *)
    echo "Unknown size: $SIZE. Using small."
    ;;
esac

# Create output directory with timestamp
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
OUTPUT_DIR="training_data_output_${TIMESTAMP}"

# Run the generator
echo "Starting parallel generation with $WORKERS workers, $EXAMPLES examples per item, batch size $BATCH_SIZE"
echo "Output directory: $OUTPUT_DIR"
echo ""

python3 parallel_training_generator.py --workers $WORKERS --examples $EXAMPLES --batch-size $BATCH_SIZE --output-dir $OUTPUT_DIR

echo ""
echo "Generation complete!"
echo "Generated data is stored in $OUTPUT_DIR and imported to database"
echo "To view training data count, run: python -c \"import psycopg2; conn = psycopg2.connect(open('.env').read().split('DATABASE_URL=')[1].strip().split('\\n')[0]); cur = conn.cursor(); cur.execute('SELECT COUNT(*) FROM training_data'); print(cur.fetchone()[0]); conn.close()\""