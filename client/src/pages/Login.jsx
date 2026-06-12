import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

// ── 3D Floating Health Metric Cards ──────────────────────────────────────────
const healthMetrics = [
  { icon: '🩸', label: 'Blood Glucose', value: '98', unit: 'mg/dL', color: 'from-rose-400/20 to-rose-600/10', border: 'border-rose-400/30' },
  { icon: '💓', label: 'Heart Rate', value: '72', unit: 'BPM', color: 'from-violet-400/20 to-violet-600/10', border: 'border-violet-400/30' },
  { icon: '📊', label: 'HbA1c Level', value: '5.7', unit: '%', color: 'from-sky-400/20 to-sky-600/10', border: 'border-sky-400/30' },
  { icon: '🫁', label: 'Oxygen Sat.', value: '98', unit: 'SpO₂', color: 'from-emerald-400/20 to-emerald-600/10', border: 'border-emerald-400/30' },
  { icon: '⚡', label: 'Blood Pressure', value: '120/80', unit: 'mmHg', color: 'from-amber-400/20 to-amber-600/10', border: 'border-amber-400/30' },
]

function Float3DCards() {
  const positions = [
    { top: '4%',  left: '-4%',  animClass: 'animate-float-a', rotate: '-6deg', scale: '0.88' },
    { top: '22%', right: '-6%', animClass: 'animate-float-b', rotate: '5deg',  scale: '0.94' },
    { top: '50%', left: '-2%',  animClass: 'animate-float-c', rotate: '-3deg', scale: '0.90' },
    { top: '68%', right: '-4%', animClass: 'animate-float-a', rotate: '7deg',  scale: '0.86' },
    { top: '86%', left: '10%',  animClass: 'animate-float-b', rotate: '-4deg', scale: '0.82' },
  ]

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ perspective: '900px', perspectiveOrigin: '50% 50%' }}>
      {healthMetrics.map((m, i) => (
        <div
          key={m.label}
          className={`absolute ${positions[i].animClass}`}
          style={{
            top: positions[i].top,
            left: positions[i].left,
            right: positions[i].right,
            transform: `rotate(${positions[i].rotate}) scale(${positions[i].scale})`,
          }}
        >
          <div className={`bg-gradient-to-br ${m.color} backdrop-blur-md border ${m.border} rounded-2xl px-4 py-3 min-w-[128px] shadow-xl`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">{m.icon}</span>
              <span className="text-[9px] text-white/60 uppercase tracking-wider font-bold">{m.label}</span>
            </div>
            <div className="text-white font-extrabold text-lg leading-none">
              {m.value}
              <span className="text-white/50 text-[10px] font-semibold ml-1">{m.unit}</span>
            </div>
          </div>
        </div>
      ))}

      {/* Animated 3D rings in center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ perspective: '600px' }}>
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Pulsing glow center */}
          <div className="absolute w-20 h-20 bg-sky-300/20 rounded-full blur-2xl animate-pulse" />
          {/* Ring 1 */}
          <div
            className="absolute border-2 border-white/15 rounded-full"
            style={{ width: 120, height: 120, animation: 'spinRing 8s linear infinite', transformStyle: 'preserve-3d' }}
          />
          {/* Ring 2 */}
          <div
            className="absolute border border-white/10 rounded-full"
            style={{ width: 90, height: 90, animation: 'spinRing2 12s linear infinite reverse', transformStyle: 'preserve-3d' }}
          />
          {/* Ring 3 vertical */}
          <div
            className="absolute border border-white/10 rounded-full"
            style={{ width: 70, height: 70, animation: 'spinRingVert 6s linear infinite', transformStyle: 'preserve-3d' }}
          />
          {/* Center heart */}
          <svg className="relative z-10 w-8 h-8 text-white/60 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

// ── Role-specific optional fields config ──────────────────────────────────────
const roleFields = {
  Patient: [
    { key: 'phone', label: 'Phone Number', placeholder: '+1 555-0100', type: 'tel', icon: '📱' },
    { key: 'dateOfBirth', label: 'Date of Birth', placeholder: '', type: 'date', icon: '🎂' },
    { key: 'bloodType', label: 'Blood Type', placeholder: 'e.g. O+', type: 'text', icon: '🩸' },
    { key: 'emergencyContact', label: 'Emergency Contact', placeholder: 'Name & Number', type: 'text', icon: '🆘' },
  ],
  Doctor: [
    { key: 'phone', label: 'Phone Number', placeholder: '+1 555-0200', type: 'tel', icon: '📱' },
    { key: 'specialty', label: 'Specialty', placeholder: 'e.g. Endocrinology', type: 'text', icon: '🏥' },
    { key: 'dateOfBirth', label: 'Date of Birth', placeholder: '', type: 'date', icon: '🎂' },
    { key: 'licenseNo', label: 'License No. (optional)', placeholder: 'MD-000000', type: 'text', icon: '📋' },
  ],
  Caretaker: [
    { key: 'phone', label: 'Phone Number', placeholder: '+1 555-0300', type: 'tel', icon: '📱' },
    { key: 'dateOfBirth', label: 'Date of Birth', placeholder: '', type: 'date', icon: '🎂' },
    { key: 'relationship', label: 'Relationship to Patient', placeholder: 'e.g. Family Member', type: 'text', icon: '🤝' },
    { key: 'emergencyContact', label: 'Emergency Contact', placeholder: 'Name & Number', type: 'text', icon: '🆘' },
  ],
}

// ── Compress and convert image to base64 ─────────────────────────────────────
function compressImage(file, size = 128) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      const ratio = Math.max(size / img.width, size / img.height)
      const w = img.width * ratio
      const h = img.height * ratio
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.src = url
  })
}

// ── Main Login Component ──────────────────────────────────────────────────────
export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [activeTab, setActiveTab] = useState('Patient')
  const [showPassword, setShowPassword] = useState(false)
  const [showOptional, setShowOptional] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    phone: '', dateOfBirth: '', bloodType: '', emergencyContact: '',
    specialty: '', licenseNo: '', relationship: '',
    photoUrl: null,
  })
  const [photoPreview, setPhotoPreview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const compressed = await compressImage(file)
    setPhotoPreview(compressed)
    setForm(f => ({ ...f, photoUrl: compressed }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          role: activeTab,
          phone: form.phone || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          bloodType: form.bloodType || undefined,
          emergencyContact: form.emergencyContact || undefined,
          specialty: form.specialty || undefined,
          photoUrl: form.photoUrl || undefined,
        })
      } else {
        await login(form.email, form.password)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleFillDemo = (email, password, role) => {
    setForm(f => ({ ...f, email, password }))
    setActiveTab(role)
    setIsRegister(false)
  }

  const switchMode = () => {
    setIsRegister(v => !v)
    setError('')
    setShowOptional(false)
  }

  const roleIcon = { Patient: '🫀', Doctor: '🩺', Caretaker: '🤝' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col lg:flex-row font-sans">

      {/* ── LEFT PANEL ───────────────────────────────────────────────────── */}
      <div className="lg:w-[44%] bg-gradient-to-br from-[#1a3a5c] via-[#2d5a87] to-[#3d6f9f] text-white flex flex-col justify-between p-8 sm:p-12 relative overflow-hidden shadow-2xl min-h-[320px] lg:min-h-screen">

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
        {/* Radial glow spots */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-400/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-white/3 rounded-full blur-2xl" />

        {/* 3D Floating cards (hidden on mobile to keep layout clean) */}
        <div className="hidden lg:block">
          <Float3DCards />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
              </svg>
            </div>
            <span className="text-2xl font-extrabold tracking-wide">Glucolyse</span>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 my-auto py-12 lg:py-20">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-300 animate-pulse" />
            <p className="text-sky-200/90 text-[10px] font-bold tracking-[0.2em] uppercase">Diabetes Management Platform</p>
          </div>
          <h1 className="text-4xl sm:text-5xl font-light leading-tight tracking-wide mb-6">
            Your health,<br />
            <span className="font-black bg-gradient-to-r from-white via-sky-100 to-sky-300 bg-clip-text text-transparent">
              simplified.
            </span>
          </h1>
          <p className="text-white/65 text-sm max-w-sm leading-relaxed">
            Monitor blood sugar, track patterns, and stay connected with your entire care team — all in one secure place.
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { label: 'Real-time monitoring', icon: '📊' },
              { label: 'Secure messaging', icon: '🔒' },
              { label: 'Smart insights', icon: '✨' },
              { label: 'Care team sync', icon: '🤝' },
            ].map((f, i) => (
              <span key={f.label} className="flex items-center gap-1.5 text-[10px] font-semibold text-white/75 bg-white/8 border border-white/12 px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-white/15 hover:border-white/25 transition-all duration-200 cursor-default">
                <span>{f.icon}</span>{f.label}
              </span>
            ))}
          </div>

        </div>

        <div className="relative z-10 text-[10px] text-white/40 font-semibold tracking-widest">
          © {new Date().getFullYear()} GLUCOLYSE INC. · ALL RIGHTS RESERVED.
        </div>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50 to-sky-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-slate-50 to-blue-50 rounded-full blur-3xl opacity-60 translate-y-1/3 -translate-x-1/4" />

        <motion.div
          key={isRegister ? 'register' : 'login'}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px] relative z-10 py-6"
        >

          {/* Heading */}
          <div className="mb-7">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary border border-primary/20 rounded-full px-3 py-1 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {isRegister ? `${activeTab} Registration` : 'Secure Sign In'}
              </span>
            </div>
            <h2 className="text-[28px] font-black text-slate-800 tracking-tight mb-1.5 leading-tight">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              {isRegister ? 'Join the Glucolyse care network today.' : 'Sign in to continue to your dashboard.'}
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold shadow-sm flex items-center gap-2.5"
              >
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-sm">⚠️</div>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Role Tab Selector */}
          <div className="bg-slate-100/80 p-1 rounded-2xl flex mb-6 border border-slate-200/60 shadow-inner gap-1">
            {['Patient', 'Doctor', 'Caretaker'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setActiveTab(role)}
                className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all duration-250 cursor-pointer flex items-center justify-center gap-1.5 relative ${
                  activeTab === role
                    ? 'bg-white text-[#3d6f9f] shadow-md border border-blue-100/50'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                }`}
              >
                <span className="text-base">{roleIcon[role]}</span>
                <span className="hidden sm:inline">{role}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Photo upload — registration only */}
            {isRegister && (
              <div className="flex flex-col items-center mb-2">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="photo-upload-ring w-20 h-20 rounded-full border-2 border-dashed border-[#487ba4]/40 bg-blue-50 flex items-center justify-center cursor-pointer overflow-hidden relative group"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[#487ba4]/60 group-hover:text-[#487ba4] transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                      <span className="text-[8px] font-bold uppercase tracking-wider">Add Photo</span>
                    </div>
                  )}
                  {photoPreview && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold">Change</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Optional profile photo</p>
              </div>
            )}

            {/* Full name — register only */}
            {isRegister && (
              <div>
                <label className="block text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-glow w-full px-4 py-3 text-sm rounded-xl border border-slate-200 text-slate-700 bg-white placeholder-slate-300 transition-all font-semibold hover:border-slate-300"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className="input-glow w-full px-4 py-3 text-sm rounded-xl border border-slate-200 text-slate-700 bg-white placeholder-slate-300 transition-all font-semibold hover:border-slate-300"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-glow w-full pl-4 pr-11 py-3 text-sm rounded-xl border border-slate-200 text-slate-700 bg-white placeholder-slate-300 transition-all font-semibold hover:border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Optional fields — register only */}
            {isRegister && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowOptional(v => !v)}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-xl border border-dashed border-slate-200 hover:border-[#487ba4]/40 hover:bg-blue-50/40 text-xs font-semibold text-slate-400 hover:text-[#487ba4] transition-all cursor-pointer"
                >
                  <span>Optional profile details ({activeTab === 'Doctor' ? '4' : '4'} fields)</span>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${showOptional ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {showOptional && (
                  <div className="mt-3 space-y-3 animate-fade-in p-4 bg-slate-50/80 rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-2">
                      {activeTab} Profile Details
                    </p>
                    {(roleFields[activeTab] || []).map(field => (
                      <div key={field.key}>
                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          <span>{field.icon}</span> {field.label}
                        </label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={form[field.key] || ''}
                          onChange={(e) => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                          className="input-glow w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 text-slate-700 bg-white placeholder-slate-300 font-medium hover:border-slate-300 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <motion.button
              whileHover={{ translateY: -2, boxShadow: '0 12px 24px -6px rgba(72,123,164,0.35)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2d5a87] via-[#3d6f9f] to-[#487ba4] text-white font-black text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer mt-2 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Please wait...
                </span>
              ) : isRegister ? `Create ${activeTab} Account` : 'Sign In'}
            </motion.button>
          </form>

          {/* Toggle mode */}
          <p className="mt-5 text-center text-xs text-slate-400 font-semibold">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={switchMode}
              className="text-[#487ba4] font-extrabold hover:text-[#3d6f9f] hover:underline focus:outline-none cursor-pointer transition-colors"
            >
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </p>

          {/* Demo accounts */}
          <div className="mt-6 bg-gradient-to-br from-blue-50/80 to-sky-50/40 rounded-2xl p-4 border border-blue-100/80 shadow-sm">
            <h4 className="text-[10px] font-black text-[#3d6f9f] tracking-widest uppercase mb-3 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              Demo Accounts — click to auto-fill
            </h4>
            <div className="space-y-1.5 text-xs">
              {[
                { role: 'Patient', email: 'patient@glucolyse.com', pass: 'Patient123', icon: '🫀', color: 'hover:border-rose-200 hover:bg-rose-50/50' },
                { role: 'Doctor', email: 'doctor@glucolyse.com', pass: 'Doctor123', icon: '🩺', color: 'hover:border-blue-200 hover:bg-blue-50/50' },
                { role: 'Caretaker', email: 'caretaker@glucolyse.com', pass: 'Caretaker123', icon: '🤝', color: 'hover:border-emerald-200 hover:bg-emerald-50/50' },
              ].map(d => (
                <motion.div
                  key={d.role}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleFillDemo(d.email, d.pass, d.role)}
                  className={`flex items-center justify-between bg-white/70 hover:shadow-sm p-2.5 rounded-xl transition-all cursor-pointer group border border-transparent ${d.color}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{d.icon}</span>
                    <div>
                      <span className="font-bold text-slate-700 group-hover:text-[#487ba4] transition-colors">{d.role}</span>
                      <p className="text-[9px] text-slate-400 font-mono">{d.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 group-hover:text-primary transition-colors">
                    Try →
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  )
}
