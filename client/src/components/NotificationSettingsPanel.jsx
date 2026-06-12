import { useState } from 'react'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { testPushNotification } from '../services/notificationService'

export default function NotificationSettingsPanel() {
  const { permission, tokenStatus, error, enable, disable } = usePushNotifications()
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const isEnabled = permission === 'granted' && tokenStatus === 'registered'
  const isDenied = permission === 'denied'

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      await testPushNotification({ title: 'Glucolyse Test', body: 'Push notifications are working!' })
      setTestResult({ success: true, message: 'Notification sent! Check your browser.' })
    } catch (err) {
      const reason = err?.response?.data?.reason
      const msg = reason === 'no_token'
        ? 'Token not registered. Disable and re-enable notifications to fix this.'
        : reason === 'not_initialized'
        ? 'Push service not configured on the server.'
        : reason === 'invalid_token'
        ? 'Your token has expired. Disable and re-enable notifications.'
        : err?.response?.data?.message || 'Test failed. Please try again.'
      setTestResult({ success: false, message: msg })
    } finally {
      setTesting(false)
    }
  }

  const statusConfig = {
    registered: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Enabled', dot: 'bg-emerald-400' },
    loading: { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Activating…', dot: 'bg-amber-400' },
    denied: { color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Blocked in browser', dot: 'bg-rose-400' },
    failed: { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Unavailable', dot: 'bg-amber-400' },
    idle: { color: 'text-text-muted', bg: 'bg-surface-elevated', label: 'Disabled', dot: 'bg-text-muted' },
    unsupported: { color: 'text-text-muted', bg: 'bg-surface-elevated', label: 'Not configured', dot: 'bg-text-muted' },
  }

  const cfg = statusConfig[isDenied ? 'denied' : tokenStatus] || statusConfig.idle
  const isUnsupported = tokenStatus === 'unsupported'

  if (isUnsupported) return null

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔔</span>
        <h3 className="text-sm font-bold text-text-heading">Notification Settings</h3>
      </div>

      <div className={`flex items-center justify-between p-3 rounded-xl ${cfg.bg}`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${cfg.dot} ${tokenStatus === 'loading' ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
        </div>
        {isEnabled ? (
          <button
            onClick={disable}
            className="text-[10px] font-bold text-text-muted hover:text-rose-500 transition-colors cursor-pointer"
          >
            Disable
          </button>
        ) : !isDenied && tokenStatus !== 'failed' ? (
          <button
            onClick={enable}
            disabled={tokenStatus === 'loading'}
            className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors cursor-pointer"
          >
            {tokenStatus === 'loading' ? 'Enabling…' : 'Enable Notifications'}
          </button>
        ) : null}
      </div>

      {isDenied && (
        <p className="text-[10px] text-text-muted leading-relaxed">
          Notifications are blocked. To enable, click the 🔒 lock icon in your browser's address bar and allow notifications for this site.
        </p>
      )}

      {isEnabled && (
        <div className="space-y-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="w-full py-2 bg-surface-elevated hover:bg-surface-border border border-surface-border text-xs font-semibold text-text-secondary rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            {testing ? 'Sending…' : 'Send Test Notification'}
          </button>
          {testResult && (
            <p className={`text-[10px] font-medium text-center ${testResult.success ? 'text-emerald-500' : 'text-rose-500'}`}>
              {testResult.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
