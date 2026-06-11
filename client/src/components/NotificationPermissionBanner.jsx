import { useState, useEffect } from 'react'
import { requestNotificationPermission, getFCMToken } from '../firebase'
import { saveFCMToken } from '../services/notificationService'

const ASKED_KEY  = 'glucolyse_notif_asked'
const TOKEN_KEY  = 'glucolyse_fcm_token'

/**
 * Appears once (with a short delay) the first time a user opens the app,
 * if they haven't been asked for notification permission yet.
 * Does not conflict with the usePushNotifications hook in App.jsx because
 * it handles the very first permission + token registration separately.
 */
export default function NotificationPermissionBanner() {
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  useEffect(() => {
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default' &&
      !localStorage.getItem(ASKED_KEY)
    ) {
      // Slight delay so it doesn't pop immediately on page load
      const t = setTimeout(() => setShow(true), 1800)
      return () => clearTimeout(t)
    }
  }, [])

  const handleEnable = async () => {
    setLoading(true)
    localStorage.setItem(ASKED_KEY, 'true')
    try {
      const { granted } = await requestNotificationPermission()
      if (granted) {
        // Register service worker then get token
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
          await navigator.serviceWorker.ready
        }
        const { token } = await getFCMToken()
        if (token) {
          await saveFCMToken(token)
          localStorage.setItem(TOKEN_KEY, token)
        }
        setDone(true)
        setTimeout(() => setShow(false), 2500)
      } else {
        setShow(false)
      }
    } catch {
      setShow(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(ASKED_KEY, 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="mx-4 md:mx-6 lg:mx-8 mt-4 bg-gradient-to-r from-primary/8 to-sky-500/8 border border-primary/20 rounded-2xl p-4 flex items-center gap-4 animate-fade-in shadow-soft">
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-xl shrink-0">
        🔔
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        {done ? (
          <p className="text-xs font-bold text-emerald-600">
            ✓ Push notifications enabled! You'll receive real-time health alerts.
          </p>
        ) : (
          <>
            <p className="text-xs font-bold text-text-heading">Enable push notifications</p>
            <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
              Get real-time alerts for blood sugar changes, medicine reminders, and emergency health warnings.
            </p>
          </>
        )}
      </div>

      {/* Actions */}
      {!done && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="text-[11px] font-semibold text-text-muted hover:text-text-secondary transition-colors cursor-pointer whitespace-nowrap"
          >
            Later
          </button>
          <button
            onClick={handleEnable}
            disabled={loading}
            className="px-3.5 py-1.5 bg-primary text-white text-[11px] font-bold rounded-xl hover:bg-primary-dark disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
          >
            {loading ? 'Enabling…' : 'Enable Now'}
          </button>
        </div>
      )}
    </div>
  )
}
