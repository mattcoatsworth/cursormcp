-- Add timestamp column to training_data table
ALTER TABLE training_data
ADD COLUMN timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Add comment to explain the column
COMMENT ON COLUMN training_data.timestamp IS 'Timestamp when this training data entry was created'; 