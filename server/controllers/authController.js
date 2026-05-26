import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/db.js'
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
    const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' })
    }
    const hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone, date_of_birth, specialty, blood_type, emergency_contact, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING user_id, name, email, role, phone, date_of_birth, specialty, blood_type, emergency_contact, photo_url`,
      [name, email, hash, role, phone || null, dateOfBirth || null, specialty || null, bloodType || null, emergencyContact || null, photoUrl || null]
    )
    const user = result.rows[0]
    if (role === 'Patient') {
      await pool.query(
        'INSERT INTO patients (patient_id, doctor_id) VALUES ($1, $2)',
        [user.user_id, doctorId || null]
      )
    }
    const token = jwt.sign({ userId: user.user_id, role: user.role, name: user.name }, SECRET, { expiresIn: '7d' })
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
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const token = jwt.sign({ userId: user.user_id, role: user.role, name: user.name }, SECRET, { expiresIn: '7d' })
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
    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        date_of_birth = COALESCE($3, date_of_birth),
        specialty = COALESCE($4, specialty),
        blood_type = COALESCE($5, blood_type),
        emergency_contact = COALESCE($6, emergency_contact),
        photo_url = COALESCE($7, photo_url)
       WHERE user_id = $8
       RETURNING user_id, name, email, role, phone, date_of_birth, specialty, blood_type, emergency_contact, photo_url`,
      [name || null, phone || null, dateOfBirth || null, specialty || null, bloodType || null, emergencyContact || null, photoUrl || null, userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' })
    const u = result.rows[0]
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
