import pool from '../config/db.js'

export async function getPrescriptions(req, res) {
  const { patientId } = req.params
  try {
    const result = await pool.query(
      `SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY created_at ASC`,
      [patientId]
    )
    res.json(result.rows)
  } catch {
    res.status(500).json({ error: 'Failed to fetch prescriptions' })
  }
}

export async function addPrescription(req, res) {
  const { patientId, name, dosage, frequency, time } = req.body
  if (!patientId || !name || !dosage) {
    return res.status(400).json({ error: 'patientId, name, and dosage are required' })
  }
  try {
    const result = await pool.query(
      `INSERT INTO prescriptions (patient_id, name, dosage, frequency, time, status) VALUES ($1, $2, $3, $4, $5, 'Pending') RETURNING *`,
      [patientId, name, dosage, frequency || 'Once daily', time || '']
    )
    res.status(201).json(result.rows[0])
  } catch {
    res.status(500).json({ error: 'Failed to add prescription' })
  }
}

export async function deletePrescription(req, res) {
  const { id } = req.params
  try {
    await pool.query(`DELETE FROM prescriptions WHERE prescription_id = $1`, [id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete prescription' })
  }
}

export async function togglePrescriptionStatus(req, res) {
  const { id } = req.params
  try {
    const current = await pool.query(
      `SELECT status FROM prescriptions WHERE prescription_id = $1`, [id]
    )
    if (current.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    const newStatus = current.rows[0].status === 'Taken' ? 'Pending' : 'Taken'
    const result = await pool.query(
      `UPDATE prescriptions SET status = $1 WHERE prescription_id = $2 RETURNING *`,
      [newStatus, id]
    )
    res.json(result.rows[0])
  } catch {
    res.status(500).json({ error: 'Failed to update prescription status' })
  }
}
