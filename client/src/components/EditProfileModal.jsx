import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const PRESET_AVATARS = [
  '🧑‍⚕️', '👩‍⚕️', '🩺', '🩸', '🍎', '🥦', '🏃‍♂️', '🏃‍♀️', '🧘‍♂️', '🧘‍♀️', '🧗', '🚴', '🩹', '🧪'
]

export default function EditProfileModal({ onClose }) {
  const { user, updateUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [dateOfBirth, setDateOfBirth] = useState(
    user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
  )
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '')
  const [bloodType, setBloodType] = useState(user?.bloodType || '')
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '')
  const [specialty, setSpecialty] = useState(user?.specialty || '')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const updates = {
        name: name.trim(),
        phone: phone.trim() || null,
        dateOfBirth: dateOfBirth || null,
        photoUrl: photoUrl.trim() || null,
      }

      if (user?.role === 'Patient') {
        updates.bloodType = bloodType.trim() || null
        updates.emergencyContact = emergencyContact.trim() || null
      } else if (user?.role === 'Doctor') {
        updates.specialty = specialty.trim() || null
      }

      await updateUser(updates)
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-surface-card rounded-3xl border border-surface-border shadow-elevated p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-lg shrink-0">
              👤
            </div>
            <div>
              <h3 className="text-base font-bold text-text-heading">Edit Profile Settings</h3>
              <p className="text-[10px] text-text-muted mt-0.5">Update your account information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-body transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 px-3.5 py-2.5 rounded-2xl text-xs">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-3.5 py-2.5 rounded-2xl text-xs">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="font-semibold">Profile updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Presets */}
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
              Select Profile Emoji / Icon
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-surface-elevated/40 border border-surface-border/50 rounded-2xl">
              {PRESET_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setPhotoUrl(emoji)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer hover:scale-110 ${
                    photoUrl === emoji
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface-card hover:bg-surface-elevated border border-surface-border/60'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Alternatively, custom photo URL */}
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
              Custom Avatar / Image URL
            </label>
            <input
              type="text"
              value={photoUrl.startsWith('http') || photoUrl === '' ? photoUrl : ''}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-surface-border bg-surface text-text-body focus:outline-none focus:border-primary placeholder-text-muted hover:border-primary/40 transition-colors"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. John Doe"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-surface-border bg-surface text-text-body focus:outline-none focus:border-primary placeholder-text-muted hover:border-primary/40 transition-colors font-semibold"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-surface-border bg-surface text-text-body focus:outline-none focus:border-primary placeholder-text-muted hover:border-primary/40 transition-colors"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
              Date of Birth
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-surface-border bg-surface text-text-body focus:outline-none focus:border-primary hover:border-primary/40 transition-colors"
            />
          </div>

          {/* Role specific fields */}
          {user?.role === 'Patient' && (
            <>
              {/* Blood Type */}
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                  Blood Type
                </label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-surface-border bg-surface text-text-body focus:outline-none focus:border-primary hover:border-primary/40 transition-colors cursor-pointer"
                >
                  <option value="">Select Blood Type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                  Emergency Contact Info
                </label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Jane Doe (Wife) - +1 (555) 123-4567"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-surface-border bg-surface text-text-body focus:outline-none focus:border-primary placeholder-text-muted hover:border-primary/40 transition-colors"
                />
              </div>
            </>
          )}

          {user?.role === 'Doctor' && (
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                Medical Specialty
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Endocrinologist"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-surface-border bg-surface text-text-body focus:outline-none focus:border-primary placeholder-text-muted hover:border-primary/40 transition-colors"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-3 border-t border-surface-border mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl border border-surface-border text-text-secondary text-xs font-semibold hover:bg-surface-elevated transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
