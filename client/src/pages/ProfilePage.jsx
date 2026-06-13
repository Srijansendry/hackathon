import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const RELATIONS   = ['Father', 'Mother', 'Spouse', 'Sibling', 'Child', 'Friend', 'Doctor', 'Other']
const SPECIALTIES = ['General Practitioner', 'Endocrinologist', 'Cardiologist', 'Nutritionist', 'Diabetologist', 'Internist', 'Other']

function parseEmergencyContacts(raw) {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [{ name: raw, phone: '', relation: 'Other' }] }
}

const fade = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }

const inputCls = "w-full bg-surface-elevated border border-surface-border rounded-xl px-3.5 py-2.5 text-sm text-text-heading placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
const labelCls = "text-[10px] font-extrabold uppercase tracking-widest text-text-muted block mb-1.5"

const roleAccents = {
  Patient:   { bg: 'bg-rose-50 dark:bg-rose-900/20',   text: 'text-rose-600',   badge: 'bg-rose-100 text-rose-600 border-rose-200',   ring: 'ring-rose-300/40',   from: '#ef4444', to: '#487ba4' },
  Doctor:    { bg: 'bg-sky-50 dark:bg-sky-900/20',     text: 'text-sky-600',    badge: 'bg-sky-100 text-sky-600 border-sky-200',       ring: 'ring-sky-300/40',    from: '#487ba4', to: '#38bdf8' },
  Caretaker: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-600 border-emerald-200', ring: 'ring-emerald-300/40', from: '#10b981', to: '#06b6d4' },
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const role = user?.role || 'Patient'
  const accent = roleAccents[role] || roleAccents.Patient

  const [activeTab, setActiveTab] = useState('personal')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name:          user?.name || '',
    phone:         user?.phone || '',
    dateOfBirth:   user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
    bloodType:     user?.bloodType || '',
    specialty:     user?.specialty || '',
  })

  const [contacts, setContacts]   = useState(() => parseEmergencyContacts(user?.emergencyContact))
  const [myPhone,  setMyPhone]    = useState(user?.phone || '')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const addContact    = () => setContacts(p => [...p, { name: '', phone: '', relation: 'Other' }])
  const removeContact = (i) => setContacts(p => p.filter((_, idx) => idx !== i))
  const updateContact = (i, field, val) => setContacts(p => p.map((c, idx) => idx === i ? { ...c, [field]: val } : c))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { name: form.name, phone: myPhone }
      if (role === 'Patient') {
        payload.dateOfBirth   = form.dateOfBirth || null
        payload.bloodType     = form.bloodType   || null
        const filled = contacts.filter(c => c.name || c.phone)
        payload.emergencyContact = filled.length ? JSON.stringify(filled) : ''
      }
      if (role === 'Doctor') payload.specialty = form.specialty || null
      await updateUser(payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save changes. Please try again.')
    }
    setSaving(false)
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    ...(role === 'Patient' ? [{ id: 'emergency', label: 'Emergency Contacts', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' }] : []),
    { id: 'account', label: 'Account', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ]

  return (
    <div className="flex h-screen bg-surface transition-colors duration-200">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
        <Navbar title="My Profile" />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* ── Profile Card ── */}
            <motion.div {...fade}
              className="glass-card rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-30"
                style={{ background: `radial-gradient(circle, ${accent.from}44, transparent 70%)` }} />

              <div className={`relative shrink-0 w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-xl ring-4 ${accent.ring}`}
                style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}>
                {user?.photoUrl
                  ? <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover rounded-3xl" />
                  : user?.name?.charAt(0)}
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 border-2 border-surface rounded-full shadow-sm" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-black text-text-heading tracking-tight">{user?.name}</h1>
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${accent.badge}`}>{role}</span>
                </div>
                <p className="text-sm text-text-muted">{user?.email}</p>
                {user?.specialty && <p className="text-xs text-text-secondary mt-0.5">{user.specialty}</p>}
                <div className="flex flex-wrap gap-3 mt-3">
                  {user?.phone && (
                    <span className="inline-flex items-center gap-1.5 text-xs bg-surface-elevated border border-surface-border px-2.5 py-1 rounded-full text-text-secondary font-medium">
                      📱 {user.phone}
                    </span>
                  )}
                  {user?.bloodType && (
                    <span className="inline-flex items-center gap-1.5 text-xs bg-surface-elevated border border-surface-border px-2.5 py-1 rounded-full text-text-secondary font-medium">
                      🩸 {user.bloodType}
                    </span>
                  )}
                  {user?.dateOfBirth && (
                    <span className="inline-flex items-center gap-1.5 text-xs bg-surface-elevated border border-surface-border px-2.5 py-1 rounded-full text-text-secondary font-medium">
                      🎂 {new Date(user.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── Tabs ── */}
            <motion.div {...fade} transition={{ ...fade.transition, delay: 0.05 }}
              className="flex gap-1 bg-surface-elevated rounded-2xl p-1.5 border border-surface-border">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-surface-card shadow-sm text-text-heading border border-surface-border'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                  </svg>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </motion.div>

            {/* ── Tab Content ── */}
            <motion.form onSubmit={handleSave} key={activeTab}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card rounded-3xl p-6 space-y-6">

              {/* Personal Info Tab */}
              {activeTab === 'personal' && (
                <>
                  <div>
                    <h2 className="text-base font-bold text-text-heading mb-1">Personal Information</h2>
                    <p className="text-xs text-text-muted">Update your name, phone, and health details.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <input value={form.name} onChange={set('name')} placeholder="Your full name" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Phone Number</label>
                      <input type="tel" value={myPhone} onChange={e => setMyPhone(e.target.value)} placeholder="+1 555-0101" className={inputCls} />
                    </div>

                    {role === 'Patient' && (
                      <>
                        <div>
                          <label className={labelCls}>Date of Birth</label>
                          <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Blood Type</label>
                          <select value={form.bloodType} onChange={set('bloodType')} className={inputCls}>
                            <option value="">Select blood type</option>
                            {BLOOD_TYPES.map(t => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                      </>
                    )}

                    {role === 'Doctor' && (
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Specialty</label>
                        <select value={form.specialty} onChange={set('specialty')} className={inputCls}>
                          <option value="">Select specialty</option>
                          {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Emergency Contacts Tab */}
              {activeTab === 'emergency' && role === 'Patient' && (
                <>
                  <div>
                    <h2 className="text-base font-bold text-text-heading mb-1">Emergency Contacts</h2>
                    <p className="text-xs text-text-muted">Add people to contact in case of a medical emergency.</p>
                  </div>

                  <div>
                    <label className={labelCls}>📱 My Phone Number</label>
                    <input type="tel" value={myPhone} onChange={e => setMyPhone(e.target.value)}
                      placeholder="+1 555-0101" className={inputCls} />
                  </div>

                  <div className="space-y-3">
                    <p className={labelCls}>🆘 Emergency Contacts</p>
                    {contacts.length === 0 && (
                      <p className="text-xs text-text-muted text-center py-4 bg-surface-elevated rounded-2xl border border-dashed border-surface-border">
                        No emergency contacts yet — add one below.
                      </p>
                    )}
                    {contacts.map((c, i) => (
                      <div key={i} className="bg-surface-elevated rounded-2xl p-4 border border-surface-border space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-text-secondary">Contact {i + 1}</span>
                          <button type="button" onClick={() => removeContact(i)}
                            className="text-[10px] font-bold text-rose-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-all cursor-pointer">
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>Name</label>
                            <input type="text" value={c.name}
                              onChange={e => updateContact(i, 'name', e.target.value)}
                              placeholder="Contact name" className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Relationship</label>
                            <select value={c.relation}
                              onChange={e => updateContact(i, 'relation', e.target.value)}
                              className={inputCls}>
                              {RELATIONS.map(r => <option key={r}>{r}</option>)}
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <label className={labelCls}>Phone Number</label>
                            <input type="tel" value={c.phone}
                              onChange={e => updateContact(i, 'phone', e.target.value)}
                              placeholder="+1 555-0102" className={inputCls} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addContact}
                      className="w-full border-2 border-dashed border-surface-border hover:border-primary/50 text-text-muted hover:text-primary py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Add Emergency Contact
                    </button>
                  </div>
                </>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <>
                  <div>
                    <h2 className="text-base font-bold text-text-heading mb-1">Account Details</h2>
                    <p className="text-xs text-text-muted">Your account information and linked role.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-surface-elevated rounded-2xl px-4 py-3 border border-surface-border">
                      <div>
                        <p className={labelCls}>Email Address</p>
                        <p className="text-sm font-semibold text-text-heading">{user?.email}</p>
                      </div>
                      <span className="text-[10px] font-bold text-text-muted bg-surface-card px-2 py-1 rounded-lg border border-surface-border">Read-only</span>
                    </div>
                    <div className="flex items-center justify-between bg-surface-elevated rounded-2xl px-4 py-3 border border-surface-border">
                      <div>
                        <p className={labelCls}>Role</p>
                        <p className={`text-sm font-bold ${accent.text}`}>{role}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${accent.badge}`}>{role} Portal</span>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 rounded-2xl px-4 py-3">
                      <p className="text-xs font-bold text-amber-700 mb-0.5">Password</p>
                      <p className="text-[11px] text-amber-600">To change your password, please contact support or use the reset password link from the login page.</p>
                    </div>
                  </div>
                  <div className="opacity-0 pointer-events-none h-0" />
                </>
              )}

              {/* Save / Feedback */}
              {activeTab !== 'account' && (
                <div className="flex items-center gap-3 pt-2 border-t border-surface-border">
                  {error && <p className="text-xs text-rose-500 flex-1">{error}</p>}
                  {saved && !error && (
                    <p className="text-xs text-emerald-600 font-semibold flex-1 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Changes saved successfully!
                    </p>
                  )}
                  {!error && !saved && <span className="flex-1" />}
                  <button type="submit" disabled={saving}
                    className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all cursor-pointer disabled:opacity-50 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              )}
            </motion.form>

          </div>
        </main>
      </div>
    </div>
  )
}
