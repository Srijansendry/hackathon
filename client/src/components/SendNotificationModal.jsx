import { useState } from 'react'
import api from '../services/api'

const PRESETS = [
  { label: '🔴 High Glucose Alert', title: 'High Glucose Alert', body: 'Your blood sugar level is elevated. Please check your readings and take action if needed.' },
  { label: '💊 Medication Reminder', title: 'Medication Reminder', body: "It's time to take your medication. Please don't skip your scheduled dose." },
  { label: '📋 Check In', title: 'Check In', body: 'Please log your latest blood sugar reading when you get a chance.' },
  { label: '🚨 Urgent: Contact Doctor', title: 'Urgent: Contact Your Doctor', body: 'Please contact your doctor immediately regarding your recent readings.' },
]

export default function SendNotificationModal({ patient, onClose }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const applyPreset = (preset) => {
    setTitle(preset.title)
    setBody(preset.body)
    setError(null)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setStatus('sending')
    setError(null)
    try {
      await api.post('/notifications/push', {
        userId: patient.user_id,
        title: title.trim(),
        body: body.trim()
      })
      setStatus('sent')
      setTimeout(onClose, 1800)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.reason || 'Failed to send notification')
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
        {/* Header */}
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
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-text-body transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Presets */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Quick Presets</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-left px-3 py-2 rounded-xl border border-surface-border bg-surface-elevated hover:border-primary/40 hover:bg-primary/5 text-[11px] font-medium text-text-body transition-all cursor-pointer leading-tight"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Notification title..."
              maxLength={100}
              required
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-surface-border bg-surface text-text-body focus:outline-none focus:border-primary placeholder-text-muted hover:border-primary/40 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your message to the patient..."
              rows={3}
              maxLength={300}
              required
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-surface-border bg-surface text-text-body focus:outline-none focus:border-primary placeholder-text-muted hover:border-primary/40 transition-colors resize-none leading-relaxed"
            />
            <p className="text-[10px] text-text-muted text-right mt-0.5">{body.length}/300</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-surface-border text-text-secondary text-xs font-semibold hover:bg-surface-elevated transition-all cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === 'sending' || status === 'sent' || !title.trim() || !body.trim()}
              className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                status === 'sent'
                  ? 'bg-emerald-500 text-white'
                  : status === 'sending'
                  ? 'bg-primary/60 text-white cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-dark text-white hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0'
              }`}
            >
              {status === 'sent' ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Sent!
                </>
              ) : status === 'sending' ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Sending...
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
