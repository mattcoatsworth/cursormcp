-- Add source column to training_data table
ALTER TABLE training_data
ADD COLUMN source TEXT[] DEFAULT ARRAY['system_generated'];

-- Add comment to explain the column
COMMENT ON COLUMN training_data.source IS 'Array of sources indicating where this training data entry came from'; 