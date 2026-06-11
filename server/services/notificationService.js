import pool from '../config/db.js'
import { sendPushNotification } from '../firebaseAdmin.js'

export async function sendNotificationToUser(userId, title, body, type = 'Alert') {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)',
      [userId, type, `${title}: ${body}`]
    )
  } catch (err) {
    console.error('DB notification insert error:', err.message)
  }

  try {
    const tokenResult = await pool.query(
      'SELECT fcm_token FROM users WHERE user_id = $1',
      [userId]
    )
    const fcmToken = tokenResult.rows[0]?.fcm_token
    if (!fcmToken) return { success: false, reason: 'no_token' }

    const result = await sendPushNotification(fcmToken, title, body)

    if (!result.success && result.reason === 'invalid_token') {
      await pool.query('UPDATE users SET fcm_token = NULL WHERE user_id = $1', [userId])
      console.log(`Removed stale FCM token for user ${userId}`)
    }

    return result
  } catch (err) {
    console.error('sendNotificationToUser error:', err.message)
    return { success: false, reason: 'error', message: err.message }
  }
}
