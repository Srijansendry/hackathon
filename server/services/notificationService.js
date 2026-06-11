import pool from '../config/db.js'
import { sendPushNotification } from '../firebaseAdmin.js'

/**
 * Core function: saves a notification record to the DB and sends an FCM push
 * to the target user. Gracefully handles missing tokens and stale tokens.
 */
export async function sendNotificationToUser(userId, title, body, type = 'Alert') {
  // Always persist to DB so the user can see it in the Notification Center
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)',
      [userId, type, `${title}: ${body}`]
    )
  } catch (err) {
    console.error('[Notification] DB insert error:', err.message)
  }

  // Attempt FCM push delivery
  try {
    const tokenResult = await pool.query(
      'SELECT fcm_token FROM users WHERE user_id = $1',
      [userId]
    )
    const fcmToken = tokenResult.rows[0]?.fcm_token
    if (!fcmToken) return { success: false, reason: 'no_token' }

    const result = await sendPushNotification(fcmToken, title, body)

    // Remove expired/invalid tokens automatically
    if (!result.success && result.reason === 'invalid_token') {
      await pool.query('UPDATE users SET fcm_token = NULL WHERE user_id = $1', [userId])
      console.log(`[Notification] Removed stale FCM token for user ${userId}`)
    }

    return result
  } catch (err) {
    console.error('[Notification] sendNotificationToUser error:', err.message)
    return { success: false, reason: 'error', message: err.message }
  }
}

/**
 * Auto-trigger blood sugar alerts when a reading is outside the safe range.
 * Notifies the patient directly, plus their linked doctor and caretaker.
 *
 * High alert threshold : > 140 mg/dL
 * Low alert threshold  : < 80 mg/dL
 */
export async function sendBloodSugarAlert(patientId, level, mealType, timing) {
  const isHigh = level > 140
  const isLow = level < 80
  if (!isHigh && !isLow) return

  const type = isHigh ? 'High Sugar' : 'Low Sugar'
  const title = isHigh ? 'High Blood Sugar Alert' : 'Low Blood Sugar Alert'
  const body = isHigh
    ? `Your ${timing.toLowerCase()} ${mealType.toLowerCase()} reading is ${level} mg/dL — above the safe range. Please monitor closely.`
    : `Your ${timing.toLowerCase()} ${mealType.toLowerCase()} reading is ${level} mg/dL — below the safe range. Consider eating something right away.`

  // Notify patient
  await sendNotificationToUser(patientId, title, body, type)

  // Notify their doctor and caretaker
  try {
    const patRes = await pool.query(
      'SELECT doctor_id, caretaker_id FROM patients WHERE patient_id = $1',
      [patientId]
    )
    const pat = patRes.rows[0]
    if (!pat) return

    const nameRes = await pool.query(
      'SELECT name FROM users WHERE user_id = $1',
      [patientId]
    )
    const patName = nameRes.rows[0]?.name || 'Your patient'

    const cgTitle = isHigh ? 'Patient Alert: High Blood Sugar' : 'Patient Alert: Low Blood Sugar'
    const cgBody = isHigh
      ? `${patName}'s ${timing.toLowerCase()} ${mealType.toLowerCase()} reading is ${level} mg/dL — above safe range.`
      : `${patName}'s ${timing.toLowerCase()} ${mealType.toLowerCase()} reading is ${level} mg/dL — below safe range.`

    if (pat.doctor_id) {
      await sendNotificationToUser(pat.doctor_id, cgTitle, cgBody, type)
    }
    if (pat.caretaker_id && pat.caretaker_id !== pat.doctor_id) {
      await sendNotificationToUser(pat.caretaker_id, cgTitle, cgBody, type)
    }
  } catch (err) {
    console.error('[Notification] Caregiver alert error:', err.message)
  }
}
