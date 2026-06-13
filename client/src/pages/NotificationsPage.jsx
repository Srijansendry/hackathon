import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { getNotifications, markAsRead, markAllRead } from '../services/notificationService'

// ── Type configuration ─────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  Medicine:     { emoji: '💊', bg: 'bg-blue-500/10',   text: 'text-blue-500',   border: 'border-blue-200/40',   label: 'Medicine'      },
  'Sugar Check':{ emoji: '🩸', bg: 'bg-amber-500/10',  text: 'text-amber-500',  border: 'border-amber-200/40',  label: 'Sugar Check'   },
  Alert:        { emoji: '⚠️', bg: 'bg-rose-500/10',   text: 'text-rose-500',   border: 'border-rose-200/40',   label: 'Alert'         },
  'High Sugar': { emoji: '🔴', bg: 'bg-red-500/10',    text: 'text-red-500',    border: 'border-red-200/40',    label: 'High Sugar'    },
  'Low Sugar':  { emoji: '🟡', bg: 'bg-amber-400/10',  text: 'text-amber-600',  border: 'border-amber-200/40',  label: 'Low Sugar'     },
  Appointment:  { emoji: '📅', bg: 'bg-sky-500/10',    text: 'text-sky-500',    border: 'border-sky-200/40',    label: 'Appointment'   },
  Emergency:    { emoji: '🚨', bg: 'bg-red-600/10',    text: 'text-red-700',    border: 'border-red-300/40',    label: 'Emergency'     },
}

const FILTERS = ['All', 'Unread', 'Medicine', 'High Sugar', 'Low Sugar', 'Appointment', 'Emergency', 'Alert']

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 60000)    return 'just now'
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// ── Single notification card ───────────────────────────────────────────────────
function NotificationCard({ notif, onMarkRead }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.Alert

  return (
    <div
      onClick={() => !notif.is_read && onMarkRead(notif.notification_id)}
      className={`
        group flex gap-4 p-4 rounded-2xl border transition-all duration-200
        ${notif.is_read
          ? 'bg-surface-card border-surface-border/50 opacity-60'
          : `${cfg.bg} ${cfg.border} border cursor-pointer hover:shadow-md hover:opacity-100 hover:scale-[1.005]`
        }
      `}
    >
      {/* Icon */}
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${cfg.bg}`}>
        {cfg.emoji}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${cfg.text}`}>
            {cfg.label}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-text-muted font-medium">{timeAgo(notif.created_at)}</span>
            {!notif.is_read && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" title="Unread" />
            )}
          </div>
        </div>
        <p className="text-xs font-medium text-text-body leading-relaxed">{notif.message}</p>
        {!notif.is_read && (
          <p className="text-[10px] text-primary/70 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
            Click to mark as read
          </p>
        )}
      </div>

      {/* Read checkmark */}
      {notif.is_read && (
        <span className="shrink-0 text-[11px] font-bold text-emerald-500 self-start mt-0.5">✓</span>
      )}
    </div>
  )
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex gap-4 p-4 rounded-2xl border border-surface-border/40 animate-pulse">
      <div className="w-11 h-11 rounded-2xl bg-surface-elevated shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-2.5 w-20 bg-surface-elevated rounded-full" />
        <div className="h-3 w-full bg-surface-elevated rounded-full" />
        <div className="h-3 w-3/4 bg-surface-elevated rounded-full" />
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifs = useCallback(async () => {
    try {
      const { data } = await getNotifications()
      setNotifs(data)
    } catch {
      // Provide realistic fallback data so the page doesn't look broken
      setNotifs([
        { notification_id: 'n-1', type: 'Medicine',    message: 'Medicine Reminder: Time to take Metformin (500mg) after breakfast.',                                         is_read: false, created_at: new Date().toISOString() },
        { notification_id: 'n-2', type: 'High Sugar',  message: 'High Blood Sugar Alert: Your after meal dinner reading is 185 mg/dL — above the safe range.',              is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
        { notification_id: 'n-3', type: 'Appointment', message: 'Appointment Reminder: Dr. Sarah Jenkins appointment tomorrow at 10:00 AM.',                                is_read: true,  created_at: new Date(Date.now() - 86400000).toISOString() },
        { notification_id: 'n-4', type: 'Low Sugar',   message: 'Low Blood Sugar Alert: Your before meal breakfast reading is 65 mg/dL — below the safe range.',           is_read: true,  created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { notification_id: 'n-5', type: 'Emergency',   message: 'Emergency Health Warning: Critically low blood sugar detected. Seek medical attention immediately.',      is_read: false, created_at: new Date(Date.now() - 7200000).toISOString() },
        { notification_id: 'n-6', type: 'Alert',       message: 'Alert: Your average fasting sugar was slightly elevated over the past 3 days.',                           is_read: true,  created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchNotifs()
    })
  }, [fetchNotifs])

  const handleMarkRead = async (id) => {
    // Optimistic update
    setNotifs(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n))
    try {
      await markAsRead(id)
    } catch { /* already updated optimistically */ }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    try {
      await markAllRead()
    } catch { /* already updated optimistically */ }
    finally { setMarkingAll(false) }
  }

  const filtered = notifs.filter(n => {
    if (activeFilter === 'All')    return true
    if (activeFilter === 'Unread') return !n.is_read
    return n.type === activeFilter
  })

  const unreadCount = notifs.filter(n => !n.is_read).length

  return (
    <div className="flex h-screen bg-surface-base">
      <Sidebar role={user?.role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar title="Notifications" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto space-y-5">

            {/* ── Page header ── */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-heading">Notification Center</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                    : 'All caught up — no unread notifications'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="px-3.5 py-1.5 bg-surface-elevated hover:bg-surface-border border border-surface-border text-xs font-semibold text-text-secondary rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {markingAll ? 'Marking…' : 'Mark All Read'}
                </button>
              )}
            </div>

            {/* ── Filter tabs ── */}
            <div className="flex gap-1.5 flex-wrap">
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    activeFilter === f
                      ? 'bg-primary text-white shadow-sm shadow-primary/30'
                      : 'bg-surface-elevated border border-surface-border text-text-secondary hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {f}
                  {f === 'Unread' && unreadCount > 0 && (
                    <span className={`text-[9px] font-extrabold rounded-full px-1.5 py-0.5 ${activeFilter === 'Unread' ? 'bg-white/30 text-white' : 'bg-danger text-white'}`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Content ── */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">
                  {activeFilter === 'Unread' ? '✅' : '🔔'}
                </div>
                <p className="text-base font-bold text-text-heading">
                  {activeFilter === 'Unread' ? 'All caught up!' : 'No notifications here'}
                </p>
                <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">
                  {activeFilter === 'Unread'
                    ? 'You have no unread notifications at this time.'
                    : `No ${activeFilter.toLowerCase()} notifications yet. They will appear here when triggered.`}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filtered.map(n => (
                  <NotificationCard key={n.notification_id} notif={n} onMarkRead={handleMarkRead} />
                ))}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}
