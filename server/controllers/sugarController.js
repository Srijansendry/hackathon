import pool from '../config/db.js'

function calcStatus(level) {
  if (level < 80) return 'Low'
  if (level > 140) return 'High'
  return 'Normal'
}

export async function addReading(req, res) {
  const { mealType, timing, sugarLevel } = req.body
  const patientId = req.user.userId
  if (!mealType || !timing || !sugarLevel) {
    return res.status(400).json({ error: 'All fields required' })
  }
  const status = calcStatus(parseInt(sugarLevel))
  try {
    const result = await pool.query(
      'INSERT INTO sugar_readings (patient_id, meal_type, timing, sugar_level, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [patientId, mealType, timing, parseInt(sugarLevel), status]
    )
    res.status(201).json(result.rows[0])
  } catch {
    res.status(500).json({ error: 'Failed to add reading' })
  }
}

export async function getReadings(req, res) {
  const { patientId } = req.params
  const { filter } = req.query
  let interval = '30 days'
  if (filter === 'weekly') interval = '7 days'
  if (filter === 'yearly') interval = '365 days'
  try {
    const result = await pool.query(
      `SELECT * FROM sugar_readings WHERE patient_id = $1 AND recorded_at >= NOW() - INTERVAL '${interval}' ORDER BY recorded_at ASC`,
      [patientId]
    )
    res.json(result.rows)
  } catch {
    res.status(500).json({ error: 'Failed to fetch readings' })
  }
}

export async function getStats(req, res) {
  const { patientId } = req.params
  try {
    const result = await pool.query(
      `SELECT 
        ROUND(AVG(sugar_level)) as avg_level,
        MIN(sugar_level) as min_level,
        MAX(sugar_level) as max_level,
        COUNT(*) as total_readings
      FROM sugar_readings 
      WHERE patient_id = $1 AND recorded_at >= NOW() - INTERVAL '30 days'`,
      [patientId]
    )
    res.json(result.rows[0])
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
}

export async function getMealAverages(req, res) {
  const { patientId } = req.params
  try {
    const result = await pool.query(
      `SELECT meal_type, ROUND(AVG(sugar_level)) as average, COUNT(*) as count
      FROM sugar_readings WHERE patient_id = $1
      GROUP BY meal_type ORDER BY meal_type`,
      [patientId]
    )
    res.json(result.rows)
  } catch {
    res.status(500).json({ error: 'Failed to fetch meal averages' })
  }
}
