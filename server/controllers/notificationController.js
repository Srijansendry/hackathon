import pool from '../config/db.js'

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

export async function markRead(req, res) {
  const { id } = req.params
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE notification_id = $1', [id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to mark as read' })
  }
}
