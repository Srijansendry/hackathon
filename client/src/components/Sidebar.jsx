import React, { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMobileNav } from '../context/MobileNavContext'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = {
  Patient: [
    { to: '/dashboard',     label: 'Overview',      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
    { to: '/readings',      label: 'Readings',      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { to: '/messages',      label: 'Messages',      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { to: '/notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { to: '/profile',       label: 'My Profile',    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ],
  Doctor: [
    { to: '/dashboard',     label: 'Patients',      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { to: '/messages',      label: 'Messages',      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { to: '/notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { to: '/profile',       label: 'My Profile',    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ],
  Caretaker: [
    { to: '/dashboard',     label: 'Care Center',   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { to: '/messages',      label: 'Messages',      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { to: '/notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { to: '/profile',       label: 'My Profile',    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ],
}

const roleAccents = {
  Patient:   { from: '#ef4444', to: '#487ba4', badge: 'bg-rose-500/15 text-rose-300' },
  Doctor:    { from: '#487ba4', to: '#38bdf8', badge: 'bg-sky-500/15 text-sky-300' },
  Caretaker: { from: '#10b981', to: '#06b6d4', badge: 'bg-emerald-500/15 text-emerald-300' },
}

function SidebarContent({ role, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const items = navItems[role] || navItems.Patient
  const accent = roleAccents[role] || roleAccents.Patient

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col w-64 bg-gradient-to-b from-[#0d1526] via-[#0f1a2e] to-[#070c18] text-white h-full border-r border-white/[0.04] relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-60"
        style={{ background: `radial-gradient(circle, ${accent.from}22, transparent 70%)` }} />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40"
        style={{ background: `radial-gradient(circle, ${accent.to}18, transparent 70%)` }} />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="p-5 border-b border-white/[0.06] relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${accent.from}cc, ${accent.to}cc)` }}>
            <div className="absolute inset-0 bg-white/10" />
            <svg className="w-5 h-5 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
            </svg>
          </div>
          <div>
            <span className="text-[18px] font-black tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Glucolyse
            </span>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">{role} Portal</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5 relative z-10 mt-3">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600 px-3 mb-3">Navigation</p>
        {items.map((item, i) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide relative overflow-hidden transition-all duration-250 group ${
                isActive
                  ? 'bg-white/[0.08] text-white border border-white/[0.08] shadow-inner'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-2/3 rounded-r-full"
                    style={{ background: `linear-gradient(to bottom, ${accent.from}, ${accent.to})` }} />
                )}
                {isActive && (
                  <div className="absolute inset-0 rounded-xl opacity-30"
                    style={{ background: `linear-gradient(135deg, ${accent.from}20, ${accent.to}10)` }} />
                )}
                <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'shadow-sm'
                    : 'group-hover:scale-110'
                }`}
                  style={isActive ? { background: `linear-gradient(135deg, ${accent.from}40, ${accent.to}30)` } : {}}>
                  <svg className={`w-4.5 h-4.5 transition-all duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <span className="relative z-10">{item.label}</span>
                {isActive && (
                  <div className="ml-auto relative z-10 w-1.5 h-1.5 rounded-full"
                    style={{ background: accent.from }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/[0.06] relative z-10">
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl border border-white/[0.06] hover:border-white/[0.1] transition-all duration-300 group"
          style={{ background: `linear-gradient(135deg, ${accent.from}10, ${accent.to}08)` }}>
          <div className="relative shrink-0">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt={user?.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20" />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white shadow-md"
                style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}>
                {user?.name?.charAt(0)}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0d1526] rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-slate-100 tracking-wide">{user?.name}</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 px-1.5 py-0.5 rounded-full inline-block ${accent.badge}`}>{user?.role}</p>
            {user?.specialty && (
              <p className="text-[9px] text-slate-500 truncate mt-0.5">{user.specialty}</p>
            )}
          </div>
          <button onClick={handleLogout} title="Log Out"
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all cursor-pointer shrink-0 group-hover:opacity-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ role }) {
  const { isOpen, close } = useMobileNav()

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 min-h-screen">
        <SidebarContent role={role} onClose={null} />
      </aside>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className="fixed inset-y-0 left-0 z-50 lg:hidden flex flex-col"
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <SidebarContent role={role} onClose={close} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
