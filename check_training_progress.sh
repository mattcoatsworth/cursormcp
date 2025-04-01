#!/bin/bash

# Script to check the progress of training data generation
# Usage: ./check_training_progress.sh

echo "=== TRAINING DATA GENERATION PROGRESS ==="

# Check if a training process is running
if [ -f training_pid.txt ]; then
  PID=$(cat training_pid.txt)
  if ps -p $PID > /dev/null; then
    echo "Training process is running with PID $PID"
    
    # Display the most recent log file
    LOG_FILE=$(ls -t training_generation_*.log 2>/dev/null | head -1)
    if [ -n "$LOG_FILE" ]; then
      echo "Last 10 lines of log file ($LOG_FILE):"
      echo "-------------------------------------"
      tail -10 "$LOG_FILE"
      echo "-------------------------------------"
      echo "View full logs with: tail -f $LOG_FILE"
    else
      echo "No log file found."
    fi
  else
    echo "No active training process found (PID $PID doesn't exist)"
    echo "Process may have completed or been terminated"
  fi
else
  echo "No training process has been started with the run_training_background.sh script"
fi

# Get current training data counts
echo ""
echo "=== CURRENT TRAINING DATA COUNTS ==="

# Get both types of training data counts using direct queries
STANDARD_COUNT=$(python -c "import psycopg2, os; conn = psycopg2.connect(os.environ.get('DATABASE_URL')); cur = conn.cursor(); cur.execute('SELECT COUNT(*) FROM training_data WHERE is_complex_multi_system IS NULL OR is_complex_multi_system = FALSE'); print(cur.fetchone()[0]); conn.close()" 2>/dev/null) || echo "Unknown"
COMPLEX_COUNT=$(python -c "import psycopg2, os; conn = psycopg2.connect(os.environ.get('DATABASE_URL')); cur = conn.cursor(); cur.execute('SELECT COUNT(*) FROM training_data WHERE is_complex_multi_system = TRUE'); print(cur.fetchone()[0]); conn.close()" 2>/dev/null) || echo "Unknown"
TOTAL_COUNT=$(python -c "import psycopg2, os; conn = psycopg2.connect(os.environ.get('DATABASE_URL')); cur = conn.cursor(); cur.execute('SELECT COUNT(*) FROM training_data'); print(cur.fetchone()[0]); conn.close()" 2>/dev/null) || echo "Unknown"

echo "Standard examples: $STANDARD_COUNT"
echo "Complex examples: $COMPLEX_COUNT"
echo "Total examples: $TOTAL_COUNT"

# Get most recent examples
echo ""
echo "=== MOST RECENT TRAINING EXAMPLES ==="
python -c "
import psycopg2, os, json
conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
cur = conn.cursor()
cur.execute('SELECT query, created_at FROM training_data ORDER BY created_at DESC LIMIT 3')
rows = cur.fetchall()
conn.close()
for i, (query, created_at) in enumerate(rows):
    print(f'{i+1}. [{created_at}]: {query[:100]}...')
" 2>/dev/null || echo "Unable to retrieve recent examples"