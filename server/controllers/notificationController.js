import pool from '../config/db.js'
import { sendPushNotification } from '../firebaseAdmin.js'
import { sendNotificationToUser } from '../services/notificationService.js'

/** Return all notifications for the logged-in user, newest first */
export async function getNotifications(req, res) {
  const userId = req.user.userId
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    )
    res.json(result.rows)
  } catch {
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
}

/** Count of unread notifications for the logged-in user */
export async function getUnreadCount(req, res) {
  const userId = req.user.userId
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    )
    res.json({ count: parseInt(result.rows[0].count) })
  } catch {
    res.status(500).json({ error: 'Failed to fetch count' })
  }
}

/** Mark a single notification as read */
export async function markRead(req, res) {
  const { id } = req.params
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE notification_id = $1', [id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to mark as read' })
  }
}

/** Mark ALL notifications as read for the logged-in user */
export async function markAllRead(req, res) {
  const userId = req.user.userId
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to mark all as read' })
  }
}

/** Save (or update) FCM token for the logged-in user */
export async function saveFCMToken(req, res) {
  const userId = req.user.userId
  const { token } = req.body
  if (!token) return res.status(400).json({ error: 'Token required' })
  try {
    await pool.query('UPDATE users SET fcm_token = $1 WHERE user_id = $2', [token, userId])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to save token' })
  }
}

/** Remove FCM token (unsubscribe from push) */
export async function removeFCMToken(req, res) {
  const userId = req.user.userId
  try {
    await pool.query('UPDATE users SET fcm_token = NULL WHERE user_id = $1', [userId])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to remove token' })
  }
}

/**
 * Push a notification to a specific user (doctor/caretaker → patient).
 * Body: { userId, title, body, type }
 * type: Medicine | High Sugar | Low Sugar | Appointment | Emergency | Alert
 *
 * NOTE: sendNotificationToUser ALWAYS saves to the DB first, then attempts FCM.
 * So even when the patient has no push token, the notification lands in their
 * Notification Center. We return 200 in that case so the sender knows it was
 * delivered to the inbox — just not as a push banner.
 */
export async function pushToUser(req, res) {
  const { userId, title, body, type = 'Alert' } = req.body
  if (!userId || !title || !body) {
    return res.status(400).json({ error: 'userId, title, and body are required' })
  }
  try {
    const result = await sendNotificationToUser(userId, title, body, type)
    if (result.success) {
      // Full success — DB saved + push delivered
      return res.json({ success: true, pushed: true, messageId: result.messageId })
    }
    // Any non-success from FCM still means the notification was saved to the DB inbox
    // (no_token, invalid_token, not_initialized, send_error — all treated as inbox delivery)
    return res.json({ success: true, pushed: false, reason: result.reason })
  } catch (err) {
    res.status(500).json({ error: 'Push failed', message: err.message })
  }
}

/** Send a test push to the logged-in user — for verifying FCM setup */
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

/** Legacy direct-insert route (kept for backward compat) */
export async function sendNotification(req, res) {
  const { userId, type, message } = req.body
  if (!userId || !type || !message) {
    return res.status(400).json({ error: 'All fields required' })
  }
  try {
    const result = await pool.query(
      'INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3) RETURNING *',
      [userId, type, message]
    )
    res.status(201).json(result.rows[0])
  } catch {
    res.status(500).json({ error: 'Failed to send notification' })
  }
}
