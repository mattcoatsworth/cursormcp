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

# Get counts from Supabase
python -c "
from supabase import create_client
import os

# Connect to Supabase
supabase = create_client(os.environ.get('SUPABASE_URL'), os.environ.get('SUPABASE_SERVICE_ROLE_KEY'))

# Get standard examples count
standard = supabase.table('training_data').select('id', count='exact').neq('tool', 'complex_interaction').execute()

# Get complex examples count
complex = supabase.table('training_data').select('id', count='exact').eq('tool', 'complex_interaction').execute()

# Get total count
total = supabase.table('training_data').select('id', count='exact').execute()

print(f'Standard examples: {standard.count}')
print(f'Complex examples: {complex.count}')
print(f'Total examples: {total.count}')
"

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