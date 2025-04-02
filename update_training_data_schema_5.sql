-- Add version column to training_data table
ALTER TABLE training_data
ADD COLUMN version TEXT DEFAULT '1.0';

-- Add comment to explain the column
COMMENT ON COLUMN training_data.version IS 'Version of the guidelines used for this training data entry'; 