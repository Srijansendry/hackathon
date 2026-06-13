import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { supabase } from '../config/supabase.js'
import dotenv from 'dotenv'
dotenv.config()

const SECRET = process.env.JWT_SECRET || 'dev-secret'

export async function register(req, res) {
  const {
    name, email, password, role, doctorId,
    phone, dateOfBirth, specialty, bloodType, emergencyContact, photoUrl
  } = req.body

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields required' })
  }
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const hash = await bcrypt.hash(password, 10)
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name, email, password_hash: hash, role,
        phone: phone || null,
        date_of_birth: dateOfBirth || null,
        specialty: specialty || null,
        blood_type: bloodType || null,
        emergency_contact: emergencyContact || null,
        photo_url: photoUrl || null
      })
      .select('user_id, name, email, role, phone, date_of_birth, specialty, blood_type, emergency_contact, photo_url')
      .single()

    if (error) throw error

    if (role === 'Patient') {
      await supabase.from('patients').insert({
        patient_id: user.user_id,
        doctor_id: doctorId || null,
        caretaker_id: null
      })
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role, name: user.name },
      SECRET,
      { expiresIn: '7d' }
    )
    res.status(201).json({
      token,
      user: {
        id: user.user_id, name: user.name, email: user.email, role: user.role,
        phone: user.phone, dateOfBirth: user.date_of_birth, specialty: user.specialty,
        bloodType: user.blood_type, emergencyContact: user.emergency_contact, photoUrl: user.photo_url
      }
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Registration failed' })
  }
}

export async function login(req, res) {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) throw error
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
      { userId: user.user_id, role: user.role, name: user.name },
      SECRET,
      { expiresIn: '7d' }
    )
    res.json({
      token,
      user: {
        id: user.user_id, name: user.name, email: user.email, role: user.role,
        phone: user.phone, dateOfBirth: user.date_of_birth, specialty: user.specialty,
        bloodType: user.blood_type, emergencyContact: user.emergency_contact, photoUrl: user.photo_url
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
}

export async function updateProfile(req, res) {
  const userId = req.user.userId
  const { phone, dateOfBirth, specialty, bloodType, emergencyContact, photoUrl, name } = req.body
  try {
    const updates = {}
    if (name != null) updates.name = name
    if (phone != null) updates.phone = phone
    if (dateOfBirth != null) updates.date_of_birth = dateOfBirth
    if (specialty != null) updates.specialty = specialty
    if (bloodType != null) updates.blood_type = bloodType
    if (emergencyContact != null) updates.emergency_contact = emergencyContact
    if (photoUrl != null) updates.photo_url = photoUrl

    const { data: u, error } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', userId)
      .select('user_id, name, email, role, phone, date_of_birth, specialty, blood_type, emergency_contact, photo_url')
      .single()

    if (error) throw error
    if (!u) return res.status(404).json({ error: 'User not found' })

    res.json({
      user: {
        id: u.user_id, name: u.name, email: u.email, role: u.role,
        phone: u.phone, dateOfBirth: u.date_of_birth, specialty: u.specialty,
        bloodType: u.blood_type, emergencyContact: u.emergency_contact, photoUrl: u.photo_url
      }
    })
  } catch (err) {
    console.error('Profile update error:', err)
    res.status(500).json({ error: 'Profile update failed' })
  }
}

export async function forgotPassword(req, res) {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email required' })
  const SAFE_MSG = 'If an account with that email exists, a reset link has been sent.'
  try {
    const { data: user } = await supabase
      .from('users')
      .select('user_id, name, email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (!user) return res.json({ message: SAFE_MSG })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    await supabase.from('password_reset_tokens').update({ used: true }).eq('user_id', user.user_id).eq('used', false)

    const { error: insertErr } = await supabase.from('password_reset_tokens').insert({
      user_id: user.user_id,
      token,
      expires_at: expiresAt
    })
    if (insertErr) {
      console.error('Token insert error (run SQL migration):', insertErr.message)
      return res.status(500).json({ error: 'Password reset is not configured yet. Please run the database migration.' })
    }

    const host = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : (process.env.CLIENT_URL || 'http://localhost:5000')
    const resetUrl = `${host}/reset-password?token=${token}`

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        })
        await transporter.sendMail({
          from: `"Glucolyse" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: user.email,
          subject: 'Reset your Glucolyse password',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#1a3a5c,#3d6f9f);padding:32px 28px;text-align:center;">
                <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:8px;">
                  <span style="font-size:22px;">❤️</span>
                  <span style="color:white;font-size:20px;font-weight:900;letter-spacing:1px;">Glucolyse</span>
                </div>
                <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:0;text-transform:uppercase;letter-spacing:2px;">Diabetes Management Platform</p>
              </div>
              <div style="padding:32px 28px;">
                <h2 style="color:#1e3a5c;margin:0 0 8px;font-size:22px;">Reset your password</h2>
                <p style="color:#64748b;margin:0 0 24px;line-height:1.6;">Hi ${user.name}, we received a request to reset your Glucolyse password. Click below — this link expires in 1 hour.</p>
                <div style="text-align:center;margin:28px 0;">
                  <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(to right,#2d5a87,#487ba4);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:900;font-size:15px;">Reset Password</a>
                </div>
                <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;border-top:1px solid #e2e8f0;padding-top:20px;">If you didn't request this, you can safely ignore this email.</p>
                <p style="color:#cbd5e1;font-size:11px;margin-top:8px;word-break:break-all;">Or copy: ${resetUrl}</p>
              </div>
            </div>
          `
        })
      } catch (mailErr) {
        console.error('Email send error:', mailErr.message)
      }
    } else {
      console.log(`[Password Reset] No SMTP configured — reset URL for ${user.email}:\n→ ${resetUrl}`)
    }

    const response = { message: SAFE_MSG }
    if (process.env.NODE_ENV !== 'production') response.devResetUrl = resetUrl
    res.json(response)
  } catch (err) {
    console.error('forgotPassword error:', err)
    res.status(500).json({ error: 'Failed to process request' })
  }
}

export async function resetPassword(req, res) {
  const { token, password } = req.body
  if (!token || !password) return res.status(400).json({ error: 'Token and new password required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  try {
    const { data: resetToken, error: tokenErr } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .maybeSingle()

    if (tokenErr) throw tokenErr
    if (!resetToken) return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' })
    if (new Date(resetToken.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This reset link has expired. Please request a new one.' })
    }

    const hash = await bcrypt.hash(password, 10)
    const { error: updateErr } = await supabase.from('users').update({ password_hash: hash }).eq('user_id', resetToken.user_id)
    if (updateErr) throw updateErr

    await supabase.from('password_reset_tokens').update({ used: true }).eq('id', resetToken.id)

    res.json({ message: 'Password updated successfully. You can now sign in with your new password.' })
  } catch (err) {
    console.error('resetPassword error:', err)
    res.status(500).json({ error: 'Failed to reset password' })
  }
}
