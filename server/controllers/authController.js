import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
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
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        specialty: user.specialty,
        bloodType: user.blood_type,
        emergencyContact: user.emergency_contact,
        photoUrl: user.photo_url
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
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        specialty: user.specialty,
        bloodType: user.blood_type,
        emergencyContact: user.emergency_contact,
        photoUrl: user.photo_url
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
