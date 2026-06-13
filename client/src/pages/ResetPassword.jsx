import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { resetPasswordService } from '../services/authService'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!token) {
      setError('No reset token found. Please request a new password reset link.')
    }
  }, [token])

  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(timer); navigate('/login'); return 0 }
          return c - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [status, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await resetPasswordService(token, password)
      setStatus('success')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  const EyeIcon = ({ open }) => open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthLabel = ['', 'Too short', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400'][strength]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a3a5c] via-[#2d5a87] to-[#3d6f9f] flex items-center justify-center p-6 font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-400/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px] bg-white rounded-3xl shadow-2xl p-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2d5a87] to-[#487ba4] flex items-center justify-center shadow-md">
            <svg className="w-4.5 h-4.5 text-white w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
            </svg>
          </div>
          <span className="font-black text-[#2d5a87] text-lg tracking-tight">Glucolyse</span>
        </div>

        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5 text-4xl shadow-inner">✅</div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Password updated!</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">Your password has been reset successfully. You can now sign in with your new password.</p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6">
                <p className="text-emerald-700 text-sm font-semibold">Redirecting to sign in in <span className="font-black text-emerald-800">{countdown}s</span>…</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2d5a87] to-[#487ba4] text-white font-black text-sm cursor-pointer shadow-md"
              >
                Go to Sign In now
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="mb-7">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-[#3d6f9f] border border-blue-100 rounded-full px-3 py-1 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#487ba4] animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Password Recovery</span>
                </div>
                <h2 className="text-[26px] font-black text-slate-800 tracking-tight mb-1.5 leading-tight">Set new password</h2>
                <p className="text-slate-400 text-sm font-medium">Choose a strong password for your account.</p>
              </div>

              <AnimatePresence>
                {(error || !token) && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-start gap-2.5"
                  >
                    <span className="text-base shrink-0">⚠️</span>
                    <span>{error || 'No reset token found in the URL.'}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {token && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-4 pr-11 py-3 text-sm rounded-xl border border-slate-200 text-slate-700 bg-white placeholder-slate-300 transition-all font-semibold hover:border-slate-300 focus:outline-none focus:border-[#487ba4] focus:ring-2 focus:ring-[#487ba4]/20"
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>
                    {password && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${strengthColor}`} style={{ width: `${(strength / 3) * 100}%` }} />
                        </div>
                        <span className={`text-[10px] font-bold ${['', 'text-red-500', 'text-amber-500', 'text-emerald-500'][strength]}`}>{strengthLabel}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        required
                        placeholder="Repeat your password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        className={`w-full pl-4 pr-11 py-3 text-sm rounded-xl border transition-all font-semibold focus:outline-none focus:ring-2 ${
                          confirm && password !== confirm
                            ? 'border-red-300 text-red-700 bg-red-50 focus:border-red-400 focus:ring-red-200/30'
                            : confirm && password === confirm
                            ? 'border-emerald-300 text-slate-700 bg-white focus:border-emerald-400 focus:ring-emerald-200/30'
                            : 'border-slate-200 text-slate-700 bg-white hover:border-slate-300 focus:border-[#487ba4] focus:ring-[#487ba4]/20'
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                        <EyeIcon open={showConfirm} />
                      </button>
                    </div>
                    {confirm && password !== confirm && (
                      <p className="text-[11px] text-red-500 font-semibold mt-1">Passwords do not match</p>
                    )}
                    {confirm && password === confirm && (
                      <p className="text-[11px] text-emerald-500 font-semibold mt-1">✓ Passwords match</p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ translateY: -2, boxShadow: '0 12px 24px -6px rgba(72,123,164,0.35)' }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || (confirm && password !== confirm)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2d5a87] via-[#3d6f9f] to-[#487ba4] text-white font-black text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer mt-2 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Updating…
                      </span>
                    ) : 'Update Password'}
                  </motion.button>
                </form>
              )}

              <p className="mt-5 text-center text-xs text-slate-400 font-semibold">
                Remember it?{' '}
                <button onClick={() => navigate('/login')} className="text-[#487ba4] font-extrabold hover:underline cursor-pointer">
                  Back to Sign In
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
