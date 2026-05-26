import pool from '../config/db.js'

export async function getMessages(req, res) {
  const userId = req.user.userId
  const { receiverId } = req.params
  try {
    const result = await pool.query(
      `SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM messages m JOIN users u ON m.sender_id = u.user_id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.sent_at ASC`,
      [userId, receiverId]
    )
    res.json(result.rows)
  } catch {
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
    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES ($1, $2, $3) RETURNING *',
      [senderId, receiverId, text]
    )
    const msg = result.rows[0]
    const sender = await pool.query(
      'SELECT name, role FROM users u WHERE u.user_id = $1',
      [senderId]
    )
    msg.sender_name = sender.rows[0]?.name || 'You'
    msg.sender_role = sender.rows[0]?.role || 'User'
    res.status(201).json(msg)
  } catch (err) {
    console.error('sendMessage error:', err)
    res.status(500).json({ error: 'Failed to send message' })
  }
}
