#!/bin/bash

# Script to run training data generation in the background
# Usage: ./run_training_background.sh [small|medium|large|massive|500]

SIZE=${1:-"small"}
LOG_FILE="training_generation_$(date +%Y%m%d%H%M%S).log"

echo "Starting training data generation in background (size: $SIZE)"
echo "Logs will be saved to $LOG_FILE"

if [ "$SIZE" == "500" ]; then
  # Run the 500 example generator
  nohup ./generate_500_examples.sh > "$LOG_FILE" 2>&1 &
else
  # Run the regular generator with specified size
  nohup ./generate_all_data.sh "$SIZE" > "$LOG_FILE" 2>&1 &
fi

# Save the process ID for later reference
echo $! > training_pid.txt

echo "Generation process started with PID $(cat training_pid.txt)"
echo "To check progress: tail -f $LOG_FILE"
echo "To check database stats after completion: python3 monitor_training_data.py"