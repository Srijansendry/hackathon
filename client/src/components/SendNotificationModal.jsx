import { useState } from 'react'
import api from '../services/api'

// Quick presets — each includes the matching notification type for the server
const PRESETS = [
  {
    label: '🔴 High Glucose Alert',
    title: 'High Glucose Alert',
    body: 'Your blood sugar level is elevated. Please check your readings and take action if needed.',
    type: 'High Sugar'
  },
  {
    label: '💊 Medication Reminder',
    title: 'Medication Reminder',
    body: "It's time to take your medication. Please don't skip your scheduled dose.",
    type: 'Medicine'
  },
  {
    label: '📋 Check In',
    title: 'Check In',
    body: 'Please log your latest blood sugar reading when you get a chance.',
    type: 'Alert'
  },
  {
    label: '🚨 Urgent: Contact Doctor',
    title: 'Urgent: Contact Your Doctor',
    body: 'Please contact your doctor immediately regarding your recent readings.',
    type: 'Emergency'
  },
]

// Notification type options for the selector
const TYPE_OPTIONS = [
  { value: 'Alert',       label: '⚠️ Alert'       },
  { value: 'Medicine',    label: '💊 Medicine'    },
  { value: 'High Sugar',  label: '🔴 High Sugar'  },
  { value: 'Low Sugar',   label: '🟡 Low Sugar'   },
  { value: 'Appointment', label: '📅 Appointment' },
  { value: 'Emergency',   label: '🚨 Emergency'   },
]

export default function SendNotificationModal({ patient, onClose }) {
  const [title, setTitle]   = useState('')
  const [body, setBody]     = useState('')
  const [type, setType]     = useState('Alert')
  const [status, setStatus] = useState('idle')   // idle | sending | sent | inbox
  const [error, setError]   = useState(null)

  const applyPreset = (preset) => {
    setTitle(preset.title)
    setBody(preset.body)
    setType(preset.type)
    setError(null)
    setStatus('idle')
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setStatus('sending')
    setError(null)
    try {
      const { data } = await api.post('/notifications/push', {
        userId: patient.user_id,
        title:  title.trim(),
        body:   body.trim(),
        type,
      })

      if (data.pushed === false) {
        // Saved to inbox but no push token — still a success, just inform the sender
        setStatus('inbox')
      } else {
        setStatus('sent')
      }
      setTimeout(onClose, 2200)
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Something went wrong. Please try again.'
      )
      setStatus('idle')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-surface-card rounded-2xl border border-surface-border shadow-2xl p-6 animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">
              🔔
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-heading">Send Push Notification</h3>
              <p className="text-[11px] text-text-muted mt-0.5">
                To: <span className="font-semibold text-primary">{patient.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-text-body transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Quick presets ── */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Quick Presets</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className={`text-left px-3 py-2 rounded-xl border text-[11px] font-medium transition-all cursor-pointer leading-tight ${
                  title === p.title
                    ? 'border-primary/50 bg-primary/8 text-primary'
                    : 'border-surface-border bg-surface-elevated hover:border-primary/40 hover:bg-primary/5 text-text-body'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSend} className="space-y-3">
          {/* Type selector */}
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
              Notification Type
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-surface-border bg-surface text-text-body focus:outline-none focus:border-primary hover:border-primary/40 transition-colors cursor-pointer"
            >
              {TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Notification title…"
              maxLength={100}
              required
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-surface-border bg-surface text-text-body focus:outline-none focus:border-primary placeholder-text-muted hover:border-primary/40 transition-colors"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your message to the patient…"
              rows={3}
              maxLength={300}
              required
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-surface-border bg-surface text-text-body focus:outline-none focus:border-primary placeholder-text-muted hover:border-primary/40 transition-colors resize-none leading-relaxed"
            />
            <p className="text-[10px] text-text-muted text-right mt-0.5">{body.length}/300</p>
          </div>

          {/* Status messages */}
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2.5 rounded-xl text-xs">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {status === 'inbox' && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2.5 rounded-xl text-xs">
              <span className="text-base leading-none shrink-0">📥</span>
              <div>
                <p className="font-bold">Delivered to inbox</p>
                <p className="text-amber-700 mt-0.5 leading-relaxed">
                  The notification was saved to {patient.name}'s Notification Center.
                  Push alert wasn't sent because they haven't enabled browser notifications yet.
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-surface-border text-text-secondary text-xs font-semibold hover:bg-surface-elevated transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === 'sending' || status === 'sent' || status === 'inbox' || !title.trim() || !body.trim()}
              className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                status === 'sent'
                  ? 'bg-emerald-500 text-white'
                  : status === 'inbox'
                  ? 'bg-amber-500 text-white'
                  : status === 'sending'
                  ? 'bg-primary/60 text-white cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-dark text-white hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0'
              }`}
            >
              {status === 'sent' ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Sent!
                </>
              ) : status === 'inbox' ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
                  </svg>
                  In Inbox
                </>
              ) : status === 'sending' ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  Send Notification
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
