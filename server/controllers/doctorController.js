import pool from '../config/db.js'
import { v4 as uuidv4 } from 'uuid'

export async function getPatients(req, res) {
  const userId = req.user.userId
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.created_at
      FROM patients p JOIN users u ON p.patient_id = u.user_id
      WHERE p.doctor_id = $1 OR p.caretaker_id = $1 ORDER BY u.name`,
      [userId]
    )
    res.json(result.rows)
  } catch {
    res.status(500).json({ error: 'Failed to fetch patients' })
  }
}

export async function getPatientById(req, res) {
  const { patientId } = req.params
  try {
    const result = await pool.query(
      'SELECT u.user_id, u.name, u.email, u.role FROM users u WHERE u.user_id = $1 AND u.role = $2',
      [patientId, 'Patient']
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' })
    res.json(result.rows[0])
  } catch {
    res.status(500).json({ error: 'Failed to fetch patient' })
  }
}

export async function getMyDoctor(req, res) {
  const patientId = req.user.userId
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.role
       FROM patients p JOIN users u ON p.doctor_id = u.user_id
       WHERE p.patient_id = $1`,
      [patientId]
    )
    const ctResult = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.role
       FROM patients p JOIN users u ON p.caretaker_id = u.user_id
       WHERE p.patient_id = $1`,
      [patientId]
    )
    res.json({
      doctor: result.rows[0] || null,
      caretaker: ctResult.rows[0] || null
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch care team' })
  }
}

// Search for professionals by name or email
export async function searchProfessionals(req, res) {
  const { q } = req.query
  if (!q || q.trim().length < 2) return res.json([])
  try {
    const result = await pool.query(
      `SELECT user_id, name, email, role FROM users WHERE role IN ('Doctor','Caretaker') AND (lower(email) LIKE $1 OR lower(name) LIKE $1)`,
      [`%${q.toLowerCase()}%`]
    )
    res.json(result.rows)
  } catch {
    res.status(500).json({ error: 'Search failed' })
  }
}

// Patient sends a connection request to a professional
export async function sendConnectionRequest(req, res) {
  const { toId } = req.body
  const fromId = req.user.userId
  if (!toId) return res.status(400).json({ error: 'Target user required' })
  try {
    const existing = await pool.query(
      `SELECT * FROM connection_requests WHERE from_id = $1 AND to_id = $2 AND status = 'pending'`,
      [fromId, toId]
    )
    if (existing.rows.length > 0) {
      return res.json({ success: true, alreadySent: true })
    }
    await pool.query(
      `INSERT INTO connection_requests (from_id, to_id, status) VALUES ($1, $2, 'pending')`,
      [fromId, toId]
    )
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to send request' })
  }
}

// Doctor/Caretaker fetches their pending incoming requests
export async function getPendingRequests(req, res) {
  const userId = req.user.userId
  try {
    const result = await pool.query(
      `SELECT cr.*, u.name as patient_name, u.email as patient_email
       FROM connection_requests cr
       JOIN users u ON cr.from_id = u.user_id
       WHERE cr.to_id = $1 AND cr.status = 'pending'`,
      [userId]
    )
    res.json(result.rows)
  } catch {
    res.status(500).json({ error: 'Failed to fetch pending requests' })
  }
}

// Doctor/Caretaker accepts or rejects a request
export async function respondToRequest(req, res) {
  const { requestId, action } = req.body
  const userId = req.user.userId
  if (!requestId || !['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid request' })
  }
  try {
    const reqResult = await pool.query(
      `SELECT * FROM connection_requests WHERE request_id = $1 AND to_id = $2`,
      [requestId, userId]
    )
    if (reqResult.rows.length === 0) return res.status(404).json({ error: 'Request not found' })

    const cr = reqResult.rows[0]

    if (action === 'accept') {
      const roleResult = await pool.query(`SELECT role FROM users WHERE user_id = $1`, [userId])
      const role = roleResult.rows[0]?.role

      // Ensure patient row exists
      const patRow = await pool.query(`SELECT * FROM patients WHERE patient_id = $1`, [cr.from_id])
      if (patRow.rows.length === 0) {
        await pool.query(
          `INSERT INTO patients (patient_id, doctor_id, caretaker_id) VALUES ($1, $2, $3)`,
          [cr.from_id, role === 'Doctor' ? userId : null, role === 'Caretaker' ? userId : null]
        )
      } else if (role === 'Doctor') {
        await pool.query(`UPDATE patients SET doctor_id = $1 WHERE patient_id = $2`, [userId, cr.from_id])
      } else if (role === 'Caretaker') {
        await pool.query(`UPDATE patients SET caretaker_id = $1 WHERE patient_id = $2`, [userId, cr.from_id])
      }
    }

    await pool.query(
      `UPDATE connection_requests SET status = $1 WHERE request_id = $2`,
      [action === 'accept' ? 'accepted' : 'rejected', requestId]
    )

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to process request' })
  }
}

// Patient gets their own outgoing requests
export async function getMyRequests(req, res) {
  const fromId = req.user.userId
  try {
    const result = await pool.query(
      `SELECT cr.*, u.name as to_name, u.email as to_email, u.role as to_role
       FROM connection_requests cr
       JOIN users u ON cr.to_id = u.user_id
       WHERE cr.from_id = $1`,
      [fromId]
    )
    res.json(result.rows)
  } catch {
    res.status(500).json({ error: 'Failed to fetch requests' })
  }
}
