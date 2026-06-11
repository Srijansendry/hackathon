import { useState, useEffect, useCallback } from 'react'
import { requestNotificationPermission, getFCMToken, onForegroundMessage } from '../firebase'
import { saveFCMToken, removeFCMToken } from '../services/notificationService'

const STORAGE_KEY = 'glucolyse_fcm_token'
const ASKED_KEY = 'glucolyse_notif_asked'

export function usePushNotifications({ onForegroundNotification } = {}) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const [tokenStatus, setTokenStatus] = useState('idle')
  const [error, setError] = useState(null)

  const registerToken = useCallback(async () => {
    setTokenStatus('loading')
    setError(null)
    try {
      if (!('serviceWorker' in navigator)) {
        setTokenStatus('unsupported')
        return
      }

      await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
      await navigator.serviceWorker.ready

      const token = await getFCMToken()
      if (!token) {
        setTokenStatus('failed')
        setError('Could not get notification token')
        return
      }

      const storedToken = localStorage.getItem(STORAGE_KEY)
      if (storedToken !== token) {
        await saveFCMToken(token)
        localStorage.setItem(STORAGE_KEY, token)
      }

      setTokenStatus('registered')
    } catch (err) {
      console.error('Push registration error:', err)
      setTokenStatus('failed')
      setError(err.message)
    }
  }, [])

  const enable = useCallback(async () => {
    localStorage.setItem(ASKED_KEY, 'true')
    const { granted, reason } = await requestNotificationPermission()
    setPermission(Notification.permission)
    if (granted) {
      await registerToken()
    } else {
      setTokenStatus('denied')
      setError(reason === 'denied' ? 'Permission denied. Enable notifications in browser settings.' : 'Permission not granted.')
    }
  }, [registerToken])

  const disable = useCallback(async () => {
    try {
      await removeFCMToken()
      localStorage.removeItem(STORAGE_KEY)
      setTokenStatus('idle')
    } catch (err) {
      console.error('Remove token error:', err)
    }
  }, [])

  useEffect(() => {
    if (permission !== 'granted' || tokenStatus !== 'idle') return
    const alreadyHasToken = localStorage.getItem(STORAGE_KEY)
    if (alreadyHasToken) {
      registerToken()
    }
  }, [permission, tokenStatus, registerToken])

  useEffect(() => {
    if (!onForegroundNotification) return
    let unsub = () => {}
    onForegroundMessage((payload) => {
      onForegroundNotification(payload)
    }).then((fn) => { unsub = fn })
    return () => unsub()
  }, [onForegroundNotification])

  const shouldPrompt = permission === 'default' && !localStorage.getItem(ASKED_KEY)

  return { permission, tokenStatus, error, enable, disable, shouldPrompt }
}
