import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import StatCard from '../components/StatCard'
import SugarLineChart from '../charts/SugarLineChart'
import ActivityHeatmap from '../charts/ActivityHeatmap'
import NotificationSettingsPanel from '../components/NotificationSettingsPanel'
import SendNotificationModal from '../components/SendNotificationModal'
import api from '../services/api'
import { io } from 'socket.io-client'

// ── Glucose Gauge ─────────────────────────────────────────────────────────────
function GlucoseGauge({ avg, min, max }) {
  const safeAvg = avg || 0
  const risk = safeAvg > 140 ? 'High' : safeAvg < 80 ? 'Low' : 'Normal'
  const riskColor = { High: '#ef4444', Low: '#f59e0b', Normal: '#10b981' }[risk]
  const riskBg = { High: 'bg-rose-50 text-rose-600 border-rose-200', Low: 'bg-amber-50 text-amber-600 border-amber-200', Normal: 'bg-emerald-50 text-emerald-600 border-emerald-200' }[risk]
  const pct = safeAvg ? Math.min(100, Math.max(0, Math.round(((safeAvg - 60) / (220 - 60)) * 100))) : 0
  const circ = 2 * Math.PI * 48

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft hover-lift transition-all duration-300 flex flex-col items-center">
      <h3 className="text-sm font-bold text-text-heading mb-0.5 self-start">Blood Sugar Gauge</h3>
      <p className="text-[10px] text-text-muted self-start mb-4">Real-time patient glucose level</p>

      <div className="relative">
        <svg width="128" height="128">
          <circle cx="64" cy="64" r="48" fill="none" stroke="currentColor" strokeWidth="10" className="text-surface-elevated" />
          <circle cx="64" cy="64" r="48" fill="none" stroke={riskColor} strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={circ - (circ * pct / 100)}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '64px 64px', transition: 'stroke-dashoffset 1s ease' }}
          />
          <text x="64" y="59" textAnchor="middle" style={{ fontSize: '20px', fontWeight: '800', fill: 'currentColor' }} className="fill-text-heading">{avg || '--'}</text>
          <text x="64" y="75" textAnchor="middle" style={{ fontSize: '9px', fontWeight: '600', fill: '#94a3b8' }}>mg/dL</text>
        </svg>
      </div>

      <span className={`mt-3 text-[11px] font-bold px-3 py-1 rounded-full border ${riskBg}`}>{risk} Range</span>

      <div className="flex gap-4 mt-4 w-full">
        <div className="flex-1 text-center bg-amber-50 rounded-xl py-2">
          <p className="text-[9px] font-bold text-amber-600 uppercase">Min</p>
          <p className="text-sm font-extrabold text-amber-900">{min || '--'}</p>
        </div>
        <div className="flex-1 text-center bg-rose-50 rounded-xl py-2">
          <p className="text-[9px] font-bold text-rose-600 uppercase">Max</p>
          <p className="text-sm font-extrabold text-rose-900">{max || '--'}</p>
        </div>
      </div>
    </div>
  )
}

// ── Medication Viewer (read-only) ─────────────────────────────────────────────
function MedicationViewer({ patientName, prescriptions = [] }) {
  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft hover-lift transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-text-heading">Today's Medications</h3>
          <p className="text-[10px] text-text-muted mt-0.5">Prescribed schedule for {patientName || 'patient'}</p>
        </div>
        <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full border border-amber-200">
          {prescriptions.filter(m => m.status === 'Taken').length}/{prescriptions.length} Taken
        </span>
      </div>
      {prescriptions.length === 0 ? (
        <div className="py-6 text-center">
          <div className="text-2xl mb-2">💊</div>
          <p className="text-[10px] text-text-muted">No prescriptions on file yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {prescriptions.map((med) => {
            const pid = med.prescription_id || med.id
            const isTaken = med.status === 'Taken'
            return (
              <div key={pid} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated transition-colors border border-transparent hover:border-surface-border">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${isTaken ? 'bg-emerald-50' : 'bg-primary-50'}`}>
                  💊
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-text-heading">{med.name} <span className="font-normal text-text-muted">({med.dosage})</span></p>
                  <p className="text-[10px] text-text-secondary">{med.frequency}{med.time ? ` · ${med.time}` : ''}</p>
                </div>
                {isTaken ? (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    Taken
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-500 border border-amber-200 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Emergency Card ─────────────────────────────────────────────────────────────
function EmergencyCard({ patient }) {
  const contacts = [
    { label: 'Primary Doctor', value: 'Dr. Sarah Jenkins', icon: '🩺', phone: '+1 555-0201' },
    { label: "Patient's Phone", value: patient?.phone || '+1 555-0101', icon: '📱', phone: patient?.phone || '+1 555-0101' },
    { label: 'Emergency Contact', value: patient?.emergencyContact || 'Family Member', icon: '🆘', phone: '' },
  ].filter(c => c.value)

  return (
    <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl border border-rose-200/60 p-5 shadow-soft hover-lift transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center text-base">🚨</div>
        <div>
          <h3 className="text-sm font-bold text-rose-800">Emergency Contacts</h3>
          <p className="text-[10px] text-rose-500">Quick-access critical info</p>
        </div>
      </div>
      <div className="space-y-2">
        {contacts.map((c, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/70 rounded-xl px-3 py-2.5 border border-rose-100 hover:border-rose-300/60 transition-colors">
            <span className="text-base shrink-0">{c.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">{c.label}</p>
              <p className="text-xs font-bold text-rose-900 truncate">{c.value}</p>
            </div>
            {c.phone && (
              <a href={`tel:${c.phone}`} className="text-[10px] font-bold text-rose-600 hover:text-rose-800 transition-colors shrink-0">Call →</a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Wellness Check-In ──────────────────────────────────────────────────────────
function WellnessCheckin({ patientName }) {
  const [checkins, setCheckins] = useState([
    { id: 1, label: 'Gave morning medication', done: true },
    { id: 2, label: 'Checked blood sugar', done: true },
    { id: 3, label: 'Prepared low-carb meal', done: false },
    { id: 4, label: 'Encouraged 15-min walk', done: false },
    { id: 5, label: 'Evening medication reminder set', done: false },
  ])

  const toggle = (id) => setCheckins(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c))
  const doneCount = checkins.filter(c => c.done).length

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft hover-lift transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-text-heading">Daily Care Checklist</h3>
          <p className="text-[10px] text-text-muted mt-0.5">Your care tasks for today</p>
        </div>
        <div className="text-right">
          <span className="text-lg font-extrabold text-primary">{doneCount}</span>
          <span className="text-text-muted text-xs">/{checkins.length}</span>
          <p className="text-[9px] text-text-muted">completed</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-surface-elevated rounded-full mb-4 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500"
          style={{ width: `${(doneCount / checkins.length) * 100}%` }} />
      </div>

      <div className="space-y-2">
        {checkins.map(c => (
          <div key={c.id} onClick={() => toggle(c.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${c.done ? 'bg-emerald-50/60 border-emerald-100' : 'hover:bg-surface-elevated border-transparent hover:border-surface-border'}`}>
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${c.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-primary'}`}>
              {c.done && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
            </div>
            <p className={`text-xs transition-all ${c.done ? 'line-through text-text-muted' : 'text-text-body font-medium'}`}>{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Caretaker Dashboard ───────────────────────────────────────────────────
export default function CaretakerDashboard() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [patient, setPatient] = useState(null)
  const [readings, setReadings] = useState([])
  const [stats, setStats] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [readingsFilter, setReadingsFilter] = useState('month')
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [socket, setSocket] = useState(null)
  const [pendingRequests, setPendingRequests] = useState([])
  const [respondingId, setRespondingId] = useState(null)
  const [showNotifModal, setShowNotifModal] = useState(false)

  const fetchData = async (filter = 'month') => {
    const filterParam = filter === 'week' ? 'weekly' : filter === 'year' ? 'yearly' : 'monthly'
    try {
      const { data: patientsData } = await api.get('/doctor/patients')
      const firstPatient = patientsData[0]
      if (firstPatient) {
        setPatient(firstPatient)
        const [readRes, statRes, msgRes, rxRes] = await Promise.all([
          api.get(`/readings/${firstPatient.user_id}?filter=${filterParam}`),
          api.get(`/readings/stats/${firstPatient.user_id}`),
          api.get(`/messages/${firstPatient.user_id}`),
          api.get(`/prescriptions/${firstPatient.user_id}`)
        ])
        setReadings(readRes.data)
        setStats(statRes.data)
        setMessages(msgRes.data)
        setPrescriptions(rxRes.data)
      }
    } catch {
      setPatient({ user_id: 'p-uuid-1', name: 'Emily Davis', email: 'patient@glucolyse.com', blood_type: 'O+', phone: '+1 555-0101' })
      setStats({ avg_level: 126, min_level: 94, max_level: 162, total_readings: 12 })
      setReadings([
        { reading_id: '1', sugar_level: 110, meal_type: 'Breakfast', timing: 'Before Meal', status: 'Normal', recorded_at: new Date(Date.now() - 86400000 * 3).toISOString() },
        { reading_id: '2', sugar_level: 155, meal_type: 'Lunch', timing: 'After Meal', status: 'High', recorded_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { reading_id: '3', sugar_level: 94, meal_type: 'Dinner', timing: 'Before Meal', status: 'Normal', recorded_at: new Date(Date.now() - 86400000).toISOString() },
        { reading_id: '4', sugar_level: 162, meal_type: 'Lunch', timing: 'After Meal', status: 'High', recorded_at: new Date().toISOString() },
      ])
      setMessages([
        { message_id: 'm-1', sender_id: 'p-uuid-1', receiver_id: 'c-uuid-1', sender_name: 'Emily Davis', message_text: 'Feeling a bit tired today, blood sugar was high after lunch.', sent_at: new Date(Date.now() - 3600000 * 2).toISOString() },
        { message_id: 'm-2', sender_id: 'c-uuid-1', receiver_id: 'p-uuid-1', sender_name: 'You', message_text: "I'll prepare something lighter for dinner. Make sure to rest!", sent_at: new Date(Date.now() - 3600000).toISOString() },
      ])
      setPrescriptions([])
    }
  }

  const fetchPendingRequests = async () => {
    try {
      const { data } = await api.get('/doctor/requests/pending')
      setPendingRequests(data)
    } catch {}
  }

  const handleRespondToRequest = async (requestId, action) => {
    setRespondingId(requestId)
    try {
      await api.post('/doctor/requests/respond', { requestId, action })
      await Promise.all([fetchPendingRequests(), fetchData()])
    } catch {}
    setRespondingId(null)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !patient) return
    const textToSend = newMessage
    setNewMessage('')
    try {
      const { data } = await api.post('/messages/send', { receiverId: patient.user_id, text: textToSend })
      setMessages(prev => [...prev, data])
      if (socket) socket.emit('sendMessage', data)
    } catch {
      setMessages(prev => [...prev, {
        message_id: String(Date.now()), sender_id: user.id, receiver_id: patient?.user_id,
        sender_name: 'You', message_text: textToSend, sent_at: new Date().toISOString()
      }])
    }
  }

  useEffect(() => {
    fetchData(readingsFilter)
    fetchPendingRequests()
  }, [readingsFilter])

  useEffect(() => {
    const s = io(window.location.origin)
    setSocket(s)
    if (user?.id) s.emit('register', user.id)
    s.on('newMessage', (msg) => {
      setMessages(prev => prev.some(m => m.message_id === msg.message_id) ? prev : [...prev, msg])
    })
    return () => s.disconnect()
  }, [user])

  useEffect(() => {
    if (pathname === '/messages') {
      const el = document.getElementById('caretaker-chat')
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => el.querySelector('input')?.focus(), 600) }
    }
  }, [pathname])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const getStatusColor = (level) => !level ? 'Normal' : level > 140 ? 'High' : level < 80 ? 'Low' : 'Normal'

  return (
    <div className="flex h-screen bg-surface transition-colors duration-200">
      <Sidebar role="Caretaker" />
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
        <Navbar title="Glucolyse Care Dashboard" />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-7">

          {/* ── Connection Requests ── */}
          {pendingRequests.length > 0 && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-3 animate-fade-in shadow-sm">
              <p className="text-xs font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">{pendingRequests.length}</span>
                New Patient Requests
              </p>
              {pendingRequests.map(req => (
                <div key={req.request_id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-amber-100 shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700 text-sm shrink-0">
                    {req.patient_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-heading truncate">{req.patient_name}</p>
                    <p className="text-[10px] text-text-secondary">{req.patient_email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleRespondToRequest(req.request_id, 'accept')} disabled={respondingId === req.request_id}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 hover:-translate-y-0.5">
                      Accept
                    </button>
                    <button onClick={() => handleRespondToRequest(req.request_id, 'reject')} disabled={respondingId === req.request_id}
                      className="px-3 py-1.5 bg-surface-elevated hover:bg-surface-border text-text-secondary rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-400/30 shadow-md" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-xl font-extrabold text-white shadow-md">
                    {user?.name?.charAt(0)}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-surface rounded-full" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-heading">
                  {greeting}, {user?.name?.split(' ')[0]} 🤝
                </h2>
                <p className="text-text-secondary text-sm mt-0.5">
                  {patient ? (
                    <>Monitoring <strong className="text-teal-600">{patient.name}</strong>'s health today.</>
                  ) : 'No patient assigned yet. Accept a patient request to get started.'}
                </p>
              </div>
            </div>

            {/* Patient badge */}
            {patient && (
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3 shadow-sm hover-lift transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center font-bold text-teal-700 text-sm">
                    {patient.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider">Assigned Patient</p>
                    <p className="text-sm font-bold text-teal-900">{patient.name}</p>
                    {patient.blood_type && <p className="text-[10px] text-teal-600">🩸 {patient.blood_type}</p>}
                  </div>
                </div>
                <button
                  onClick={() => setShowNotifModal(true)}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-all hover:shadow-sm hover:-translate-y-0.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  Send Alert
                </button>
              </div>
            )}
          </div>

          {patient ? (
            <>
              {/* ── Quick Stats ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <StatCard title="Average Blood Sugar" value={stats?.avg_level || '--'} trend={getStatusColor(stats?.avg_level)}
                  color="bg-teal-500/10 text-teal-600"
                  icon={<svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2" /></svg>} />
                <StatCard title="Lowest Reading" value={stats?.min_level || '--'} trend="Low" color="bg-amber-500/10 text-amber-500"
                  icon={<svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>} />
                <StatCard title="Highest Reading" value={stats?.max_level || '--'} trend="High" color="bg-rose-500/10 text-rose-500"
                  icon={<svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>} />
              </div>

              {/* ── Gauge + Medication + Emergency ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <GlucoseGauge avg={stats?.avg_level} min={stats?.min_level} max={stats?.max_level} />
                <MedicationViewer patientName={patient?.name} prescriptions={prescriptions} />
                <EmergencyCard patient={patient} />
              </div>

              {/* ── Heatmap ── */}
              <ActivityHeatmap data={readings} />

              {/* ── Trend Chart + Checklist + Chat ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Chart */}
                <div className="lg:col-span-1 bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft hover-lift transition-all duration-300">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-text-heading">Sugar Trend</h3>
                    <div className="flex gap-1 bg-surface-elevated rounded-lg p-0.5">
                      {[['week', 'W'], ['month', 'M'], ['year', 'Y']].map(([val, label]) => (
                        <button key={val} onClick={() => setReadingsFilter(val)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${readingsFilter === val ? 'bg-white dark:bg-slate-700 text-text-heading shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted mb-4">Recent glycemic readings</p>
                  <SugarLineChart data={readings} />
                </div>

                {/* Wellness checklist */}
                <WellnessCheckin patientName={patient?.name} />

                {/* Chat */}
                <div id="caretaker-chat" className="bg-surface-card rounded-2xl border border-surface-border p-5 shadow-soft hover-lift transition-all duration-300 flex flex-col h-[380px]">
                  <div className="flex items-center gap-3 pb-3 border-b border-surface-border mb-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                        {patient.name?.charAt(0)}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-surface-card rounded-full" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-heading">Chat with {patient.name?.split(' ')[0]}</h3>
                      <p className="text-[10px] text-text-secondary">Direct support line</p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
                    {messages.map(msg => (
                      <div key={msg.message_id} className={`flex flex-col ${msg.sender_id === user.id ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] text-text-muted mb-0.5">
                          {msg.sender_id === user.id ? 'You' : msg.sender_name} · {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className={`p-3 rounded-2xl max-w-[88%] leading-relaxed ${msg.sender_id === user.id ? 'bg-teal-500 text-white rounded-tr-none' : 'bg-surface-elevated text-text-body rounded-tl-none'}`}>
                          {msg.message_text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-2 mt-3 pt-3 border-t border-surface-border">
                    <input type="text" placeholder="Send a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)}
                      className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-surface-border focus:outline-none focus:border-teal-400 bg-surface text-text-body placeholder-text-muted hover:border-teal-300/50 transition-colors" />
                    <button type="submit"
                      className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-sm">
                      Send
                    </button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            /* ── No patient state ── */
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-4xl animate-pulse-gentle shadow-sm">🤝</div>
              <h3 className="text-lg font-bold text-text-heading">No patient assigned yet</h3>
              <p className="text-text-secondary text-sm max-w-sm">
                You'll appear here once a patient sends you a connection request. You can also ask your patient to search for your email in their dashboard.
              </p>
              <div className="mt-2 bg-surface-card border border-surface-border rounded-2xl px-6 py-4 text-xs text-text-secondary max-w-xs shadow-soft">
                <p className="font-bold text-text-heading mb-1">Your care email</p>
                <p className="font-mono text-primary">{user?.email}</p>
                <p className="mt-2 text-text-muted">Share this with the patient you're caring for</p>
              </div>
            </div>
          )}

          {/* ── Notification Settings ── */}
          <NotificationSettingsPanel />

        </main>
      </div>

      {showNotifModal && patient && (
        <SendNotificationModal patient={patient} onClose={() => setShowNotifModal(false)} />
      )}
    </div>
  )
}
