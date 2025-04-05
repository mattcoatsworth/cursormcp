import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 'https://jmpxvzuxbyfjrttxwtnn.supabase.co'
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptcHh2enV4YnlmanJ0dHh3dG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyOTA0NjQsImV4cCI6MjA1ODg2NjQ2NH0.jVIQ4iTAYHXRwKSs5i4qjxVVo3sAc6rVY-Zpj2F2u4E'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
