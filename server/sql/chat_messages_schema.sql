-- Add user_id column if it doesn't exist
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Make user_id NOT NULL
ALTER TABLE chat_messages 
ALTER COLUMN user_id SET NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON chat_messages(user_id);
