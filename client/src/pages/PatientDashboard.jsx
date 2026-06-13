import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [water, setWater] = useState(0)
  const maxWater = 8
  const [steps, setSteps] = useState(0)
  const [stepsInput, setStepsInput] = useState('')
  const [editingSteps, setEditingSteps] = useState(false)
  const maxSteps = 10000
  const [mood, setMood] = useState(null)

  const moods = [
    { emoji: '😊', label: 'Great', color: 'bg-emerald-500' },
    { emoji: '😐', label: 'Okay', color: 'bg-amber-500' },
    { emoji: '😔', label: 'Low', color: 'bg-rose-500' },
  ]

  const handleStepsSubmit = (e) => {
    e.preventDefault()
    const val = parseInt(stepsInput)
    if (!isNaN(val) && val >= 0) setSteps(Math.min(99999, val))
    setStepsInput('')
    setEditingSteps(false)
  }

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft hover-lift transition-all duration-300">
      <h3 className="text-base font-bold text-text-heading mb-1">Wellness Tracker</h3>
      <p className="text-text-secondary text-xs mb-5">Daily physiological logs</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Water */}
        <div className="flex flex-col items-center p-3 bg-surface-elevated/40 rounded-xl border border-surface-border/50 hover:border-sky-300/50 transition-colors group">
          <p className="text-xs font-bold text-text-heading">Hydration</p>
          <p className="text-[10px] text-text-muted mt-0.5">{water} / {maxWater} cups</p>
          <div
            onClick={() => water < maxWater && setWater(w => w + 1)}
            className="w-10 h-16 border-2 border-sky-300/40 rounded-b-xl rounded-t-sm relative my-3 overflow-hidden bg-surface cursor-pointer group-hover:border-sky-400/60 transition-colors flex items-end justify-center shadow-inner">
            <div className="bg-sky-400/50 w-full transition-all duration-500 ease-out relative" style={{ height: `${(water / maxWater) * 100}%` }}>
              <div className="absolute inset-x-0 -top-1 h-2 bg-sky-300/30 animate-pulse rounded-t-full" />
            </div>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-text-secondary">+ Add</span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setWater(w => Math.max(0, w - 1))}
              className="text-[9px] font-bold text-rose-400 hover:text-rose-600 cursor-pointer px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors">
              − Remove
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col items-center p-3 bg-surface-elevated/40 rounded-xl border border-surface-border/50 hover:border-emerald-300/50 transition-colors group">
          <p className="text-xs font-bold text-text-heading">Activity</p>
          <p className="text-[10px] text-text-muted mt-0.5">{steps.toLocaleString()} steps</p>
          <div className="relative w-16 h-16 flex items-center justify-center my-2">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="26" className="stroke-surface-border stroke-[4] fill-none" />
              <circle cx="32" cy="32" r="26" className="stroke-emerald-400 stroke-[4] fill-none transition-all duration-700"
                strokeDasharray={163} strokeDashoffset={163 - (163 * Math.min(steps, maxSteps)) / maxSteps} strokeLinecap="round" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-[11px] font-extrabold text-text-heading">{Math.min(100, Math.round((steps / maxSteps) * 100))}%</span>
            </div>
          </div>
          {editingSteps ? (
            <form onSubmit={handleStepsSubmit} className="flex gap-1 w-full">
              <input
                autoFocus
                type="number" min="0" max="99999" placeholder="e.g. 7000"
                value={stepsInput} onChange={e => setStepsInput(e.target.value)}
                className="flex-1 w-0 px-2 py-1 text-[10px] rounded-lg border border-emerald-300 focus:outline-none focus:border-emerald-500 bg-surface text-text-body"
              />
              <button type="submit" className="text-[9px] font-bold text-emerald-600 cursor-pointer px-1.5">✓</button>
              <button type="button" onClick={() => setEditingSteps(false)} className="text-[9px] font-bold text-text-muted cursor-pointer px-1">✕</button>
            </form>
          ) : (
            <div className="flex gap-1">
              <button onClick={() => setEditingSteps(true)}
                className="text-[9px] font-bold text-primary hover:underline cursor-pointer">
                Set Steps
              </button>
              <span className="text-text-muted text-[9px]">·</span>
              <button onClick={() => setSteps(0)}
                className="text-[9px] font-bold text-rose-400 hover:text-rose-600 cursor-pointer hover:underline">
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mood */}
      <div>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Today's Mood</p>
        <div className="flex gap-2">
          {moods.map(m => (
            <button
              key={m.label}
              onClick={() => setMood(mood === m.label ? null : m.label)}
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

const RELATIONS = ['Father', 'Mother', 'Spouse', 'Sibling', 'Child', 'Friend', 'Doctor', 'Other']

function parseEmergencyContacts(raw) {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [{ name: raw, phone: '', relation: 'Other' }] }
}

function EmergencyContactsCard({ user, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [myPhone, setMyPhone] = useState(user?.phone || '')
  const [contacts, setContacts] = useState(() => parseEmergencyContacts(user?.emergencyContact))
  const [saving, setSaving] = useState(false)

  const openEdit = () => {
    setMyPhone(user?.phone || '')
    setContacts(parseEmergencyContacts(user?.emergencyContact))
    setEditing(true)
  }

  const addContact = () => setContacts(prev => [...prev, { name: '', phone: '', relation: 'Other' }])
  const removeContact = (i) => setContacts(prev => prev.filter((_, idx) => idx !== i))
  const updateContact = (i, field, val) => setContacts(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const filled = contacts.filter(c => c.name || c.phone)
      await onUpdate({ phone: myPhone, emergencyContact: filled.length ? JSON.stringify(filled) : '' })
      setEditing(false)
    } catch {}
    setSaving(false)
  }

  const displayContacts = parseEmergencyContacts(user?.emergencyContact)
  const profileItems = [
    user?.bloodType && { icon: '🩸', label: 'Blood Type', value: user.bloodType },
    user?.dateOfBirth && { icon: '🎂', label: 'Date of Birth', value: new Date(user.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) },
  ].filter(Boolean)

  const inputCls = "w-full bg-white/80 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-900 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300"

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl border border-rose-200/60 p-5 shadow-soft hover-lift transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center text-base">🚨</div>
            <div>
              <h3 className="text-sm font-bold text-rose-800">Emergency Contacts</h3>
              <p className="text-[10px] text-rose-500">Quick-access critical info</p>
            </div>
          </div>
          <button
            onClick={() => editing ? setEditing(false) : openEdit()}
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer border-rose-200 text-rose-600 hover:bg-rose-100">
            {editing ? 'Cancel' : '✏️ Edit'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            {/* My Phone */}
            <div>
              <label className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block mb-1">📱 My Phone Number</label>
              <input type="tel" value={myPhone} onChange={e => setMyPhone(e.target.value)}
                placeholder="+1 555-0101" className={inputCls} />
            </div>

            {/* Emergency Contacts List */}
            <div className="space-y-3">
              <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">🆘 Emergency Contacts</p>
              {contacts.map((c, i) => (
                <div key={i} className="bg-white/60 rounded-xl p-3 border border-rose-100 space-y-2">
                  <div className="flex gap-2">
                    <input type="text" value={c.name} onChange={e => updateContact(i, 'name', e.target.value)}
                      placeholder="Contact name" className={`${inputCls} flex-1`} />
                    <select value={c.relation} onChange={e => updateContact(i, 'relation', e.target.value)}
                      className="bg-white/80 border border-rose-200 rounded-xl px-2 py-2 text-xs text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-300 cursor-pointer">
                      {RELATIONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input type="tel" value={c.phone} onChange={e => updateContact(i, 'phone', e.target.value)}
                      placeholder="Phone number" className={`${inputCls} flex-1`} />
                    <button type="button" onClick={() => removeContact(i)}
                      className="text-rose-400 hover:text-rose-600 hover:bg-rose-100 p-1.5 rounded-lg transition-all cursor-pointer shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addContact}
                className="w-full border-2 border-dashed border-rose-200 hover:border-rose-400 text-rose-400 hover:text-rose-600 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Contact
              </button>
            </div>

            <button type="submit" disabled={saving}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        ) : (
          <div className="space-y-2">
            {user?.phone && (
              <div className="flex items-center gap-3 bg-white/70 rounded-xl px-3 py-2.5 border border-rose-100 hover:border-rose-300/60 transition-colors">
                <span className="text-base shrink-0">📱</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">My Phone</p>
                  <p className="text-xs font-bold text-rose-900 truncate">{user.phone}</p>
                </div>
                <a href={`tel:${user.phone}`} className="text-[10px] font-bold text-rose-600 hover:text-rose-800 transition-colors shrink-0">Call →</a>
              </div>
            )}
            {displayContacts.map((c, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/70 rounded-xl px-3 py-2.5 border border-rose-100 hover:border-rose-300/60 transition-colors">
                <span className="text-base shrink-0">🆘</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">{c.relation || 'Emergency Contact'}</p>
                  <p className="text-xs font-bold text-rose-900 truncate">{c.name}</p>
                  {c.phone && <p className="text-[10px] text-rose-400">{c.phone}</p>}
                </div>
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="text-[10px] font-bold text-rose-600 hover:text-rose-800 transition-colors shrink-0">Call →</a>
                )}
              </div>
            ))}
            {!user?.phone && displayContacts.length === 0 && (
              <p className="text-[11px] text-rose-400 text-center py-2">Tap ✏️ Edit to add your phone and emergency contacts.</p>
            )}
          </div>
        )}
      </div>

      {profileItems.length > 0 && (
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
      )}
    </div>
  )
}

export default function PatientDashboard() {
  const { user, updateUser } = useAuth()
  const { pathname } = useLocation()
  const [readings, setReadings] = useState([])
  const [stats, setStats] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ mealType: 'Breakfast', timing: 'Before Meal', sugarLevel: '' })
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('month')

  const [prescriptions, setPrescriptions] = useState([])

  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [caretakerMessages, setCaretakerMessages] = useState([])
  const [caretakerNewMessage, setCaretakerNewMessage] = useState('')
  const [logOpen, setLogOpen] = useState(false)
  const [socket, setSocket] = useState(null)
  const [linkedDoctors, setLinkedDoctors] = useState([])
  const [linkedCaretakers, setLinkedCaretakers] = useState([])
  const [addingToTeam, setAddingToTeam] = useState(false)
  const [careSearch, setCareSearch] = useState('')
  const [careResults, setCareResults] = useState([])
  const [careSearchLoading, setCareSearchLoading] = useState(false)
  const [outgoingRequests, setOutgoingRequests] = useState([])

  const linkedDoctor = linkedDoctors[0] || null
  const linkedCaretaker = linkedCaretakers[0] || null
  const activeDoctorId = linkedDoctor?.user_id || null

  const fetchPrescriptions = async () => {
    if (!user?.id) return
    try {
      const { data } = await api.get(`/prescriptions/${user.id}`)
      setPrescriptions(data)
    } catch {
      setPrescriptions([])
    }
  }

  const fetchData = async () => {
    try {
      const docRes = await api.get('/doctor/my-doctor')
      const activeDoc = docRes.data.doctor
      const activeCT = docRes.data.caretaker
      setLinkedDoctors(docRes.data.doctors || (activeDoc ? [activeDoc] : []))
      setLinkedCaretakers(docRes.data.caretakers || (activeCT ? [activeCT] : []))
      const promises = [getReadings(user.id, filter), getStats(user.id)]
      if (activeDoc) promises.push(api.get(`/messages/${activeDoc.user_id}`))
      if (activeCT) promises.push(api.get(`/messages/${activeCT.user_id}`))
      const results = await Promise.all(promises)
      setReadings(results[0].data)
      setStats(results[1].data)
      if (activeDoc) setMessages(results[2]?.data || [])
      if (activeCT) setCaretakerMessages(results[activeDoc ? 3 : 2]?.data || [])
    } catch {
      const dummyReadings = [
        { reading_id: 'sr-1', sugar_level: 110, meal_type: 'Breakfast', timing: 'Before Meal', status: 'Normal', recorded_at: new Date(Date.now() - 86400000 * 4).toISOString() },
        { reading_id: 'sr-2', sugar_level: 155, meal_type: 'Lunch', timing: 'After Meal', status: 'High', recorded_at: new Date(Date.now() - 86400000 * 3).toISOString() },
        { reading_id: 'sr-3', sugar_level: 130, meal_type: 'Dinner', timing: 'After Meal', status: 'Normal', recorded_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { reading_id: 'sr-4', sugar_level: 72, meal_type: 'Breakfast', timing: 'Before Meal', status: 'Low', recorded_at: new Date(Date.now() - 86400000 * 1).toISOString() },
        { reading_id: 'sr-5', sugar_level: 118, meal_type: 'Lunch', timing: 'Before Meal', status: 'Normal', recorded_at: new Date().toISOString() }
      ]
      setReadings(dummyReadings)
      setStats({ avg_level: 117, min_level: 72, max_level: 155, total_readings: 5 })
      setLinkedDoctors([{ user_id: 'd-uuid-1', name: 'Dr. Sarah Jenkins', role: 'Doctor', email: 'doctor@glucolyse.com' }])
      setLinkedCaretakers([{ user_id: 'c-uuid-1', name: 'John Miller', role: 'Caretaker', email: 'caretaker@glucolyse.com' }])
      setMessages([
        { message_id: 'm-1', sender_id: 'd-uuid-1', receiver_id: user?.id || 'p-uuid-1', sender_name: 'Dr. Sarah Jenkins', sender_role: 'Doctor', message_text: 'Your morning fasting blood sugars are looking much more stable. Keep up the great work!', sent_at: new Date(Date.now() - 3600000 * 4).toISOString() },
        { message_id: 'm-2', sender_id: user?.id || 'p-uuid-1', receiver_id: 'd-uuid-1', sender_name: 'You', sender_role: 'Patient', message_text: 'Thank you! I have been walking for 20 minutes after dinner as well.', sent_at: new Date(Date.now() - 3600000 * 3).toISOString() }
      ])
      setCaretakerMessages([
        { message_id: 'cm-1', sender_id: 'c-uuid-1', receiver_id: user?.id || 'p-uuid-1', sender_name: 'John Miller', sender_role: 'Caretaker', message_text: "Hi! Just checking in — how are you feeling today?", sent_at: new Date(Date.now() - 3600000 * 2).toISOString() }
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

  const handleUnlink = async (memberId, memberRole) => {
    try {
      await api.post('/doctor/unlink', { memberId, memberRole })
      if (memberRole === 'Doctor') setLinkedDoctors(prev => prev.filter(d => d.user_id !== memberId))
      else setLinkedCaretakers(prev => prev.filter(c => c.user_id !== memberId))
    } catch {}
  }

  useEffect(() => {
    const s = io(window.location.origin)
    setSocket(s)
    if (user?.id) s.emit('register', user.id)
    s.on('newMessage', (msg) => {
      const isFromDoctor = linkedDoctor && (msg.sender_id === linkedDoctor.user_id || msg.receiver_id === linkedDoctor.user_id)
      const isFromCaretaker = linkedCaretaker && (msg.sender_id === linkedCaretaker.user_id || msg.receiver_id === linkedCaretaker.user_id)
      if (isFromCaretaker && !isFromDoctor) {
        setCaretakerMessages(prev => prev.some(m => m.message_id === msg.message_id) ? prev : [...prev, msg])
      } else {
        setMessages(prev => prev.some(m => m.message_id === msg.message_id) ? prev : [...prev, msg])
      }
    })
    s.on('newReading', (reading) => {
      setReadings(prev => prev.some(r => r.reading_id === reading.reading_id) ? prev : [reading, ...prev])
    })
    s.on('newNotification', (notif) => {
      window.dispatchEvent(new CustomEvent('glucolyse:notification', { detail: notif }))
    })
    return () => s.disconnect()
  }, [user, linkedDoctor, linkedCaretaker])

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

  useEffect(() => { fetchData(); fetchMyRequests(); fetchPrescriptions() }, [filter])

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

  const handleDeleteReading = async (readingId) => {
    setReadings(prev => prev.filter(r => r.reading_id !== readingId))
    try {
      await api.delete(`/readings/${readingId}`)
    } catch {}
  }

  const togglePrescription = async (id) => {
    setPrescriptions(prev => prev.map(p => (p.id || p.prescription_id) === id ? { ...p, status: p.status === 'Taken' ? 'Pending' : 'Taken' } : p))
    try {
      const { data } = await api.patch(`/prescriptions/${id}/toggle`)
      setPrescriptions(prev => prev.map(p => (p.id || p.prescription_id) === id ? { ...p, status: data.status } : p))
    } catch {}
  }

  const handleSendCaretakerMessage = async (e) => {
    e.preventDefault()
    if (!caretakerNewMessage.trim() || !linkedCaretaker) return
    const textToSend = caretakerNewMessage
    setCaretakerNewMessage('')
    try {
      const { data } = await api.post('/messages/send', { receiverId: linkedCaretaker.user_id, text: textToSend })
      setCaretakerMessages(prev => [...prev, data])
      if (socket) socket.emit('sendMessage', data)
    } catch {
      const msg = { message_id: String(Date.now()), sender_id: user.id, receiver_id: linkedCaretaker.user_id, sender_name: 'You', sender_role: 'Patient', message_text: textToSend, sent_at: new Date().toISOString() }
      setCaretakerMessages(prev => [...prev, msg])
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeDoctorId) return
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
        <Navbar title="Patient Overview" />
        <NotificationPermissionBanner />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-7">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/20 shadow-md" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-xl font-black text-white shadow-md shadow-primary/20">
                    {user?.name?.charAt(0)}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-surface rounded-full shadow-sm" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-2xl font-black text-text-heading tracking-tight">
                    {greeting}, {user?.name?.split(' ')[0]}
                  </h2>
                  <span className="text-xl">👋</span>
                </div>
                <p className="text-text-secondary text-sm mt-0.5">Here is your daily health update and glucose analytics.</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
                  {linkedDoctors.length === 0 && linkedCaretakers.length === 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-xs bg-surface-elevated text-text-muted px-2.5 py-1 rounded-full font-medium border border-surface-border italic">No care team linked</span>
                  ) : (
                    <>
                      {linkedDoctors.map(d => (
                        <span key={d.user_id} className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-semibold">
                          🩺 {d.name}
                        </span>
                      ))}
                      {linkedCaretakers.map(c => (
                        <span key={c.user_id} className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full font-semibold">
                          🤝 {c.name}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ translateY: -2, boxShadow: '0 10px 20px -4px rgba(72,123,164,0.3)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm cursor-pointer flex items-center gap-2 shrink-0 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Log Blood Sugar
            </motion.button>
          </motion.div>

          {/* ── Add Entry Card ── */}
          <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-surface-card rounded-2xl border border-primary/20 shadow-card p-6 ring-1 ring-primary/10">
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
            </motion.div>
          )}
          </AnimatePresence>

          {/* ── Smart Insights ── */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}>
            <SmartInsights readings={filteredReadings} stats={filteredStats} />
          </motion.div>

          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard delay={0.08} title={`Average Level (${filterLabel})`} value={filteredStats?.avg_level || '--'} trend={getStatusColor(filteredStats?.avg_level)}
              icon={<svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2" /></svg>} />
            <StatCard delay={0.14} title={`Minimum Level (${filterLabel})`} value={filteredStats?.min_level || '--'} trend="Low" color="bg-amber-500/10 text-amber-500"
              icon={<svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>} />
            <StatCard delay={0.20} title={`Maximum Level (${filterLabel})`} value={filteredStats?.max_level || '--'} trend="High" color="bg-rose-500/10 text-rose-500"
              icon={<svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>} />
          </div>

          {/* ── Activity Heatmap ── */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
            <ActivityHeatmap data={readings} />
          </motion.div>

          {/* ── Recent Readings Log ── */}
          <div className="bg-surface-card rounded-2xl border border-surface-border shadow-soft hover-lift transition-all duration-300">
            <button
              onClick={() => setLogOpen(o => !o)}
              className="w-full flex items-center justify-between p-5 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-text-heading">Recent Readings Log</h3>
                  <p className="text-text-secondary text-[11px]">{filteredReadings.length} entries · tap to expand · click ✕ to remove a wrong entry</p>
                </div>
              </div>
              <svg className={`w-4 h-4 text-text-muted transition-transform duration-200 ${logOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {logOpen && (
              <div className="px-5 pb-5">
                {filteredReadings.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-4">No readings in this period.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-text-muted uppercase tracking-wider text-[9px]">
                          <th className="text-left pb-2 font-bold">Date</th>
                          <th className="text-left pb-2 font-bold">Meal</th>
                          <th className="text-left pb-2 font-bold">Timing</th>
                          <th className="text-left pb-2 font-bold">Level</th>
                          <th className="text-left pb-2 font-bold">Status</th>
                          <th className="text-right pb-2 font-bold">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border/50">
                        {[...filteredReadings].reverse().map(r => (
                          <tr key={r.reading_id} className="hover:bg-surface-elevated/40 transition-colors">
                            <td className="py-2 text-text-secondary">{new Date(r.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                            <td className="py-2 text-text-body font-medium">{r.meal_type}</td>
                            <td className="py-2 text-text-secondary">{r.timing}</td>
                            <td className="py-2 font-bold text-text-heading">{r.sugar_level} <span className="font-normal text-text-muted">mg/dL</span></td>
                            <td className="py-2">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${r.status === 'High' ? 'bg-rose-500/10 text-rose-600' : r.status === 'Low' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="py-2 text-right">
                              <button onClick={() => handleDeleteReading(r.reading_id)}
                                className="text-text-muted hover:text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-all cursor-pointer"
                                title="Remove this entry">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Charts ── */}
          <div id="readings-trends-section" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-2 bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft hover-lift transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-text-heading">Sugar Trends</h3>
                  <p className="text-text-secondary text-xs mt-0.5">Breakfast · Lunch · Dinner readings</p>
                </div>
                <div className="flex gap-1 bg-surface-elevated rounded-lg p-1">
                  {[['week', 'Week'], ['month', 'Month'], ['year', 'Year']].map(([val, label]) => (
                    <button key={val} onClick={() => setFilter(val)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${filter === val ? 'dark:bg-slate-700 text-text-heading shadow-sm opacity-[0.79] bg-[color:var(--color-emerald-300)]' : 'text-text-muted hover:text-text-secondary bg-[color:var(--color-emerald-300)]'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <SugarLineChart data={filteredReadings} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft hover-lift transition-all duration-300"
            >
              <h3 className="text-base font-bold text-text-heading mb-1">Log Breakdown</h3>
              <p className="text-text-secondary text-xs mb-4">High · Low · Normal distribution ({filterLabel})</p>
              <ReadingPieChart data={filteredReadings} />
            </motion.div>
          </div>

          {/* ── Lower Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

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
              {prescriptions.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="text-2xl mb-2">💊</div>
                  <p className="text-xs text-text-muted">No prescriptions yet. Your doctor will add them here.</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-border">
                  {prescriptions.map((pill) => {
                    const pid = pill.prescription_id || pill.id
                    return (
                      <div key={pid} className="checklist-item py-3.5 flex items-center justify-between gap-4 rounded-xl px-2">
                        <div className="flex items-start gap-3">
                          <button onClick={() => togglePrescription(pid)}
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
                            <p className="text-xs text-text-secondary mt-0.5">{pill.frequency}{pill.time ? ` · ${pill.time}` : ''}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Wellness */}
            <ActivityTracker />

            {/* Care Team Management */}
            <div id="chat-consultation-section" className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft hover-lift transition-all duration-300">

              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm shrink-0">👥</div>
                  <div>
                    <h3 className="text-sm font-bold text-text-heading">Care Team</h3>
                    <p className="text-[10px] text-text-secondary">{linkedDoctors.length + linkedCaretakers.length} member{linkedDoctors.length + linkedCaretakers.length !== 1 ? 's' : ''} linked</p>
                  </div>
                </div>
                <button
                  onClick={() => { setAddingToTeam(v => !v); setCareResults([]); setCareSearch('') }}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    addingToTeam ? 'border-text-muted text-text-muted hover:bg-surface-elevated' : 'border-primary text-primary hover:bg-primary/5'
                  }`}>
                  {addingToTeam ? '✕ Cancel' : '+ Add Member'}
                </button>
              </div>

              {/* Linked care team members */}
              {(linkedDoctors.length > 0 || linkedCaretakers.length > 0) && !addingToTeam && (
                <div className="space-y-2 mb-4">
                  {linkedDoctors.map(d => (
                    <div key={d.user_id} className="flex items-center gap-3 bg-blue-50/70 dark:bg-blue-900/10 rounded-xl px-3 py-2.5 border border-blue-100 dark:border-blue-900/30">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">{d.name?.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-text-heading truncate">{d.name}</p>
                        <p className="text-[10px] text-blue-600 font-medium truncate">🩺 Doctor · {d.email}</p>
                      </div>
                      <button onClick={() => handleUnlink(d.user_id, 'Doctor')}
                        className="text-[10px] text-rose-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-all cursor-pointer font-semibold shrink-0 border border-transparent hover:border-rose-100">
                        Remove
                      </button>
                    </div>
                  ))}
                  {linkedCaretakers.map(c => (
                    <div key={c.user_id} className="flex items-center gap-3 bg-emerald-50/70 dark:bg-emerald-900/10 rounded-xl px-3 py-2.5 border border-emerald-100 dark:border-emerald-900/30">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">{c.name?.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-text-heading truncate">{c.name}</p>
                        <p className="text-[10px] text-emerald-600 font-medium truncate">🤝 Caretaker · {c.email}</p>
                      </div>
                      <button onClick={() => handleUnlink(c.user_id, 'Caretaker')}
                        className="text-[10px] text-rose-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-all cursor-pointer font-semibold shrink-0 border border-transparent hover:border-rose-100">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add member / search form */}
              {(addingToTeam || (linkedDoctors.length === 0 && linkedCaretakers.length === 0)) && (
                <div className="space-y-3 mb-4">
                  {outgoingRequests.filter(r => r.status === 'pending').length > 0 && (
                    <div className="space-y-2">
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
                  {linkedDoctors.length === 0 && linkedCaretakers.length === 0 && outgoingRequests.filter(r => r.status === 'pending').length === 0 && (
                    <div className="text-center py-2">
                      <div className="w-10 h-10 rounded-full bg-primary-50 text-primary flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h4 className="text-xs font-bold text-text-heading">Find Your Care Team</h4>
                      <p className="text-[10px] text-text-secondary mt-0.5">Search by name or email</p>
                    </div>
                  )}
                  <form onSubmit={handleCareSearch} className="flex gap-2">
                    <input type="text" placeholder="Search doctor or caretaker..." value={careSearch} onChange={e => setCareSearch(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-surface-border focus:outline-none focus:border-primary bg-surface text-text-body placeholder-text-muted" />
                    <button type="submit" disabled={careSearchLoading}
                      className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shrink-0">
                      {careSearchLoading ? '...' : 'Search'}
                    </button>
                  </form>
                  {careResults.length > 0 && (
                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {careResults.map(prof => {
                        const alreadySent = outgoingRequests.some(r => r.to_id === prof.user_id && r.status === 'pending')
                        const alreadyLinked = [...linkedDoctors, ...linkedCaretakers].some(m => m.user_id === prof.user_id)
                        return (
                          <div key={prof.user_id} className="flex items-center gap-2 bg-surface-elevated rounded-xl px-3 py-2.5 border border-surface-border hover:border-primary/30 transition-colors">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[11px] font-bold shrink-0">{prof.name?.charAt(0)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-text-heading truncate">{prof.name}</p>
                              <p className="text-[9px] text-text-secondary truncate">{prof.email}</p>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${prof.role === 'Doctor' ? 'bg-blue-500/10 text-blue-600' : 'bg-purple-500/10 text-purple-600'}`}>{prof.role}</span>
                            <button onClick={() => handleSendRequest(prof.user_id)} disabled={alreadySent || alreadyLinked}
                              className="ml-1 px-2.5 py-1 bg-primary hover:bg-primary-dark text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-40 shrink-0">
                              {alreadyLinked ? '✓ Linked' : alreadySent ? '✓ Sent' : 'Request'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Doctor chat — shown when doctor linked and not in add mode */}
              {linkedDoctor && !addingToTeam && (
                <div className="border-t border-surface-border pt-3">
                  <p className="text-[9px] font-bold text-primary uppercase tracking-wider mb-2">💬 Chat with {linkedDoctor.name}</p>
                  <div className="overflow-y-auto space-y-3 pr-1 text-xs max-h-[160px] mb-3">
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
                </div>
              )}
            </div>
          </div>

          {/* ── Caretaker Chat ── */}
          {linkedCaretaker && (
            <div id="caretaker-chat-section" className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft hover-lift transition-all duration-300 flex flex-col">
              <div className="flex items-center gap-3 pb-3 border-b border-surface-border mb-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                    {linkedCaretaker.name?.charAt(0)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-surface-card rounded-full" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-heading">Chat with {linkedCaretaker.name}</h3>
                  <p className="text-[11px] text-text-secondary">Direct line to your caretaker</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1 max-h-[220px] min-h-[120px]">
                {caretakerMessages.length === 0 ? (
                  <div className="text-center py-6 text-text-muted text-[11px]">No messages yet. Say hello!</div>
                ) : caretakerMessages.map(msg => (
                  <div key={msg.message_id || msg.sent_at} className={`flex flex-col ${msg.sender_id === user.id ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] text-text-muted font-medium mb-0.5">
                      {msg.sender_id === user.id ? 'You' : msg.sender_name} · {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${msg.sender_id === user.id ? 'bg-teal-500 text-white rounded-tr-none' : 'bg-surface-elevated text-text-body rounded-tl-none'}`}>
                      {msg.message_text}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendCaretakerMessage} className="flex gap-2 mt-4 pt-3 border-t border-surface-border">
                <input type="text" placeholder="Message your caretaker..." value={caretakerNewMessage} onChange={e => setCaretakerNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2 text-xs rounded-lg border border-surface-border focus:outline-none focus:border-teal-400 bg-surface text-text-body placeholder-text-muted" />
                <button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer hover:shadow-sm">
                  Send
                </button>
              </form>
            </div>
          )}

          {/* ── Emergency Contacts Card ── */}
          <EmergencyContactsCard user={user} onUpdate={updateUser} />

          {/* ── Notification Settings ── */}
          <NotificationSettingsPanel />

        </main>
      </div>
    </div>
  )
}
