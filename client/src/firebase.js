import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

export function getFirebaseConfigDebug() {
  const k = firebaseConfig.apiKey
  return {
    apiKey: k ? `${k.slice(0, 8)}...${k.slice(-4)} (${k.length} chars)` : 'MISSING',
    authDomain: firebaseConfig.authDomain || 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
    storageBucket: firebaseConfig.storageBucket || 'MISSING',
    messagingSenderId: firebaseConfig.messagingSenderId || 'MISSING',
    appId: firebaseConfig.appId || 'MISSING',
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      ? `${import.meta.env.VITE_FIREBASE_VAPID_KEY.slice(0, 8)}... (${import.meta.env.VITE_FIREBASE_VAPID_KEY.length} chars)`
      : 'MISSING'
  }
}

let app = null

function getFirebaseApp() {
  if (app) return app
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k)
  if (missingKeys.length > 0) {
    console.error('[Firebase] Missing config keys:', missingKeys)
    return null
  }
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  return app
}

let messagingInstance = null

export async function getMessagingInstance() {
  if (messagingInstance) return messagingInstance
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) return null
  const supported = await isSupported()
  if (!supported) {
    console.warn('[Firebase] Messaging not supported in this browser')
    return null
  }
  messagingInstance = getMessaging(firebaseApp)
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
  if (!messaging) return { token: null, error: 'Messaging not available' }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) return { token: null, error: 'VITE_FIREBASE_VAPID_KEY is missing' }

  try {
    const swReg = await navigator.serviceWorker.ready
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg })
    return { token: token || null, error: token ? null : 'getToken returned empty' }
  } catch (err) {
    console.error('[FCM] getToken error:', err)
    return { token: null, error: err.message }
  }
}

export async function onForegroundMessage(callback) {
  const messaging = await getMessagingInstance()
  if (!messaging) return () => {}
  return onMessage(messaging, callback)
}

export { getFirebaseApp as app }
