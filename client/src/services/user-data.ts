import { supabase } from '../config'

export interface UserData {
  id: string
  user_id: string
  tool: string
  intent: string
  query: string
  response: string
  execution_details: any[]
  applied_guidelines: Record<string, any>
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  feedback_score?: number
  feedback_notes?: string
  is_archived: boolean
  systems: any[]
  workflow: any[]
  follow_up_queries: any[]
  follow_up_responses: any[]
  follow_up_context: Record<string, any>
}

export async function createUserData(data: Partial<UserData>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be logged in to create user data')

  const { data: result, error } = await supabase
    .from('user_data')
    .insert({
      ...data,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return result
}

export async function getUserData() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be logged in to view user data')

  const { data, error } = await supabase
    .from('user_data')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function updateUserData(id: string, data: Partial<UserData>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be logged in to update user data')

  const { data: result, error } = await supabase
    .from('user_data')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return result
}

export async function deleteUserData(id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be logged in to delete user data')

  const { error } = await supabase
    .from('user_data')
    .delete()
    .eq('id', id)

  if (error) throw error
}
