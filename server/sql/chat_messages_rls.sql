-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own messages
CREATE POLICY "Users can read own messages"
ON chat_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for users to insert their own messages
CREATE POLICY "Users can insert own messages"
ON chat_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own messages
CREATE POLICY "Users can update own messages"
ON chat_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to delete their own messages
CREATE POLICY "Users can delete own messages"
ON chat_messages
FOR DELETE
USING (auth.uid() = user_id);
