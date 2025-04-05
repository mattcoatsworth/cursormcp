import { supabase } from '../config'

export interface Message {
  id: number
  content: string
  user_id: string
  created_at: string
  updated_at: string
}

export async function createMessage(content: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be logged in to create messages')

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      content,
      user_id: user.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMyMessages() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be logged in to view messages')

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function updateMessage(id: number, content: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be logged in to update messages')

  const { data, error } = await supabase
    .from('chat_messages')
    .update({ content })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMessage(id: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be logged in to delete messages')

  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', id)

  if (error) throw error
}
