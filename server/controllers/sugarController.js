import { supabase } from '../config/supabase.js'
import { sendBloodSugarAlert } from '../services/notificationService.js'

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
  const level = parseInt(sugarLevel)
  const status = calcStatus(level)
  try {
    const { data, error } = await supabase
      .from('sugar_readings')
      .insert({ patient_id: patientId, meal_type: mealType, timing, sugar_level: level, status })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)

    if (status !== 'Normal') {
      sendBloodSugarAlert(patientId, level, mealType, timing).catch(err =>
        console.error('[AutoAlert] Blood sugar alert error:', err.message)
      )
    }
  } catch (err) {
    console.error('addReading error:', err)
    res.status(500).json({ error: 'Failed to add reading' })
  }
}

export async function getReadings(req, res) {
  const { patientId } = req.params
  const { filter } = req.query
  const daysMap = { weekly: 7, yearly: 365 }
  const days = daysMap[filter] || 30
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  try {
    const { data, error } = await supabase
      .from('sugar_readings')
      .select('*')
      .eq('patient_id', patientId)
      .gte('recorded_at', cutoff)
      .order('recorded_at', { ascending: true })

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('getReadings error:', err)
    res.status(500).json({ error: 'Failed to fetch readings' })
  }
}

export async function getStats(req, res) {
  const { patientId } = req.params
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  try {
    const { data, error } = await supabase
      .from('sugar_readings')
      .select('sugar_level')
      .eq('patient_id', patientId)
      .gte('recorded_at', cutoff)

    if (error) throw error
    if (!data || data.length === 0) {
      return res.json({ avg_level: null, min_level: null, max_level: null, total_readings: 0 })
    }
    const levels = data.map(r => r.sugar_level)
    const avg = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length)
    const min = Math.min(...levels)
    const max = Math.max(...levels)
    res.json({ avg_level: avg, min_level: min, max_level: max, total_readings: levels.length })
  } catch (err) {
    console.error('getStats error:', err)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
}

export async function deleteReading(req, res) {
  const { readingId } = req.params
  const patientId = req.user.userId
  try {
    const { error } = await supabase
      .from('sugar_readings')
      .delete()
      .eq('reading_id', readingId)
      .eq('patient_id', patientId)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    console.error('deleteReading error:', err)
    res.status(500).json({ error: 'Failed to delete reading' })
  }
}

export async function getMealAverages(req, res) {
  const { patientId } = req.params
  try {
    const { data, error } = await supabase
      .from('sugar_readings')
      .select('meal_type, sugar_level')
      .eq('patient_id', patientId)

    if (error) throw error
    const grouped = {}
    data.forEach(r => {
      if (!grouped[r.meal_type]) grouped[r.meal_type] = []
      grouped[r.meal_type].push(r.sugar_level)
    })
    const rows = Object.entries(grouped)
      .map(([meal_type, levels]) => ({
        meal_type,
        average: Math.round(levels.reduce((a, b) => a + b, 0) / levels.length),
        count: levels.length
      }))
      .sort((a, b) => a.meal_type.localeCompare(b.meal_type))
    res.json(rows)
  } catch (err) {
    console.error('getMealAverages error:', err)
    res.status(500).json({ error: 'Failed to fetch meal averages' })
  }
}
