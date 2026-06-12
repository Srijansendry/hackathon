import { supabase } from '../config/supabase.js'
import { sendNotificationToUser } from '../services/notificationService.js'

export async function getNotifications(req, res) {
  const userId = req.user.userId
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('getNotifications error:', err)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
}

export async function getUnreadCount(req, res) {
  const userId = req.user.userId
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error
    res.json({ count: count || 0 })
  } catch (err) {
    console.error('getUnreadCount error:', err)
    res.status(500).json({ error: 'Failed to fetch count' })
  }
}

export async function markRead(req, res) {
  const { id } = req.params
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('notification_id', id)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    console.error('markRead error:', err)
    res.status(500).json({ error: 'Failed to mark as read' })
  }
}

export async function markAllRead(req, res) {
  const userId = req.user.userId
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    console.error('markAllRead error:', err)
    res.status(500).json({ error: 'Failed to mark all as read' })
  }
}

export async function saveFCMToken(req, res) {
  const userId = req.user.userId
  const { token } = req.body
  if (!token) return res.status(400).json({ error: 'Token required' })
  try {
    const { error } = await supabase
      .from('users')
      .update({ fcm_token: token })
      .eq('user_id', userId)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    console.error('saveFCMToken error:', err)
    res.status(500).json({ error: 'Failed to save token' })
  }
}

export async function removeFCMToken(req, res) {
  const userId = req.user.userId
  try {
    const { error } = await supabase
      .from('users')
      .update({ fcm_token: null })
      .eq('user_id', userId)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    console.error('removeFCMToken error:', err)
    res.status(500).json({ error: 'Failed to remove token' })
  }
}

export async function pushToUser(req, res) {
  const { userId, title, body, type = 'Alert' } = req.body
  if (!userId || !title || !body) {
    return res.status(400).json({ error: 'userId, title, and body are required' })
  }
  try {
    const result = await sendNotificationToUser(userId, title, body, type)
    if (result.success) {
      return res.json({ success: true, pushed: true, messageId: result.messageId })
    }
    return res.json({ success: true, pushed: false, reason: result.reason })
  } catch (err) {
    res.status(500).json({ error: 'Push failed', message: err.message })
  }
}

export async function testPushNotification(req, res) {
  const userId = req.user.userId
  const { title = 'Glucolyse Test', body = 'Push notifications are working!' } = req.body
  try {
    const result = await sendNotificationToUser(userId, title, body, 'Alert')
    if (result.success) {
      res.json({ success: true, messageId: result.messageId })
    } else {
      res.status(400).json({ success: false, reason: result.reason, message: result.message })
    }
  } catch (err) {
    res.status(500).json({ error: 'Test failed', message: err.message })
  }
}

export async function sendNotification(req, res) {
  const { userId, type, message } = req.body
  if (!userId || !type || !message) {
    return res.status(400).json({ error: 'All fields required' })
  }
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, message })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    console.error('sendNotification error:', err)
    res.status(500).json({ error: 'Failed to send notification' })
  }
}
