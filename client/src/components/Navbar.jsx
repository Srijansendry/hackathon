import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMobileNav } from '../context/MobileNavContext'
import { getUnreadCount, getNotifications, markAsRead, markAllRead } from '../services/notificationService'

// ── Notification type display config (all supported types) ────────────────────
const NOTIF_TYPE = {
  Medicine:     { bg: 'bg-blue-500/10',   text: 'text-blue-500',   emoji: '💊' },
  'Sugar Check':{ bg: 'bg-amber-500/10',  text: 'text-amber-500',  emoji: '🩸' },
  Alert:        { bg: 'bg-rose-500/10',   text: 'text-rose-500',   emoji: '⚠️' },
  'High Sugar': { bg: 'bg-red-500/10',    text: 'text-red-500',    emoji: '🔴' },
  'Low Sugar':  { bg: 'bg-amber-400/10',  text: 'text-amber-600',  emoji: '🟡' },
  Appointment:  { bg: 'bg-sky-500/10',    text: 'text-sky-500',    emoji: '📅' },
  Emergency:    { bg: 'bg-red-600/10',    text: 'text-red-700',    emoji: '🚨' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 60000)    return 'just now'
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function Navbar({ title }) {
  const { user } = useAuth()
  const { toggle: toggleMobileNav } = useMobileNav()
  const [unread, setUnread]           = useState(0)
  const [theme, setTheme]             = useState(localStorage.getItem('glucolyse_theme') || 'light')
  const [showNotifications, setShow]  = useState(false)
  const [notifs, setNotifs]           = useState([])
  const [loadingNotifs, setLoading]   = useState(false)
  const [markingAll, setMarkingAll]   = useState(false)
  const notifRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShow(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Apply theme
  useEffect(() => {
    document.documentElement.className = theme === 'light' ? '' : theme
    localStorage.setItem('glucolyse_theme', theme)
  }, [theme])

  // Poll unread count every 30 s
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await getUnreadCount()
        setUnread(data.count)
      } catch {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const { data } = await getNotifications()
      setNotifs(data)
      setUnread(data.filter(n => !n.is_read).length)
    } catch {
      setNotifs([
        { notification_id: 'n-1', type: 'Medicine',    message: 'Remember to take Metformin (500mg) after breakfast.',            is_read: false, created_at: new Date().toISOString() },
        { notification_id: 'n-2', type: 'High Sugar',  message: 'Your after-meal dinner reading is 185 mg/dL — above safe range.', is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
        { notification_id: 'n-3', type: 'Alert',       message: 'Your average fasting sugar was slightly elevated yesterday.',      is_read: true,  created_at: new Date(Date.now() - 86400000).toISOString() },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleBellClick = () => {
    setShow(v => !v)
    if (!showNotifications) fetchNotifications()
  }

  // Mark a single notification read (optimistic)
  const handleMarkRead = async (id) => {
    setNotifs(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
    try { await markAsRead(id) } catch {}
  }

  // Mark all read
  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnread(0)
    try { await markAllRead() } catch {}
    finally { setMarkingAll(false) }
  }

  const unreadNotifs = notifs.filter(n => !n.is_read).length

  return (
    <header className="sticky top-0 z-40 bg-surface-card/80 backdrop-blur-lg border-b border-surface-border transition-colors duration-200">
      <div className="flex items-center justify-between px-6 h-16">

        {/* Left: menu + title */}
        <div className="flex items-center gap-4">
          <button onClick={toggleMobileNav} className="lg:hidden p-2 rounded-lg hover:bg-surface-elevated cursor-pointer transition-colors">
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-text-heading tracking-tight">{title || 'Dashboard'}</h1>
        </div>

        <div className="flex items-center gap-3">

          {/* Theme selector */}
          <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl border border-surface-border/50">
            {[
              { id: 'light',   title: 'Light',   active: 'text-[#487ba4]',   icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M3 12h2.25m-.386-6.364l1.591 1.591M12 18.75a6.75 6.75 0 110-13.5 6.75 6.75 0 010 13.5z" /> },
              { id: 'dark',    title: 'Dark',    active: 'text-sky-400',     icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /> },
              { id: 'emerald', title: 'Emerald', active: 'text-emerald-500', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 0a9.003 9.003 0 017.372 3.864M12 3a9.003 9.003 0 00-7.372 3.864" /> },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={t.title}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  theme === t.id ? `bg-surface-card ${t.active} shadow-sm` : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {t.icon}
                </svg>
              </button>
            ))}
          </div>

          {/* ── Notification bell ── */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleBellClick}
              className={`relative p-2 rounded-xl hover:bg-surface-elevated transition-colors cursor-pointer text-text-secondary hover:text-primary ${showNotifications ? 'bg-surface-elevated text-primary' : ''}`}
              title="Notifications"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0" />
              </svg>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-fade-in">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {/* ── Dropdown panel ── */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-surface-card rounded-2xl border border-surface-border p-4 shadow-elevated z-50 animate-fade-in">

                {/* Header row */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-border/50">
                  <div>
                    <h4 className="text-xs font-bold text-text-heading">Notifications</h4>
                    {unreadNotifs > 0 && (
                      <p className="text-[9px] text-text-muted mt-0.5">{unreadNotifs} unread</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadNotifs > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        disabled={markingAll}
                        className="text-[9px] font-bold text-primary hover:text-primary-dark transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {markingAll ? 'Marking…' : 'Mark All Read'}
                      </button>
                    )}
                    <button onClick={() => setShow(false)} className="text-[10px] text-text-muted hover:text-text-secondary cursor-pointer font-semibold">
                      Close
                    </button>
                  </div>
                </div>

                {/* List */}
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {loadingNotifs ? (
                    <p className="text-[10px] text-text-secondary text-center py-4">Loading…</p>
                  ) : notifs.length === 0 ? (
                    <p className="text-[10px] text-text-secondary text-center py-6">All caught up! 🎉</p>
                  ) : (
                    notifs.map(notif => {
                      const cfg = NOTIF_TYPE[notif.type] || NOTIF_TYPE.Alert
                      return (
                        <div
                          key={notif.notification_id}
                          onClick={() => !notif.is_read && handleMarkRead(notif.notification_id)}
                          className={`flex gap-3 p-2.5 rounded-xl transition-all ${
                            notif.is_read
                              ? 'opacity-55'
                              : `${cfg.bg} border border-surface-border/30 cursor-pointer hover:shadow-sm hover:opacity-100`
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${cfg.bg}`}>
                            {cfg.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-1">
                              <span className={`text-[9px] font-extrabold uppercase tracking-wide ${cfg.text}`}>{notif.type}</span>
                              <span className="text-[8px] text-text-muted shrink-0">{timeAgo(notif.created_at)}</span>
                            </div>
                            <p className="text-[10px] font-medium text-text-body mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
                          </div>
                          {notif.is_read
                            ? <span className="text-[9px] font-bold text-emerald-500 shrink-0 mt-0.5">✓</span>
                            : <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                          }
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Footer link */}
                <div className="pt-3 mt-3 border-t border-surface-border/50 text-center">
                  <Link
                    to="/notifications"
                    onClick={() => setShow(false)}
                    className="text-[10px] font-bold text-primary hover:text-primary-dark transition-colors cursor-pointer"
                  >
                    View all notifications →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile badge */}
          <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-surface-border">
            <div className="relative group cursor-pointer">
              {user?.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-sm font-bold text-white shadow-sm group-hover:shadow-primary/30 group-hover:scale-105 transition-all">
                  {user?.name?.charAt(0)}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-surface-card rounded-full" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-heading leading-none">{user?.name}</p>
              <p className="text-[10px] text-text-muted font-semibold mt-0.5">{user?.role}</p>
            </div>
          </div>

        </div>
      </div>
    </header>
  )
}
