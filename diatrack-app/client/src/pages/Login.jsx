import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [activeTab, setActiveTab] = useState('Patient') // Patient, Doctor, Caretaker
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleRoleChange = (role) => {
    setActiveTab(role)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await register({
          name: form.name || activeTab,
          email: form.email,
          password: form.password,
          role: activeTab
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
    setForm({ name: '', email, password })
    setActiveTab(role)
    setIsRegister(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans">
      {/* Left side panel - Blue background brand hero */}
      <div className="lg:w-[40%] bg-gradient-to-b from-[#487ba4] to-[#365c7c] text-white flex flex-col justify-between p-8 sm:p-12 md:p-16 relative overflow-hidden shadow-2xl">
        {/* Subtle grid backdrop pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        {/* Translucent medical image overlay */}
        <div className="absolute inset-0 bg-cover bg-center opacity-10 bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200')]"></div>
        {/* Neon blue radial blur spots */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-sky-300/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* Glucolyse Logo */}
          <div className="flex items-center gap-2.5 group cursor-default">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
              <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-wide bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Glucolyse</span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 my-auto py-12">
          <h1 className="text-4xl sm:text-5xl font-light leading-tight tracking-wide mb-6">
            Your health,<br />
            <span className="font-extrabold bg-gradient-to-r from-white via-slate-100 to-sky-200 bg-clip-text text-transparent">simplified.</span>
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-sm leading-relaxed font-medium">
            Monitor blood sugar levels, track patterns, and stay connected with your care team.
          </p>
        </div>

        <div className="relative z-10 text-xs text-white/50 font-semibold tracking-wider">
          © {new Date().getFullYear()} GLUCOLYSE INC. ALL RIGHTS RESERVED.
        </div>
      </div>

      {/* Right side panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 md:p-16 bg-white relative">
        {/* Delicate background shapes for depth */}
        <div className="absolute top-10 right-10 w-48 h-48 bg-slate-50 rounded-full blur-2xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-slate-50 rounded-full blur-2xl" />

        <div className="w-full max-w-[420px] flex flex-col justify-center relative z-10">
          
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
              {isRegister ? 'Create Account' : 'Welcome back'}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              {isRegister ? 'Register your Glucolyse account.' : 'Sign in to your Glucolyse account.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold animate-fade-in shadow-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Capsule Tab Selector for Roles */}
          <div className="bg-slate-100 p-1 rounded-2xl flex mb-6 border border-slate-200/50 shadow-inner">
            {['Patient', 'Doctor', 'Caretaker'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleChange(role)}
                className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all duration-200 cursor-pointer ${
                  activeTab === role
                    ? 'bg-white text-[#487ba4] shadow-md border border-slate-200/10'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mb-2">
                  FULL NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#487ba4] focus:ring-4 focus:ring-blue-100 text-slate-700 bg-white placeholder-slate-300 transition-all font-semibold"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mb-2">
                EMAIL
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#487ba4] focus:ring-4 focus:ring-blue-100 text-slate-700 bg-white placeholder-slate-300 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mb-2">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-4 pr-10 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#487ba4] focus:ring-4 focus:ring-blue-100 text-slate-700 bg-white placeholder-slate-300 transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#487ba4] to-[#365c7c] hover:opacity-95 text-white font-extrabold text-sm transition-all shadow-md shadow-blue-500/10 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400 font-semibold">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError('') }}
              className="text-[#487ba4] font-bold hover:underline focus:outline-none cursor-pointer"
            >
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </p>

          {/* Demo accounts display card */}
          <div className="mt-8 bg-gradient-to-br from-blue-50/60 to-sky-50/40 dark:from-slate-50 dark:to-slate-100/80 rounded-2xl p-5 border border-blue-100/50 text-xs shadow-sm hover:shadow-md transition-all duration-300">
            <h4 className="text-[10px] font-extrabold text-[#365c7c] tracking-wider uppercase mb-3 flex items-center gap-1.5 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
              DEMO ACCOUNTS (TAP TO AUTO-FILL)
            </h4>
            <div className="space-y-2.5 text-slate-600 font-mono text-[11px]">
              <div
                onClick={() => handleFillDemo('patient@glucolyse.com', 'Patient123', 'Patient')}
                className="flex items-center justify-between hover:bg-white hover:shadow-sm p-2 rounded-xl transition-all cursor-pointer group border border-transparent hover:border-slate-200/40"
              >
                <span className="font-extrabold text-slate-700 group-hover:text-[#487ba4]">Patient:</span>
                <span className="text-right text-[10px] font-medium group-hover:text-slate-900">
                  patient@glucolyse.com / Patient123
                </span>
              </div>
              <div
                onClick={() => handleFillDemo('doctor@glucolyse.com', 'Doctor123', 'Doctor')}
                className="flex items-center justify-between hover:bg-white hover:shadow-sm p-2 rounded-xl transition-all cursor-pointer group border border-transparent hover:border-slate-200/40"
              >
                <span className="font-extrabold text-slate-700 group-hover:text-[#487ba4]">Doctor:</span>
                <span className="text-right text-[10px] font-medium group-hover:text-slate-900">
                  doctor@glucolyse.com / Doctor123
                </span>
              </div>
              <div
                onClick={() => handleFillDemo('caretaker@glucolyse.com', 'Caretaker123', 'Caretaker')}
                className="flex items-center justify-between hover:bg-white hover:shadow-sm p-2 rounded-xl transition-all cursor-pointer group border border-transparent hover:border-slate-200/40"
              >
                <span className="font-extrabold text-slate-700 group-hover:text-[#487ba4]">Caretaker:</span>
                <span className="text-right text-[10px] font-medium group-hover:text-slate-900">
                  caretaker@glucolyse.com / Caretaker123
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
