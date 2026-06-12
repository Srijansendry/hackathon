import { supabase } from '../config/supabase.js'

export async function getMessages(req, res) {
  const userId = req.user.userId
  const { receiverId } = req.params
  try {
    const { data: msgs, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${userId})`)
      .order('sent_at', { ascending: true })

    if (error) throw error
    if (!msgs || msgs.length === 0) return res.json([])

    const senderIds = [...new Set(msgs.map(m => m.sender_id))]
    const { data: users } = await supabase
      .from('users')
      .select('user_id, name, role')
      .in('user_id', senderIds)

    const userMap = Object.fromEntries((users || []).map(u => [u.user_id, u]))
    const formatted = msgs.map(m => ({
      ...m,
      sender_name: userMap[m.sender_id]?.name || 'Unknown',
      sender_role: userMap[m.sender_id]?.role || 'User'
    }))
    res.json(formatted)
  } catch (err) {
    console.error('getMessages error:', err)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
}

export async function sendMessage(req, res) {
  const senderId = req.user.userId
  const { receiverId, text } = req.body
  if (!receiverId || !text) {
    return res.status(400).json({ error: 'Receiver and text required' })
  }
  try {
    const { data: msg, error } = await supabase
      .from('messages')
      .insert({ sender_id: senderId, receiver_id: receiverId, message_text: text })
      .select()
      .single()

    if (error) throw error

    const { data: sender } = await supabase
      .from('users')
      .select('name, role')
      .eq('user_id', senderId)
      .single()

    res.status(201).json({
      ...msg,
      sender_name: sender?.name || 'You',
      sender_role: sender?.role || 'User'
    })
  } catch (err) {
    console.error('sendMessage error:', err)
    res.status(500).json({ error: 'Failed to send message' })
  }
}
