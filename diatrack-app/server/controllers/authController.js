import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/db.js'
import dotenv from 'dotenv'
dotenv.config()

const SECRET = process.env.JWT_SECRET || 'dev-secret'

export async function register(req, res) {
  const { name, email, password, role, doctorId } = req.body
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
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role',
      [name, email, hash, role]
    )
    const user = result.rows[0]
    if (role === 'Patient') {
      await pool.query(
        'INSERT INTO patients (patient_id, doctor_id) VALUES ($1, $2)',
        [user.user_id, doctorId || null]
      )
    }
    const token = jwt.sign({ userId: user.user_id, role: user.role, name: user.name }, SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user: { id: user.user_id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
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
    res.json({ token, user: { id: user.user_id, name: user.name, email: user.email, role: user.role } })
  } catch {
    res.status(500).json({ error: 'Login failed' })
  }
}
