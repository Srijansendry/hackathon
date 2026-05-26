import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import StatCard from '../components/StatCard'
import SugarLineChart from '../charts/SugarLineChart'
import ReadingPieChart from '../charts/ReadingPieChart'
import ActivityHeatmap from '../charts/ActivityHeatmap'
import api from '../services/api'
import { io } from 'socket.io-client'

// ── 3D Glucose Ring Visualization ─────────────────────────────────────────────
function GlucoseRing({ avg, min, max }) {
  const score = avg ? Math.min(100, Math.max(0, Math.round(((avg - 60) / (200 - 60)) * 100))) : 50
  const riskColor = avg > 140 ? '#ef4444' : avg > 110 ? '#f59e0b' : '#10b981'
  const circumference = 2 * Math.PI * 52

  return (
    <div className="flex flex-col items-center p-6 bg-surface-card rounded-2xl border border-surface-border shadow-soft hover-lift transition-all duration-300">
      <h3 className="text-sm font-bold text-text-heading mb-1">Glucose Overview</h3>
      <p className="text-[10px] text-text-muted mb-4">3D risk visualization</p>

      <div className="relative" style={{ perspective: '400px' }}>
        <div style={{ transform: 'rotateX(12deg)', transformStyle: 'preserve-3d' }}>
          <svg width="140" height="140" className="drop-shadow-lg">
            {/* Background ring */}
            <circle cx="70" cy="70" r="52" fill="none" stroke="currentColor" strokeWidth="12"
              className="text-surface-elevated" />
            {/* Value ring */}
            <circle cx="70" cy="70" r="52" fill="none" stroke={riskColor} strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * score / 100)}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '70px 70px', transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
            />
            {/* Inner shadow ring */}
            <circle cx="70" cy="70" r="40" fill="none" stroke={riskColor} strokeWidth="1" strokeOpacity="0.15" />
            {/* Center text */}
            <text x="70" y="65" textAnchor="middle" className="fill-text-heading" style={{ fontSize: '22px', fontWeight: '800', fill: 'currentColor' }}>
              {avg || '--'}
            </text>
            <text x="70" y="82" textAnchor="middle" style={{ fontSize: '9px', fontWeight: '600', fill: '#94a3b8' }}>
              mg/dL avg
            </text>
          </svg>
        </div>
      </div>

      <div className="flex gap-4 mt-4 text-center">
        <div className="px-3 py-2 bg-amber-500/8 rounded-xl">
          <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Min</p>
          <p className="text-sm font-extrabold text-text-heading">{min || '--'}</p>
        </div>
        <div className="px-3 py-2 bg-rose-500/8 rounded-xl">
          <p className="text-[9px] font-bold text-rose-600 uppercase tracking-wider">Max</p>
          <p className="text-sm font-extrabold text-text-heading">{max || '--'}</p>
        </div>
      </div>
    </div>
  )
}

// ── Avatar with initials fallback ─────────────────────────────────────────────
function PatientAvatar({ name, photoUrl, size = 'md' }) {
  const sizeClasses = size === 'sm' ? 'w-7 h-7 text-[11px]' : size === 'lg' ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-sm'
  const colors = ['from-primary to-primary-dark', 'from-violet-500 to-purple-600', 'from-emerald-500 to-teal-600', 'from-rose-500 to-pink-600', 'from-amber-500 to-orange-600']
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0

  if (photoUrl) {
    return <img src={photoUrl} alt={name} className={`${sizeClasses} rounded-full object-cover ring-2 ring-primary/20`} />
  }
  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center font-extrabold text-white shrink-0`}>
      {name?.charAt(0) || '?'}
    </div>
  )
}

// ── Patient Notes Component ───────────────────────────────────────────────────
function PatientNotes({ patientId }) {
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(`patient_notes_${patientId}`) || ''
    setNotes(stored)
    setSaved(false)
  }, [patientId])

  const handleSave = () => {
    localStorage.setItem(`patient_notes_${patientId}`, notes)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft hover-lift transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-text-heading">Clinical Notes</h3>
          <p className="text-[10px] text-text-muted mt-0.5">Private notes for this patient</p>
        </div>
        <button
          onClick={handleSave}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            saved ? 'bg-emerald-500 text-white' : 'bg-primary hover:bg-primary-dark text-white hover:-translate-y-0.5'
          }`}
        >
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Add clinical observations, treatment notes, or reminders for this patient..."
        rows={5}
        className="w-full px-3.5 py-3 text-xs rounded-xl border border-surface-border bg-surface text-text-body focus:outline-none focus:border-primary placeholder-text-muted resize-none hover:border-primary/40 transition-colors leading-relaxed"
      />
    </div>
  )
}

// ── Main Doctor Dashboard ─────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [readings, setReadings] = useState([])
  const [stats, setStats] = useState(null)
  const [loadingPatient, setLoadingPatient] = useState(false)
  const [prescriptions, setPrescriptions] = useState([
    { id: '1', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', status: 'Active' },
    { id: '2', name: 'Jardiance', dosage: '10mg', frequency: 'Once daily', status: 'Active' }
  ])
  const [newPrescription, setNewPrescription] = useState({ name: '', dosage: '', frequency: '' })
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [socket, setSocket] = useState(null)
  const [pendingRequests, setPendingRequests] = useState([])
  const [respondingId, setRespondingId] = useState(null)

  const fetchPatients = async () => {
    try {
      const { data } = await api.get('/doctor/patients')
      setPatients(data)
      if (data.length > 0 && !selectedPatient) setSelectedPatient(data[0])
    } catch {
      const mockPatients = [{ user_id: 'p-uuid-1', name: 'Emily Davis', email: 'patient@glucolyse.com', age: 32, diagnosed: 'Type 2 Diabetes (2023)', status: 'High Risk' }]
      setPatients(mockPatients)
      if (!selectedPatient) setSelectedPatient(mockPatients[0])
    }
  }

  const fetchPatientDetails = async (patientId) => {
    if (!patientId) return
    setLoadingPatient(true)
    try {
      const [readRes, statRes, msgRes] = await Promise.all([
        api.get(`/readings/${patientId}?filter=monthly`),
        api.get(`/readings/stats/${patientId}`),
        api.get(`/messages/${patientId}`)
      ])
      setReadings(readRes.data)
      setStats(statRes.data)
      setMessages(msgRes.data)
    } catch {
      const dummyReadings = [
        { reading_id: '1', sugar_level: 145, meal_type: 'Breakfast', timing: 'After Meal', status: 'High', recorded_at: new Date(Date.now() - 86400000 * 3).toISOString() },
        { reading_id: '2', sugar_level: 165, meal_type: 'Lunch', timing: 'After Meal', status: 'High', recorded_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { reading_id: '3', sugar_level: 110, meal_type: 'Dinner', timing: 'Before Meal', status: 'Normal', recorded_at: new Date(Date.now() - 86400000 * 1).toISOString() },
        { reading_id: '4', sugar_level: 155, meal_type: 'Lunch', timing: 'After Meal', status: 'High', recorded_at: new Date().toISOString() }
      ]
      setReadings(dummyReadings)
      setStats({ avg_level: 143, min_level: 110, max_level: 165, total_readings: 4 })
      setMessages([
        { message_id: 'm-1', sender_id: 'd-uuid-1', receiver_id: 'p-uuid-1', sender_name: 'Dr. Sarah Jenkins', sender_role: 'Doctor', message_text: 'Your morning fasting blood sugars are looking much more stable. Keep up the great work!', sent_at: new Date(Date.now() - 3600000 * 4).toISOString() },
        { message_id: 'm-2', sender_id: 'p-uuid-1', receiver_id: 'd-uuid-1', sender_name: 'Emily Davis', sender_role: 'Patient', message_text: 'Thank you! I have been walking for 20 minutes after dinner as well.', sent_at: new Date(Date.now() - 3600000 * 3).toISOString() }
      ])
    } finally { setLoadingPatient(false) }
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
      const el = document.getElementById('doctor-chat-section')
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => el.querySelector('input')?.focus(), 800) }
    } else if (pathname === '/dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [pathname])

  useEffect(() => { fetchPatients() }, [])
  useEffect(() => { if (selectedPatient) fetchPatientDetails(selectedPatient.user_id) }, [selectedPatient])

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
      await Promise.all([fetchPendingRequests(), fetchPatients()])
    } catch {}
    setRespondingId(null)
  }

  useEffect(() => {
    if (user?.role === 'Doctor' || user?.role === 'Caretaker') fetchPendingRequests()
  }, [user])

  const handleAddPrescription = (e) => {
    e.preventDefault()
    if (!newPrescription.name || !newPrescription.dosage) return
    setPrescriptions(prev => [...prev, {
      id: String(Date.now()), name: newPrescription.name, dosage: newPrescription.dosage,
      frequency: newPrescription.frequency || 'Once daily', status: 'Active'
    }])
    setNewPrescription({ name: '', dosage: '', frequency: '' })
  }

  const handleDeletePrescription = (id) => setPrescriptions(prev => prev.filter(p => p.id !== id))

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedPatient) return
    const textToSend = newMessage
    setNewMessage('')
    try {
      const { data } = await api.post('/messages/send', { receiverId: selectedPatient.user_id, text: textToSend })
      setMessages(prev => [...prev, data])
      if (socket) socket.emit('sendMessage', data)
    } catch {
      const msg = { message_id: String(Date.now()), sender_id: user.id || 'd-uuid-1', receiver_id: selectedPatient.user_id, sender_name: 'You', sender_role: user.role, message_text: textToSend, sent_at: new Date().toISOString() }
      setMessages(prev => [...prev, msg])
    }
  }

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const getStatusColor = (level) => !level ? 'Normal' : level > 140 ? 'High' : level < 80 ? 'Low' : 'Normal'
  const isCaretaker = user?.role === 'Caretaker'

  return (
    <div className="flex h-screen bg-surface transition-colors duration-200">
      <Sidebar role={user?.role} />
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
        <Navbar title={isCaretaker ? 'Glucolyse Caregiver Dashboard' : 'Glucolyse Clinical Dashboard'} />

        <main className="flex-1 overflow-hidden flex flex-col md:flex-row">

          {/* ── Patient List Panel ── */}
          <div className="w-full md:w-72 border-r border-surface-border bg-surface-card flex flex-col shrink-0">

            {/* Pending connection requests */}
            {pendingRequests.length > 0 && (
              <div className="p-3 bg-amber-500/5 border-b border-amber-500/20 space-y-2">
                <p className="text-[9px] font-extrabold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] font-black">{pendingRequests.length}</span>
                  Connection Requests
                </p>
                {pendingRequests.map(req => (
                  <div key={req.request_id} className="flex items-center gap-2 bg-surface-card rounded-xl px-2.5 py-2 border border-surface-border hover:border-amber-300/50 transition-colors">
                    <PatientAvatar name={req.patient_name} photoUrl={req.patient_photo} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-text-heading truncate">{req.patient_name}</p>
                      <p className="text-[9px] text-text-secondary truncate">{req.patient_email}</p>
                    </div>
                    <button onClick={() => handleRespondToRequest(req.request_id, 'accept')} disabled={respondingId === req.request_id}
                      className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors cursor-pointer disabled:opacity-40 hover:scale-110" title="Accept">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </button>
                    <button onClick={() => handleRespondToRequest(req.request_id, 'reject')} disabled={respondingId === req.request_id}
                      className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer disabled:opacity-40 hover:scale-110" title="Decline">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="p-4 border-b border-surface-border/50">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Patient Index</label>
              <div className="relative">
                <input type="text" placeholder="Search by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-surface-border focus:outline-none focus:border-primary bg-surface text-text-body placeholder-text-muted hover:border-primary/40 transition-colors" />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Patient list */}
            <div className="flex-1 overflow-y-auto">
              {filteredPatients.map(p => {
                const isSelected = selectedPatient?.user_id === p.user_id
                return (
                  <div key={p.user_id} onClick={() => setSelectedPatient(p)}
                    className={`patient-card flex items-center gap-3 p-4 border-b border-surface-border/30 cursor-pointer transition-all duration-200 ${
                      isSelected ? 'bg-primary-50/50 border-l-4 border-l-primary pl-4' : 'pl-4 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <PatientAvatar name={p.name} photoUrl={p.photo_url || p.photoUrl} size="sm" />
                      {isSelected && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border-[1.5px] border-surface-card rounded-full" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-text-heading truncate">{p.name}</h4>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 shrink-0 ml-1">High</span>
                      </div>
                      <p className="text-[10px] text-text-secondary mt-0.5 truncate">{p.email}</p>
                    </div>
                  </div>
                )
              })}
              {filteredPatients.length === 0 && (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center mx-auto mb-2 text-lg">🔍</div>
                  <p className="text-xs text-text-secondary">No patients found</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Patient Details Panel ── */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-7 bg-surface transition-colors duration-200">
            {selectedPatient ? (
              <>
                {/* Patient Profile Header */}
                <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover-lift transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <PatientAvatar name={selectedPatient.name} photoUrl={selectedPatient.photo_url || selectedPatient.photoUrl} size="lg" />
                    <div>
                      <span className="text-[10px] font-bold text-primary tracking-wider bg-primary-50 px-2.5 py-1 rounded-full uppercase">
                        {isCaretaker ? 'Assigned Ward Profile' : 'Active Clinical Profile'}
                      </span>
                      <h2 className="text-xl font-bold text-text-heading mt-2">{selectedPatient.name}</h2>
                      <p className="text-text-secondary text-xs mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span>📧 {selectedPatient.email}</span>
                        {selectedPatient.blood_type && <span>🩸 {selectedPatient.blood_type}</span>}
                        {selectedPatient.phone && <span>📱 {selectedPatient.phone}</span>}
                        <span className="text-amber-600 font-semibold">⚠ Type 2 Diabetes</span>
                      </p>
                      {isCaretaker && (
                        <p className="text-[10px] text-emerald-500 font-semibold mt-1">✓ Linked to medical team</p>
                      )}
                    </div>
                  </div>
                  <button className="bg-surface-card hover:bg-surface-elevated text-text-body px-4 py-2.5 border border-surface-border rounded-xl font-semibold text-xs transition-all hover:shadow-sm hover:-translate-y-0.5 cursor-pointer flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
                    </svg>
                    Schedule Consult
                  </button>
                </div>

                {/* Stats + Glucose Ring */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                  <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <StatCard title="Avg Level (Fasting)" value={stats?.avg_level || '--'} trend={getStatusColor(stats?.avg_level)}
                      icon={<svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2" /></svg>} />
                    <StatCard title="Minimum Reading" value={stats?.min_level || '--'} trend={getStatusColor(stats?.min_level)} color="bg-amber-500/10 text-amber-500"
                      icon={<svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>} />
                    <StatCard title="Maximum Reading" value={stats?.max_level || '--'} trend={getStatusColor(stats?.max_level)} color="bg-rose-500/10 text-rose-500"
                      icon={<svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>} />
                  </div>
                  <GlucoseRing avg={stats?.avg_level} min={stats?.min_level} max={stats?.max_level} />
                </div>

                {/* Heatmap */}
                <div className="animate-fade-in">
                  <ActivityHeatmap data={readings} />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft hover-lift transition-all duration-300">
                    <h3 className="text-base font-bold text-text-heading mb-1">Blood Sugar Monitor</h3>
                    <p className="text-text-secondary text-xs mb-5">Historic reading levels mapping</p>
                    <SugarLineChart data={readings} />
                  </div>
                  <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft hover-lift transition-all duration-300">
                    <h3 className="text-base font-bold text-text-heading mb-1">Risk Breakdown</h3>
                    <p className="text-text-secondary text-xs mb-5">Safe vs danger ranges</p>
                    <ReadingPieChart data={readings} />
                  </div>
                </div>

                {/* Clinical Notes */}
                {!isCaretaker && (
                  <PatientNotes patientId={selectedPatient.user_id} />
                )}

                {/* Prescriptions + Chat */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Medication Manager */}
                  <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft flex flex-col h-[380px] hover-lift transition-all duration-300">
                    <h3 className="text-base font-bold text-text-heading mb-1">
                      {isCaretaker ? 'Patient Medication Log' : 'Medication Manager'}
                    </h3>
                    <p className="text-text-secondary text-xs mb-4">
                      {isCaretaker ? 'View daily prescription plans' : 'Add, adjust, or remove clinical prescriptions'}
                    </p>
                    <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1">
                      {prescriptions.map((pill) => (
                        <div key={pill.id} className="checklist-item flex justify-between items-center rounded-xl px-3 py-3 bg-surface-elevated/30 hover:bg-surface-elevated border border-transparent hover:border-surface-border transition-all">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-primary-50 text-primary flex items-center justify-center text-sm shrink-0">💊</span>
                            <div>
                              <p className="font-semibold text-text-body">{pill.name} <span className="text-text-muted font-normal">({pill.dosage})</span></p>
                              <p className="text-[10px] text-text-secondary">{pill.frequency}</p>
                            </div>
                          </div>
                          {!isCaretaker && (
                            <button onClick={() => handleDeletePrescription(pill.id)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all cursor-pointer hover:scale-110">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {!isCaretaker && (
                      <form onSubmit={handleAddPrescription} className="mt-4 pt-4 border-t border-surface-border flex gap-2">
                        <input type="text" required placeholder="Medication name" value={newPrescription.name}
                          onChange={e => setNewPrescription(p => ({ ...p, name: e.target.value }))}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-surface-border focus:outline-none focus:border-primary bg-surface text-text-body placeholder-text-muted hover:border-primary/40 transition-colors" />
                        <input type="text" required placeholder="Dosage" value={newPrescription.dosage}
                          onChange={e => setNewPrescription(p => ({ ...p, dosage: e.target.value }))}
                          className="w-20 px-3 py-1.5 text-xs rounded-lg border border-surface-border focus:outline-none focus:border-primary bg-surface text-text-body placeholder-text-muted hover:border-primary/40 transition-colors" />
                        <button type="submit"
                          className="bg-primary hover:bg-primary-dark text-white px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer hover:-translate-y-0.5">
                          Add
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Chat */}
                  <div id="doctor-chat-section" className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft flex flex-col h-[380px] hover-lift transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-surface-border">
                      <div className="relative">
                        <PatientAvatar name={selectedPatient.name} photoUrl={selectedPatient.photo_url || selectedPatient.photoUrl} size="sm" />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border-[1.5px] border-surface-card rounded-full" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-text-heading">Clinical Consultation</h3>
                        <p className="text-[10px] text-text-secondary">Direct channel to {selectedPatient.name}</p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
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

                    <form onSubmit={handleSendMessage} className="flex gap-2 mt-4 pt-3 border-t border-surface-border">
                      <input type="text" placeholder="Type consultation message..." value={newMessage} onChange={e => setNewMessage(e.target.value)}
                        className="flex-1 px-4 py-2 text-xs rounded-lg border border-surface-border focus:outline-none focus:border-primary bg-surface text-text-body placeholder-text-muted hover:border-primary/40 transition-colors" />
                      <button type="submit"
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-sm">
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center text-3xl animate-pulse-gentle">🩺</div>
                <p className="text-sm text-text-secondary font-medium">Loading clinical index...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
