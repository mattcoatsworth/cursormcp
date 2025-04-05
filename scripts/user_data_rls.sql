-- Enable Row Level Security
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can insert own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can update own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can delete own data" ON public.user_data;

-- Create policy for users to read their own data
CREATE POLICY "Users can read own data"
ON public.user_data
FOR SELECT
USING (auth.uid()::text::uuid = user_id);

-- Create policy for users to insert their own data
CREATE POLICY "Users can insert own data"
ON public.user_data
FOR INSERT
WITH CHECK (auth.uid()::text::uuid = user_id);

-- Create policy for users to update their own data
CREATE POLICY "Users can update own data"
ON public.user_data
FOR UPDATE
USING (auth.uid()::text::uuid = user_id)
WITH CHECK (auth.uid()::text::uuid = user_id);

-- Create policy for users to delete their own data
CREATE POLICY "Users can delete own data"
ON public.user_data
FOR DELETE
USING (auth.uid()::text::uuid = user_id);
