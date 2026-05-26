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

export default function DoctorDashboard() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  
  // Readings and stats for the selected patient
  const [readings, setReadings] = useState([])
  const [stats, setStats] = useState(null)
  const [loadingPatient, setLoadingPatient] = useState(false)

  // Prescriptions state for the selected patient
  const [prescriptions, setPrescriptions] = useState([
    { id: '1', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', status: 'Active' },
    { id: '2', name: 'Jardiance', dosage: '10mg', frequency: 'Once daily', status: 'Active' }
  ])
  const [newPrescription, setNewPrescription] = useState({ name: '', dosage: '', frequency: '' })

  // Socket and messaging state
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [socket, setSocket] = useState(null)

  // Pending connection requests
  const [pendingRequests, setPendingRequests] = useState([])
  const [respondingId, setRespondingId] = useState(null)

  // Fetch assigned patients
  const fetchPatients = async () => {
    try {
      const { data } = await api.get('/doctor/patients')
      setPatients(data)
      if (data.length > 0 && !selectedPatient) {
        setSelectedPatient(data[0])
      }
    } catch (err) {
      // Fallback patient matching Emily Davis
      const mockPatients = [
        { user_id: 'p-uuid-1', name: 'Emily Davis', email: 'patient@glucolyse.com', age: 32, diagnosed: 'Type 2 Diabetes (2023)', status: 'High Risk' }
      ]
      setPatients(mockPatients)
      if (!selectedPatient) {
        setSelectedPatient(mockPatients[0])
      }
    }
  }

  // Fetch readings, stats, and chat history for selected patient
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
    } catch (err) {
      // Offline fallback dummy details
      const dummyReadings = [
        { reading_id: '1', sugar_level: 145, meal_type: 'Breakfast', timing: 'After Meal', status: 'High', recorded_at: new Date(Date.now() - 86400000 * 3).toISOString() },
        { reading_id: '2', sugar_level: 165, meal_type: 'Lunch', timing: 'After Meal', status: 'High', recorded_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { reading_id: '3', sugar_level: 110, meal_type: 'Dinner', timing: 'Before Meal', status: 'Normal', recorded_at: new Date(Date.now() - 86400000 * 1).toISOString() },
        { reading_id: '4', sugar_level: 155, meal_type: 'Lunch', timing: 'After Meal', status: 'High', recorded_at: new Date().toISOString() }
      ]
      setReadings(dummyReadings)
      setStats({
        avg_level: 143,
        min_level: 110,
        max_level: 165,
        total_readings: 4
      })
      // Preload mock messages
      setMessages([
        { message_id: 'm-1', sender_id: 'd-uuid-1', receiver_id: 'p-uuid-1', sender_name: 'Dr. Sarah Jenkins', sender_role: 'Doctor', message_text: 'Your morning fasting blood sugars are looking much more stable. Keep up the great work!', sent_at: new Date(Date.now() - 3600000 * 4).toISOString() },
        { message_id: 'm-2', sender_id: 'p-uuid-1', receiver_id: 'd-uuid-1', sender_name: 'Emily Davis', sender_role: 'Patient', message_text: 'Thank you Dr. Sarah! I have been walking for 20 minutes after dinner as well.', sent_at: new Date(Date.now() - 3600000 * 3).toISOString() }
      ])
    } finally {
      setLoadingPatient(false)
    }
  }

  // Socket initialization
  useEffect(() => {
    const socketUrl = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin
    const s = io(socketUrl)
    setSocket(s)
    
    if (user?.id) {
      s.emit('register', user.id)
    }

    s.on('newMessage', (msg) => {
      // Append message in real-time if it corresponds to current patient chat
      setMessages(prev => {
        const exists = prev.some(m => m.message_id === msg.message_id)
        if (exists) return prev
        return [...prev, msg]
      })
    })

    return () => {
      s.disconnect()
    }
  }, [user])

  useEffect(() => {
    if (pathname === '/messages') {
      const chatSection = document.getElementById('doctor-chat-section')
      if (chatSection) {
        chatSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const chatInput = chatSection.querySelector('input')
        if (chatInput) {
          setTimeout(() => chatInput.focus(), 800)
        }
      }
    } else if (pathname === '/dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [pathname])

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientDetails(selectedPatient.user_id)
    }
  }, [selectedPatient])

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient)
  }

  const handleAddPrescription = (e) => {
    e.preventDefault()
    if (!newPrescription.name || !newPrescription.dosage) return
    const p = {
      id: String(Date.now()),
      name: newPrescription.name,
      dosage: newPrescription.dosage,
      frequency: newPrescription.frequency || 'Once daily',
      status: 'Active'
    }
    setPrescriptions([...prescriptions, p])
    setNewPrescription({ name: '', dosage: '', frequency: '' })
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
      await Promise.all([fetchPendingRequests(), fetchPatients()])
    } catch {}
    setRespondingId(null)
  }

  useEffect(() => {
    if (user?.role === 'Doctor' || user?.role === 'Caretaker') {
      fetchPendingRequests()
    }
  }, [user])

  const handleDeletePrescription = (id) => {
    setPrescriptions(prescriptions.filter(p => p.id !== id))
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedPatient) return
    
    const textToSend = newMessage
    setNewMessage('')

    try {
      const { data } = await api.post('/messages/send', {
        receiverId: selectedPatient.user_id,
        text: textToSend
      })
      // Append locally
      setMessages(prev => [...prev, data])
      // Emit to Socket
      if (socket) {
        socket.emit('sendMessage', data)
      }
    } catch {
      // Offline fallback chat log
      const newMsg = {
        message_id: String(Date.now()),
        sender_id: user.id || 'd-uuid-1',
        receiver_id: selectedPatient.user_id,
        sender_name: 'You',
        sender_role: user.role,
        message_text: textToSend,
        sent_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, newMsg])
    }
  }

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (level) => {
    if (!level) return 'Normal'
    if (level > 140) return 'High'
    if (level < 80) return 'Low'
    return 'Normal'
  }

  const isCaretaker = user?.role === 'Caretaker'

  return (
    <div className="flex h-screen bg-surface transition-colors duration-200">
      <Sidebar role={user?.role} />
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
        <Navbar title={isCaretaker ? "Glucolyse Caregiver Dashboard" : "Glucolyse Clinical Dashboard"} />
        
        <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Patients Search / List Panel */}
          <div className="w-full md:w-80 border-r border-surface-border bg-surface-card flex flex-col">
            {pendingRequests.length > 0 && (
              <div className="p-3 bg-amber-500/5 border-b border-amber-500/20 space-y-2">
                <p className="text-[9px] font-extrabold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] font-black">{pendingRequests.length}</span>
                  Connection Requests
                </p>
                {pendingRequests.map(req => (
                  <div key={req.request_id} className="flex items-center gap-2 bg-surface-card rounded-xl px-2.5 py-2 border border-surface-border">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                      {req.patient_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-text-heading truncate">{req.patient_name}</p>
                      <p className="text-[9px] text-text-secondary truncate">{req.patient_email}</p>
                    </div>
                    <button
                      onClick={() => handleRespondToRequest(req.request_id, 'accept')}
                      disabled={respondingId === req.request_id}
                      className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors cursor-pointer disabled:opacity-40"
                      title="Accept"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRespondToRequest(req.request_id, 'reject')}
                      disabled={respondingId === req.request_id}
                      className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer disabled:opacity-40"
                      title="Decline"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="p-4 border-b border-surface-border/50">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                PATIENT INDEX
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-surface-border focus:outline-none focus:border-primary bg-surface text-text-body placeholder-text-muted"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-surface-border/30">
              {filteredPatients.map(p => (
                <div
                  key={p.user_id}
                  onClick={() => handleSelectPatient(p)}
                  className={`p-4 transition-all duration-200 cursor-pointer hover:bg-surface-elevated/65 hover:pl-6 ${
                    selectedPatient?.user_id === p.user_id ? 'bg-primary-50/50 border-l-4 border-primary pl-6 font-semibold' : 'pl-4'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-text-heading">{p.name}</h4>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">
                      High Risk
                    </span>
                  </div>
                  <p className="text-[10px] text-text-secondary mt-1">{p.email}</p>
                </div>
              ))}
              {filteredPatients.length === 0 && (
                <p className="p-4 text-xs text-text-secondary text-center">No patients found</p>
              )}
            </div>
          </div>

          {/* Patient Details & Analytics Panel */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-surface transition-colors duration-200">
            {selectedPatient ? (
              <>
                {/* Header Profile Card */}
                <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-primary tracking-wider bg-primary-50 dark:bg-primary-100/10 px-2.5 py-1 rounded-full uppercase">
                      {isCaretaker ? 'Assigned Ward Profile' : 'Active Clinical Profile'}
                    </span>
                    <h2 className="text-xl font-bold text-text-heading mt-2">{selectedPatient.name}</h2>
                    <p className="text-text-secondary text-xs mt-1">
                      Email: {selectedPatient.email} · Age: 32 · Type 2 Diabetes
                    </p>
                    {isCaretaker && (
                      <p className="text-[10px] text-emerald-500 font-semibold mt-1">
                        Linked Doctor: Dr. Sarah Jenkins
                      </p>
                    )}
                  </div>
                  <button className="bg-surface-card hover:bg-surface-elevated text-text-body px-4 py-2 border border-surface-border rounded-xl font-semibold text-xs transition-all shadow-sm cursor-pointer flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-text-secondary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75M12 11.25v7.5" />
                    </svg>
                    Schedule Consultation
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <StatCard
                    title="Avg Level (Fasting)"
                    value={stats?.avg_level || '--'}
                    trend={getStatusColor(stats?.avg_level)}
                    icon={
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2" />
                      </svg>
                    }
                  />
                  <StatCard
                    title="Minimum Reading"
                    value={stats?.min_level || '--'}
                    trend={getStatusColor(stats?.min_level)}
                    color="bg-amber-500/10 text-amber-500"
                    icon={
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    }
                  />
                  <StatCard
                    title="Maximum Reading"
                    value={stats?.max_level || '--'}
                    trend={getStatusColor(stats?.max_level)}
                    color="bg-rose-500/10 text-rose-500"
                    icon={
                      <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                    }
                  />
                </div>

                {/* LeetCode Activity Heatmap & Compliance Streak */}
                <div className="animate-fade-in">
                  <ActivityHeatmap data={readings} />
                </div>

                {/* Trends Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft">
                    <h3 className="text-base font-bold text-text-heading mb-1">Blood Sugar Monitor</h3>
                    <p className="text-text-secondary text-xs mb-6">Historic reading levels mapping</p>
                    <SugarLineChart data={readings} />
                  </div>
                  <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft">
                    <h3 className="text-base font-bold text-text-heading mb-1">Risk Breakdown</h3>
                    <p className="text-text-secondary text-xs mb-6">Safe vs danger ranges</p>
                    <ReadingPieChart data={readings} />
                  </div>
                </div>

                {/* Prescriptions & Real-Time Chat Consultation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Medication Manager */}
                  <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft flex flex-col h-[360px]">
                    <h3 className="text-base font-bold text-text-heading mb-1">
                      {isCaretaker ? "Patient Medication Log" : "Medication Manager"}
                    </h3>
                    <p className="text-text-secondary text-xs mb-4">
                      {isCaretaker ? "View daily prescription plans" : "Add, adjust, or remove clinical prescriptions"}
                    </p>
                    
                    {/* Scrollable list */}
                    <div className="flex-1 overflow-y-auto space-y-3 divide-y divide-surface-border text-xs pr-1">
                      {prescriptions.map((pill) => (
                        <div key={pill.id} className="checklist-item pt-2.5 flex justify-between items-center rounded-xl px-2 cursor-default">
                          <div>
                            <p className="font-semibold text-text-body">{pill.name} ({pill.dosage})</p>
                            <p className="text-[10px] text-text-secondary">{pill.frequency}</p>
                          </div>
                          {!isCaretaker && (
                            <button
                              onClick={() => handleDeletePrescription(pill.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded transition-all cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {!isCaretaker && (
                      <form onSubmit={handleAddPrescription} className="mt-4 pt-4 border-t border-surface-border flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Pill e.g. Metformin"
                          value={newPrescription.name}
                          onChange={e => setNewPrescription({ ...newPrescription, name: e.target.value })}
                          className="flex-1 px-3 py-1.5 text-xs rounded border border-surface-border focus:outline-none focus:border-primary bg-surface text-text-body placeholder-text-muted"
                        />
                        <input
                          type="text"
                          required
                          placeholder="e.g. 500mg"
                          value={newPrescription.dosage}
                          onChange={e => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                          className="w-20 px-3 py-1.5 text-xs rounded border border-surface-border focus:outline-none focus:border-primary bg-surface text-text-body placeholder-text-muted"
                        />
                        <button
                          type="submit"
                          className="bg-primary hover:bg-primary-dark text-white px-3.5 py-1.5 rounded font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Add
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Consultation / Real-Time Chat panel */}
                  <div id="doctor-chat-section" className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft flex flex-col h-[360px]">
                    <h3 className="text-base font-bold text-text-heading mb-1">Clinical Consultation</h3>
                    <p className="text-text-secondary text-xs mb-4">Direct channel to Emily Davis</p>

                    {/* Messages Window */}
                    <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
                      {messages.map((msg) => (
                        <div key={msg.message_id || msg.sent_at} className={`flex flex-col ${msg.sender_id === user.id ? 'items-end' : 'items-start'}`}>
                          <span className="text-[9px] text-text-muted font-medium mb-0.5">
                            {msg.sender_id === user.id ? 'You' : msg.sender_name} · {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                            msg.sender_id === user.id
                              ? 'bg-primary text-white rounded-tr-none'
                              : 'bg-surface-elevated text-text-body rounded-tl-none'
                          }`}>
                            {msg.message_text}
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                      <input
                        type="text"
                        placeholder="Type consultation message..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        className="flex-1 px-4 py-2 text-xs rounded-lg border border-surface-border focus:outline-none focus:border-primary bg-surface text-text-body placeholder-text-muted"
                      />
                      <button
                        type="submit"
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Send
                      </button>
                    </form>
                  </div>

                </div>
              </>
            ) : (
              <div className="h-96 flex items-center justify-center text-slate-400 text-sm animate-pulse">
                Loading clinical index...
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  )
}
