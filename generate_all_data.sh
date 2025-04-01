#!/bin/bash

# Script to generate both standard and complex cross-system training data
# Usage: ./generate_all_data.sh [small|medium|large|massive]
# 
# This script runs both standard and complex cross-system data generation
# Complex data includes 18 different multi-service scenarios covering all 13 integrations

# Default size
SIZE=${1:-"small"}

echo "=== TRAINING DATA GENERATION ==="
echo "Generating both standard and complex cross-system training data"
echo "Size: $SIZE"
echo ""

# First generate standard training data
echo "=== STEP 1: GENERATING STANDARD TRAINING DATA ==="
./generate_training_data.sh $SIZE
echo ""

# Then generate complex cross-system data
echo "=== STEP 2: GENERATING COMPLEX CROSS-SYSTEM DATA ==="
./generate_complex_data.sh $SIZE
echo ""

# Final stats
echo "=== GENERATION COMPLETE ==="
echo "To view current training data counts:"

# Get count of standard examples
STANDARD_COUNT=$(python -c "import psycopg2; conn = psycopg2.connect(open('.env').read().split('DATABASE_URL=')[1].strip().split('\n')[0]); cur = conn.cursor(); cur.execute('SELECT COUNT(*) FROM training_data WHERE is_complex_multi_system IS NULL OR is_complex_multi_system = FALSE'); print(cur.fetchone()[0]); conn.close()" 2>/dev/null) || echo "Unknown"

# Get count of complex examples
COMPLEX_COUNT=$(python -c "import psycopg2; conn = psycopg2.connect(open('.env').read().split('DATABASE_URL=')[1].strip().split('\n')[0]); cur = conn.cursor(); cur.execute('SELECT COUNT(*) FROM training_data WHERE is_complex_multi_system = TRUE'); print(cur.fetchone()[0]); conn.close()" 2>/dev/null) || echo "Unknown"

# Get total count
TOTAL_COUNT=$(python -c "import psycopg2; conn = psycopg2.connect(open('.env').read().split('DATABASE_URL=')[1].strip().split('\n')[0]); cur = conn.cursor(); cur.execute('SELECT COUNT(*) FROM training_data'); print(cur.fetchone()[0]); conn.close()" 2>/dev/null) || echo "Unknown"

echo "Standard examples: $STANDARD_COUNT"
echo "Complex examples: $COMPLEX_COUNT"
echo "Total examples: $TOTAL_COUNT"