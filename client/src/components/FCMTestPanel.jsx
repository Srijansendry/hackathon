import { useState } from 'react'
import { getFirebaseConfigDebug, requestNotificationPermission, getFCMToken } from '../firebase'

export default function FCMTestPanel() {
  const [log, setLog] = useState([])
  const [token, setToken] = useState(null)
  const [running, setRunning] = useState(false)

  const append = (msg, type = 'info') => {
    setLog((prev) => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }])
  }

  const runDiagnostics = async () => {
    setLog([])
    setToken(null)
    setRunning(true)

    append('--- Firebase Config ---')
    const cfg = getFirebaseConfigDebug()
    for (const [k, v] of Object.entries(cfg)) {
      const ok = !v.includes('MISSING')
      append(`${k}: ${v}`, ok ? 'ok' : 'error')
    }

    append('--- Browser Support ---')
    if (!('Notification' in window)) {
      append('Notifications API: NOT supported', 'error')
      setRunning(false)
      return
    }
    append(`Notifications API: supported`, 'ok')
    append(`Current permission: ${Notification.permission}`, Notification.permission === 'granted' ? 'ok' : 'warn')

    if (!('serviceWorker' in navigator)) {
      append('Service Workers: NOT supported', 'error')
      setRunning(false)
      return
    }
    append('Service Workers: supported', 'ok')

    append('--- Requesting Permission ---')
    const { granted, reason } = await requestNotificationPermission()
    if (!granted) {
      append(`Permission: ${reason}`, 'error')
      setRunning(false)
      return
    }
    append('Permission: granted', 'ok')

    append('--- Registering Service Worker ---')
    try {
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
      append(`SW registered: scope=${reg.scope}`, 'ok')
      await navigator.serviceWorker.ready
      append('SW ready', 'ok')
    } catch (err) {
      append(`SW registration failed: ${err.message}`, 'error')
      setRunning(false)
      return
    }

    append('--- Getting FCM Token ---')
    const { token: fcmToken, error: tokenError } = await getFCMToken()
    if (fcmToken) {
      append(`Token obtained (${fcmToken.length} chars)`, 'ok')
      append(`Token: ${fcmToken.slice(0, 20)}...${fcmToken.slice(-10)}`, 'ok')
      setToken(fcmToken)
    } else {
      append(`Token failed: ${tokenError}`, 'error')
    }

    setRunning(false)
  }

  const colorMap = { ok: '#4ade80', error: '#f87171', warn: '#fbbf24', info: '#94a3b8' }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: '#e2e8f0',
      fontFamily: 'monospace',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#38bdf8' }}>
        FCM Diagnostics
      </h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        Tests Firebase config, permissions, service worker registration, and token generation.
      </p>

      <button
        onClick={runDiagnostics}
        disabled={running}
        style={{
          background: running ? '#1e3a5f' : '#0284c7',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '0.625rem 1.25rem',
          cursor: running ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem',
          marginBottom: '1.5rem'
        }}
      >
        {running ? 'Running...' : 'Run Diagnostics'}
      </button>

      {log.length > 0 && (
        <div style={{
          background: '#1e293b',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          fontSize: '0.8rem',
          lineHeight: '1.8'
        }}>
          {log.map((entry, i) => (
            <div key={i}>
              <span style={{ color: '#475569' }}>[{entry.ts}] </span>
              <span style={{ color: colorMap[entry.type] || '#e2e8f0' }}>{entry.msg}</span>
            </div>
          ))}
        </div>
      )}

      {token && (
        <div style={{
          background: '#052e16',
          border: '1px solid #16a34a',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <div style={{ color: '#4ade80', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            FCM Token Generated Successfully
          </div>
          <div style={{
            wordBreak: 'break-all',
            fontSize: '0.75rem',
            color: '#86efac',
            background: '#0f2916',
            padding: '0.75rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
            onClick={() => { navigator.clipboard?.writeText(token); }}
            title="Click to copy"
          >
            {token}
          </div>
          <div style={{ color: '#4ade80', fontSize: '0.75rem', marginTop: '0.4rem' }}>
            Click token to copy to clipboard
          </div>
        </div>
      )}
    </div>
  )
}
