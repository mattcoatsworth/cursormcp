-- Add is_active column to training_data table
ALTER TABLE training_data
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Add comment to explain the column
COMMENT ON COLUMN training_data.is_active IS 'Indicates whether this training data entry is currently active and should be used'; 