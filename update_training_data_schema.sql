-- Add applied_guidelines column to training_data table
ALTER TABLE training_data
ADD COLUMN applied_guidelines JSONB DEFAULT '{"general_guidelines": [], "domain_guidelines": []}'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN training_data.applied_guidelines IS 'Metadata about which system_training guidelines were applied when generating the response'; 