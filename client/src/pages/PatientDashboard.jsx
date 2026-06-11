import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import StatCard from '../components/StatCard'
import SugarLineChart from '../charts/SugarLineChart'
import ReadingPieChart from '../charts/ReadingPieChart'
import ActivityHeatmap from '../charts/ActivityHeatmap'
import NotificationSettingsPanel from '../components/NotificationSettingsPanel'
import NotificationPermissionBanner from '../components/NotificationPermissionBanner'
import { addReading, getReadings, getStats } from '../services/readingService'
import api from '../services/api'
import { io } from 'socket.io-client'

const meals = ['Breakfast', 'Lunch', 'Dinner']
const timings = ['Before Meal', 'After Meal']

function SmartInsights({ readings = [], stats }) {
  if (readings.length === 0 || !stats) return null
  const outOfBounds = readings.filter(r => r.sugar_level < 80 || r.sugar_level > 140).length
  const inBounds = readings.length - outOfBounds
  const score = Math.max(40, Math.round((inBounds / readings.length) * 100))

  let insight = "Your sugar levels are highly stable and within the healthy biometric target. Keep doing what you are doing!"
  let riskLevel = "Normal / Optimal"
  let riskColor = "text-emerald-600 bg-emerald-500/10"
  if (score < 60) {
    insight = "Alert: High glycemic variance detected in post-meal readings. Consider discussing your insulin or medication ratios with your doctor."
    riskLevel = "High Variability"
    riskColor = "text-rose-600 bg-rose-500/10"
  } else if (score < 80) {
    insight = "Advisory: We noticed a couple of readings leaning high. Minor adjustments to your lunch or dinner carb counts could assist."
    riskLevel = "Moderate Variance"
    riskColor = "text-amber-600 bg-amber-500/10"
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-primary-100/30 rounded-2xl border border-primary-100/50 p-6 shadow-soft hover-lift transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
            <span className="text-[10px] font-bold text-primary tracking-wider uppercase">Smart Bio-Insights</span>
          </div>
          <h4 className="text-base font-bold text-text-heading">Glycemic Health Analysis</h4>
          <p className="text-xs text-text-secondary leading-relaxed max-w-xl">{insight}</p>
        </div>
        <div className="flex items-center gap-5 pl-0 md:pl-6 border-l-0 md:border-l border-surface-border">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="28" className="stroke-surface-elevated stroke-[5] fill-none" />
              <circle cx="32" cy="32" r="28" className="stroke-primary stroke-[5] fill-none transition-all duration-500"
                strokeDasharray={176} strokeDashoffset={176 - (176 * score) / 100} strokeLinecap="round" />
            </svg>
            <span className="absolute text-sm font-bold text-text-heading">{score}%</span>
          </div>
          <div>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Stability Rating</p>
            <p className={`text-[11px] font-semibold px-2.5 py-1 rounded-full mt-1.5 inline-block ${riskColor}`}>{riskLevel}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityTracker() {
  const [water, setWater] = useState(3)
  const maxWater = 8
  const [steps, setSteps] = useState(6230)
  const maxSteps = 10000
  const [mood, setMood] = useState(null)

  const moods = [
    { emoji: '😊', label: 'Great', color: 'bg-emerald-500' },
    { emoji: '😐', label: 'Okay', color: 'bg-amber-500' },
    { emoji: '😔', label: 'Low', color: 'bg-rose-500' },
  ]

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft hover-lift transition-all duration-300">
      <h3 className="text-base font-bold text-text-heading mb-1">Wellness Tracker</h3>
      <p className="text-text-secondary text-xs mb-5">Daily physiological logs</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Water */}
        <div className="flex flex-col items-center p-3 bg-surface-elevated/40 rounded-xl border border-surface-border/50 hover:border-sky-300/50 transition-colors group">
          <p className="text-xs font-bold text-text-heading">Hydration</p>
          <p className="text-[10px] text-text-muted mt-0.5">{water} / {maxWater} cups</p>
          <div onClick={() => water < maxWater && setWater(w => w + 1)}
            className="w-10 h-16 border-2 border-sky-300/40 rounded-b-xl rounded-t-sm relative my-3 overflow-hidden bg-surface cursor-pointer group-hover:border-sky-400/60 transition-colors flex items-end justify-center shadow-inner">
            <div className="bg-sky-400/50 w-full transition-all duration-500 ease-out relative" style={{ height: `${(water / maxWater) * 100}%` }}>
              <div className="absolute inset-x-0 -top-1 h-2 bg-sky-300/30 animate-pulse rounded-t-full" />
            </div>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-text-secondary">+ Add</span>
          </div>
          <p className="text-[9px] text-text-muted">Tap to add</p>
        </div>

        {/* Steps */}
        <div className="flex flex-col items-center p-3 bg-surface-elevated/40 rounded-xl border border-surface-border/50 hover:border-emerald-300/50 transition-colors group">
          <p className="text-xs font-bold text-text-heading">Activity</p>
          <p className="text-[10px] text-text-muted mt-0.5">{steps.toLocaleString()} steps</p>
          <div className="relative w-16 h-16 flex items-center justify-center my-2">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="26" className="stroke-surface-border stroke-[4] fill-none" />
              <circle cx="32" cy="32" r="26" className="stroke-emerald-400 stroke-[4] fill-none transition-all duration-700"
                strokeDasharray={163} strokeDashoffset={163 - (163 * steps) / maxSteps} strokeLinecap="round" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-[11px] font-extrabold text-text-heading">{Math.round((steps / maxSteps) * 100)}%</span>
            </div>
          </div>
          <button onClick={() => setSteps(s => Math.min(maxSteps, s + 1000))}
            className="text-[9px] font-bold text-primary hover:underline cursor-pointer">
            + 1k Steps
          </button>
        </div>
      </div>

      {/* Mood */}
      <div>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Today's Mood</p>
        <div className="flex gap-2">
          {moods.map(m => (
            <button
              key={m.label}
              onClick={() => setMood(m.label)}
              className={`flex-1 py-2 rounded-xl border transition-all text-sm cursor-pointer hover:-translate-y-0.5 ${
                mood === m.label
                  ? `${m.color} border-transparent text-white shadow-sm`
                  : 'border-surface-border hover:border-primary/30 bg-surface-elevated/40'
              }`}
              title={m.label}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function HealthProfileCard({ user }) {
  const profileItems = [
    user?.bloodType && { icon: '🩸', label: 'Blood Type', value: user.bloodType },
    user?.dateOfBirth && { icon: '🎂', label: 'Date of Birth', value: new Date(user.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) },
    user?.emergencyContact && { icon: '🆘', label: 'Emergency', value: user.emergencyContact },
    user?.phone && { icon: '📱', label: 'Phone', value: user.phone },
  ].filter(Boolean)

  if (profileItems.length === 0) return null

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border p-5 shadow-soft hover-lift transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-xl bg-primary-50 text-primary flex items-center justify-center text-sm">🏥</div>
        <div>
          <h3 className="text-sm font-bold text-text-heading">Health Profile</h3>
          <p className="text-[10px] text-text-muted">Registered patient details</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {profileItems.map(item => (
          <div key={item.label} className="bg-surface-elevated/60 rounded-xl px-3 py-2.5 hover:bg-surface-elevated transition-colors">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm">{item.icon}</span>
              <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider">{item.label}</span>
            </div>
            <p className="text-xs font-bold text-text-heading truncate">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [readings, setReadings] = useState([])
  const [stats, setStats] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ mealType: 'Breakfast', timing: 'Before Meal', sugarLevel: '' })
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('month')

  const [prescriptions, setPrescriptions] = useState([
    { id: '1', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', time: 'With meals', status: 'Taken' },
    { id: '2', name: 'Jardiance', dosage: '10mg', frequency: 'Once daily', time: 'Morning', status: 'Pending' },
    { id: '3', name: 'Lantus Insulin', dosage: '12 units', frequency: 'Once daily', time: 'Bedtime', status: 'Pending' }
  ])

  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [socket, setSocket] = useState(null)
  const [linkedDoctor, setLinkedDoctor] = useState(null)
  const [linkedCaretaker, setLinkedCaretaker] = useState(null)
  const [careSearch, setCareSearch] = useState('')
  const [careResults, setCareResults] = useState([])
  const [careSearchLoading, setCareSearchLoading] = useState(false)
  const [outgoingRequests, setOutgoingRequests] = useState([])

  const activeDoctorId = linkedDoctor?.user_id || 'd-uuid-1'

  const fetchData = async () => {
    try {
      const docRes = await api.get('/doctor/my-doctor')
      const activeDoc = docRes.data.doctor
      const activeCT = docRes.data.caretaker
      setLinkedDoctor(activeDoc)
      setLinkedCaretaker(activeCT)
      const docIdToFetch = activeDoc ? activeDoc.user_id : 'd-uuid-1'
      const [readRes, statRes, msgRes] = await Promise.all([
        getReadings(user.id, filter),
        getStats(user.id),
        api.get(`/messages/${docIdToFetch}`)
      ])
      setReadings(readRes.data)
      setStats(statRes.data)
      setMessages(msgRes.data)
    } catch {
      const dummyReadings = [
        { reading_id: '1', sugar_level: 110, meal_type: 'Breakfast', timing: 'Before Meal', status: 'Normal', recorded_at: new Date(Date.now() - 86400000 * 4).toISOString() },
        { reading_id: '2', sugar_level: 155, meal_type: 'Lunch', timing: 'After Meal', status: 'High', recorded_at: new Date(Date.now() - 86400000 * 3).toISOString() },
        { reading_id: '3', sugar_level: 130, meal_type: 'Dinner', timing: 'After Meal', status: 'Normal', recorded_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { reading_id: '4', sugar_level: 72, meal_type: 'Breakfast', timing: 'Before Meal', status: 'Low', recorded_at: new Date(Date.now() - 86400000 * 1).toISOString() },
        { reading_id: '5', sugar_level: 118, meal_type: 'Lunch', timing: 'Before Meal', status: 'Normal', recorded_at: new Date().toISOString() }
      ]
      setReadings(dummyReadings)
      setStats({ avg_level: 117, min_level: 72, max_level: 155, total_readings: 5 })
      setMessages([
        { message_id: 'm-1', sender_id: 'd-uuid-1', receiver_id: 'p-uuid-1', sender_name: 'Dr. Sarah Jenkins', sender_role: 'Doctor', message_text: 'Your morning fasting blood sugars are looking much more stable. Keep up the great work!', sent_at: new Date(Date.now() - 3600000 * 4).toISOString() },
        { message_id: 'm-2', sender_id: 'p-uuid-1', receiver_id: 'd-uuid-1', sender_name: 'You', sender_role: 'Patient', message_text: 'Thank you! I have been walking for 20 minutes after dinner as well.', sent_at: new Date(Date.now() - 3600000 * 3).toISOString() }
      ])
    }
  }

  const fetchMyRequests = async () => {
    try {
      const { data } = await api.get('/doctor/requests/mine')
      setOutgoingRequests(data)
    } catch {}
  }

  const handleCareSearch = async (e) => {
    e.preventDefault()
    if (!careSearch.trim() || careSearch.length < 2) return
    setCareSearchLoading(true)
    try {
      const { data } = await api.get(`/doctor/search?q=${encodeURIComponent(careSearch)}`)
      setCareResults(data)
    } catch { setCareResults([]) }
    finally { setCareSearchLoading(false) }
  }

  const handleSendRequest = async (toId) => {
    try {
      await api.post('/doctor/request', { toId })
      await fetchMyRequests()
      setCareResults([])
      setCareSearch('')
    } catch {}
  }

  useEffect(() => {
    const s = io(window.location.origin)
    setSocket(s)
    if (user?.id) s.emit('register', user.id)
    s.on('newMessage', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.message_id === msg.message_id)) return prev
        return [...prev, msg]
      })
    })
    return () => s.disconnect()
  }, [user])

  useEffect(() => {
    if (pathname === '/messages') {
      const el = document.getElementById('chat-consultation-section')
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => el.querySelector('input')?.focus(), 800) }
    } else if (pathname === '/readings') {
      document.getElementById('readings-trends-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (pathname === '/dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [pathname])

  useEffect(() => { fetchData(); fetchMyRequests() }, [filter])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.sugarLevel) return
    setSaving(true)
    try {
      await addReading({ mealType: form.mealType, timing: form.timing, sugarLevel: parseInt(form.sugarLevel) })
      setShowForm(false)
      setForm({ mealType: 'Breakfast', timing: 'Before Meal', sugarLevel: '' })
      fetchData()
    } catch {
      const level = parseInt(form.sugarLevel)
      const newStatus = level > 140 ? 'High' : level < 80 ? 'Low' : 'Normal'
      const newEntry = { reading_id: String(Date.now()), sugar_level: level, meal_type: form.mealType, timing: form.timing, status: newStatus, recorded_at: new Date().toISOString() }
      const updated = [...readings, newEntry]
      setReadings(updated)
      const levels = updated.map(r => r.sugar_level)
      setStats({ avg_level: Math.round(levels.reduce((a,b)=>a+b,0)/levels.length), min_level: Math.min(...levels), max_level: Math.max(...levels), total_readings: updated.length })
      setShowForm(false)
      setForm({ mealType: 'Breakfast', timing: 'Before Meal', sugarLevel: '' })
    } finally { setSaving(false) }
  }

  const togglePrescription = (id) => {
    setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'Taken' ? 'Pending' : 'Taken' } : p))
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    const textToSend = newMessage
    setNewMessage('')
    try {
      const { data } = await api.post('/messages/send', { receiverId: activeDoctorId, text: textToSend })
      setMessages(prev => [...prev, data])
      if (socket) socket.emit('sendMessage', data)
    } catch {
      const msg = { message_id: String(Date.now()), sender_id: user.id || 'p-uuid-1', receiver_id: activeDoctorId, sender_name: 'You', sender_role: 'Patient', message_text: textToSend, sent_at: new Date().toISOString() }
      setMessages(prev => [...prev, msg])
    }
  }

  const filteredReadings = useMemo(() => {
    const now = Date.now()
    const cutoff = filter === 'week' ? now - 7*86400000 : filter === 'month' ? now - 30*86400000 : now - 365*86400000
    return readings.filter(r => new Date(r.recorded_at).getTime() >= cutoff)
  }, [readings, filter])

  const filteredStats = useMemo(() => {
    if (filteredReadings.length === 0) return stats
    const levels = filteredReadings.map(r => r.sugar_level)
    return { avg_level: Math.round(levels.reduce((a,b)=>a+b,0)/levels.length), min_level: Math.min(...levels), max_level: Math.max(...levels), total_readings: filteredReadings.length }
  }, [filteredReadings, stats])

  const filterLabel = filter === 'week' ? '7 Days' : filter === 'month' ? '30 Days' : '12 Months'
  const getStatusColor = (level) => !level ? 'Normal' : level > 140 ? 'High' : level < 80 ? 'Low' : 'Normal'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex h-screen bg-surface transition-colors duration-200">
      <Sidebar role="Patient" />
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
        <Navbar title="Glucolyse Overview" />
        <NotificationPermissionBanner />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-4">
              {/* Profile photo */}
              <div className="relative shrink-0">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/20 shadow-md" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-xl font-extrabold text-white shadow-md">
                    {user?.name?.charAt(0)}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-surface rounded-full" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-heading">
                  {greeting}, {user?.name?.split(' ')[0]}
                </h2>
                <p className="text-text-secondary text-sm mt-0.5">Here is your daily medical update and sugar analytics.</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-text-secondary">
                  {linkedDoctor ? (
                    <span className="flex items-center gap-1">🩺 <strong className="text-primary">{linkedDoctor.name}</strong></span>
                  ) : (
                    <span className="text-text-muted italic">No doctor linked yet</span>
                  )}
                  {linkedCaretaker && (
                    <>
                      <span className="hidden sm:inline text-text-muted">·</span>
                      <span className="flex items-center gap-1">🤝 <strong className="text-primary">{linkedCaretaker.name}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md hover:shadow-primary/20 hover:-translate-y-0.5 cursor-pointer flex items-center gap-2 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Log Blood Sugar
            </button>
          </div>

          {/* ── Add Entry Card ── */}
          {showForm && (
            <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card p-6 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-text-heading">Log Sugar Reading</h3>
                <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-secondary cursor-pointer p-1 rounded-lg hover:bg-surface-elevated transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Meal Type</label>
                  <select value={form.mealType} onChange={e => setForm(f => ({ ...f, mealType: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-surface-border bg-surface text-text-body focus:outline-none focus:border-primary hover:border-primary/50 transition-colors">
                    {meals.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Timing</label>
                  <select value={form.timing} onChange={e => setForm(f => ({ ...f, timing: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-surface-border bg-surface text-text-body focus:outline-none focus:border-primary hover:border-primary/50 transition-colors">
                    {timings.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Level (mg/dL)</label>
                  <input type="number" required min="20" max="600" placeholder="e.g. 110" value={form.sugarLevel}
                    onChange={e => setForm(f => ({ ...f, sugarLevel: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-surface-border bg-surface text-text-body focus:outline-none focus:border-primary hover:border-primary/50 transition-colors" />
                </div>
                <button type="submit" disabled={saving}
                  className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold text-sm rounded-lg shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer disabled:opacity-50">
                  {saving ? 'Saving...' : 'Submit Entry'}
                </button>
              </form>
            </div>
          )}

          {/* ── Smart Insights ── */}
          <SmartInsights readings={filteredReadings} stats={filteredStats} />

          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard title={`Average Level (${filterLabel})`} value={filteredStats?.avg_level || '--'} trend={getStatusColor(filteredStats?.avg_level)}
              icon={<svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2" /></svg>} />
            <StatCard title={`Minimum Level (${filterLabel})`} value={filteredStats?.min_level || '--'} trend="Low" color="bg-amber-500/10 text-amber-500"
              icon={<svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>} />
            <StatCard title={`Maximum Level (${filterLabel})`} value={filteredStats?.max_level || '--'} trend="High" color="bg-rose-500/10 text-rose-500"
              icon={<svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>} />
          </div>

          {/* ── Activity Heatmap ── */}
          <div className="animate-fade-in">
            <ActivityHeatmap data={readings} />
          </div>

          {/* ── Charts ── */}
          <div id="readings-trends-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft hover-lift transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-text-heading">Sugar Trends</h3>
                  <p className="text-text-secondary text-xs mt-0.5">Breakfast · Lunch · Dinner readings</p>
                </div>
                <div className="flex gap-1 bg-surface-elevated rounded-lg p-1">
                  {[['week', 'Week'], ['month', 'Month'], ['year', 'Year']].map(([val, label]) => (
                    <button key={val} onClick={() => setFilter(val)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${filter === val ? 'bg-white dark:bg-slate-700 text-text-heading shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <SugarLineChart data={filteredReadings} />
            </div>
            <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft hover-lift transition-all duration-300">
              <h3 className="text-base font-bold text-text-heading mb-1">Log Breakdown</h3>
              <p className="text-text-secondary text-xs mb-4">High · Low · Normal distribution ({filterLabel})</p>
              <ReadingPieChart data={filteredReadings} />
            </div>
          </div>

          {/* ── Lower Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Medications */}
            <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft hover-lift transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-text-heading">Today's Prescriptions</h3>
                  <p className="text-text-secondary text-xs mt-0.5">Tick pills when consumed</p>
                </div>
                <span className="bg-primary-50 text-primary text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full">
                  {prescriptions.filter(p => p.status === 'Taken').length}/{prescriptions.length} Taken
                </span>
              </div>
              <div className="divide-y divide-surface-border">
                {prescriptions.map((pill) => (
                  <div key={pill.id} className="checklist-item py-3.5 flex items-center justify-between gap-4 rounded-xl px-2">
                    <div className="flex items-start gap-3">
                      <button onClick={() => togglePrescription(pill.id)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer hover:scale-110 ${pill.status === 'Taken' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-primary'}`}>
                        {pill.status === 'Taken' && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                      <div>
                        <p className={`text-sm font-semibold transition-all ${pill.status === 'Taken' ? 'line-through text-text-muted font-normal' : 'text-text-body'}`}>
                          {pill.name} <span className="text-xs text-text-muted font-normal">({pill.dosage})</span>
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5">{pill.frequency} · {pill.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wellness */}
            <ActivityTracker />

            {/* Chat */}
            <div id="chat-consultation-section" className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft flex flex-col h-[340px] lg:h-auto justify-between hover-lift transition-all duration-300">
              <div className="flex items-center gap-3 pb-3 border-b border-surface-border">
                <div className="relative">
                  {linkedDoctor?.photoUrl ? (
                    <img src={linkedDoctor.photoUrl} alt={linkedDoctor.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/20" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary-50 text-primary flex items-center justify-center font-bold text-sm">
                      {linkedDoctor ? linkedDoctor.name?.charAt(0) : 'Dr'}
                    </div>
                  )}
                  {linkedDoctor && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-surface-card rounded-full" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-heading">Care Team Advice</h3>
                  <p className="text-[11px] text-text-secondary">
                    {linkedDoctor ? `Direct channel to ${linkedDoctor.name}` : 'Connect with your doctor'}
                  </p>
                </div>
              </div>

              {!linkedDoctor ? (
                <div className="flex-1 flex flex-col justify-center py-4 gap-4">
                  {outgoingRequests.filter(r => r.status === 'pending').length > 0 && (
                    <div className="mx-1 space-y-2">
                      <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Pending Requests</p>
                      {outgoingRequests.filter(r => r.status === 'pending').map(r => (
                        <div key={r.request_id} className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2.5">
                          <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 text-[10px] font-bold shrink-0">{r.to_name?.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-text-heading truncate">{r.to_name}</p>
                            <p className="text-[9px] text-amber-600 font-semibold">{r.to_role} · Awaiting response</p>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-center mb-1">
                    <div className="w-10 h-10 rounded-full bg-primary-50 text-primary flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h4 className="text-xs font-bold text-text-heading">Find Your Care Team</h4>
                    <p className="text-[10px] text-text-secondary mt-0.5">Search by doctor or caretaker</p>
                  </div>
                  <form onSubmit={handleCareSearch} className="flex gap-2">
                    <input type="text" placeholder="Name or email..." value={careSearch} onChange={e => setCareSearch(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-surface-border focus:outline-none focus:border-primary bg-surface text-text-body placeholder-text-muted" />
                    <button type="submit" disabled={careSearchLoading}
                      className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shrink-0">
                      {careSearchLoading ? '...' : 'Search'}
                    </button>
                  </form>
                  {careResults.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {careResults.map(prof => {
                        const alreadySent = outgoingRequests.some(r => r.to_id === prof.user_id && r.status === 'pending')
                        return (
                          <div key={prof.user_id} className="flex items-center gap-2 bg-surface-elevated rounded-xl px-3 py-2.5 border border-surface-border hover:border-primary/30 transition-colors">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[11px] font-bold shrink-0">{prof.name?.charAt(0)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-text-heading truncate">{prof.name}</p>
                              <p className="text-[9px] text-text-secondary truncate">{prof.email}</p>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${prof.role === 'Doctor' ? 'bg-blue-500/10 text-blue-600' : 'bg-purple-500/10 text-purple-600'}`}>{prof.role}</span>
                            <button onClick={() => handleSendRequest(prof.user_id)} disabled={alreadySent}
                              className="ml-1 px-2.5 py-1 bg-primary hover:bg-primary-dark text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-40 shrink-0">
                              {alreadySent ? '✓ Sent' : 'Request'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto space-y-3 my-4 pr-1 text-xs max-h-[170px]">
                    {messages.map((msg) => (
                      <div key={msg.message_id || msg.sent_at} className={`flex flex-col ${msg.sender_id === user.id ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] text-text-muted font-medium mb-0.5">
                          {msg.sender_id === user.id ? 'You' : msg.sender_name} · {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${msg.sender_id === user.id ? 'bg-primary text-white rounded-tr-none' : 'bg-surface-elevated text-text-body rounded-tl-none'}`}>
                          {msg.message_text}
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input type="text" placeholder="Ask your doctor..." value={newMessage} onChange={e => setNewMessage(e.target.value)}
                      className="flex-1 px-4 py-2 text-xs rounded-lg border border-surface-border focus:outline-none focus:border-primary bg-surface text-text-body placeholder-text-muted" />
                    <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer hover:shadow-sm">
                      Send
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* ── Health Profile Card ── */}
          {(user?.bloodType || user?.dateOfBirth || user?.emergencyContact || user?.phone) && (
            <HealthProfileCard user={user} />
          )}

          {/* ── Notification Settings ── */}
          <NotificationSettingsPanel />

        </main>
      </div>
    </div>
  )
}
