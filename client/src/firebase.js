import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD-placeholder',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

let messagingInstance = null

export async function getMessagingInstance() {
  if (messagingInstance) return messagingInstance
  const supported = await isSupported()
  if (!supported) return null
  messagingInstance = getMessaging(app)
  return messagingInstance
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return { granted: false, reason: 'not_supported' }
  if (Notification.permission === 'denied') return { granted: false, reason: 'denied' }
  if (Notification.permission === 'granted') return { granted: true }

  const permission = await Notification.requestPermission()
  return { granted: permission === 'granted', reason: permission }
}

export async function getFCMToken() {
  const messaging = await getMessagingInstance()
  if (!messaging) return null

  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready
    })
    return token || null
  } catch (err) {
    console.error('FCM getToken error:', err)
    return null
  }
}

export async function onForegroundMessage(callback) {
  const messaging = await getMessagingInstance()
  if (!messaging) return () => {}
  return onMessage(messaging, callback)
}

export { app }
