import admin from 'firebase-admin'

let privateKey = null
let clientEmail = process.env.FIREBASE_CLIENT_EMAIL
let projectId = process.env.FIREBASE_PROJECT_ID

const rawKey = process.env.FIREBASE_PRIVATE_KEY || ''
try {
  const parsed = JSON.parse(rawKey)
  if (parsed.private_key) {
    privateKey = parsed.private_key
    if (!clientEmail) clientEmail = parsed.client_email
    if (!projectId) projectId = parsed.project_id
  }
} catch {
  if (rawKey.includes('BEGIN PRIVATE KEY')) {
    privateKey = rawKey.replace(/\\n/g, '\n').replace(/^"|"$/g, '')
  }
}

if (!admin.apps.length) {
  if (!privateKey || !clientEmail || !projectId) {
    console.warn('Firebase Admin: missing credentials — push notifications disabled')
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey })
      })
      console.log('Firebase Admin SDK initialized')
    } catch (err) {
      console.error('Firebase Admin init error:', err.message)
    }
  }
}

export const messaging = admin.apps.length ? admin.messaging() : null

export async function sendPushNotification(fcmToken, title, body, data = {}) {
  if (!messaging) {
    console.warn('Firebase Admin not initialized — skipping push')
    return { success: false, reason: 'not_initialized' }
  }
  try {
    const response = await messaging.send({
      token: fcmToken,
      notification: { title, body },
      data,
      webpush: {
        notification: {
          title,
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          requireInteraction: false
        },
        fcmOptions: { link: '/' }
      }
    })
    return { success: true, messageId: response }
  } catch (err) {
    const invalid = ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered']
    if (invalid.includes(err.code)) {
      return { success: false, reason: 'invalid_token', code: err.code }
    }
    console.error('FCM send error:', err.message)
    return { success: false, reason: 'send_error', message: err.message }
  }
}

export default admin
