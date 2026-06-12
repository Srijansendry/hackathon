import { supabase } from '../config/supabase.js'
import { sendPushNotification } from '../firebaseAdmin.js'
import { emitToUser } from '../socketManager.js'

export async function sendNotificationToUser(userId, title, body, type = 'Alert') {
  try {
    const { data: notif } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, message: `${title}: ${body}` })
      .select()
      .single()
    if (notif) emitToUser(userId, 'newNotification', notif)
  } catch (err) {
    console.error('[Notification] DB insert error:', err.message)
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('fcm_token')
      .eq('user_id', userId)
      .maybeSingle()

    const fcmToken = user?.fcm_token
    if (!fcmToken) return { success: false, reason: 'no_token' }

    const result = await sendPushNotification(fcmToken, title, body)

    if (!result.success && result.reason === 'invalid_token') {
      await supabase
        .from('users')
        .update({ fcm_token: null })
        .eq('user_id', userId)
      console.log(`[Notification] Removed stale FCM token for user ${userId}`)
    }

    return result
  } catch (err) {
    console.error('[Notification] sendNotificationToUser error:', err.message)
    return { success: false, reason: 'error', message: err.message }
  }
}

export async function sendBloodSugarAlert(patientId, level, mealType, timing) {
  const isHigh = level > 140
  const isLow = level < 80
  if (!isHigh && !isLow) return

  const type = isHigh ? 'High Sugar' : 'Low Sugar'
  const title = isHigh ? 'High Blood Sugar Alert' : 'Low Blood Sugar Alert'
  const body = isHigh
    ? `Your ${timing.toLowerCase()} ${mealType.toLowerCase()} reading is ${level} mg/dL — above the safe range. Please monitor closely.`
    : `Your ${timing.toLowerCase()} ${mealType.toLowerCase()} reading is ${level} mg/dL — below the safe range. Consider eating something right away.`

  await sendNotificationToUser(patientId, title, body, type)

  try {
    const { data: pat } = await supabase
      .from('patients')
      .select('doctor_id, caretaker_id')
      .eq('patient_id', patientId)
      .maybeSingle()

    if (!pat) return

    const { data: patUser } = await supabase
      .from('users')
      .select('name')
      .eq('user_id', patientId)
      .maybeSingle()

    const patName = patUser?.name || 'Your patient'
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
