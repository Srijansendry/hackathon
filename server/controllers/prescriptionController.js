import { supabase } from '../config/supabase.js'

export async function getPrescriptions(req, res) {
  const { patientId } = req.params
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: true })

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('getPrescriptions error:', err)
    res.status(500).json({ error: 'Failed to fetch prescriptions' })
  }
}

export async function addPrescription(req, res) {
  const { patientId, name, dosage, frequency, time } = req.body
  if (!patientId || !name || !dosage) {
    return res.status(400).json({ error: 'patientId, name, and dosage are required' })
  }
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .insert({
        patient_id: patientId,
        name,
        dosage,
        frequency: frequency || 'Once daily',
        time: time || '',
        status: 'Pending'
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    console.error('addPrescription error:', err)
    res.status(500).json({ error: 'Failed to add prescription' })
  }
}

export async function deletePrescription(req, res) {
  const { id } = req.params
  try {
    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('prescription_id', id)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    console.error('deletePrescription error:', err)
    res.status(500).json({ error: 'Failed to delete prescription' })
  }
}

export async function updatePrescription(req, res) {
  const { id } = req.params
  const { name, dosage, frequency, time } = req.body
  try {
    const updates = {}
    if (name != null) updates.name = name
    if (dosage != null) updates.dosage = dosage
    if (frequency != null) updates.frequency = frequency
    if (time != null) updates.time = time

    const { data, error } = await supabase
      .from('prescriptions')
      .update(updates)
      .eq('prescription_id', id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('updatePrescription error:', err)
    res.status(500).json({ error: 'Failed to update prescription' })
  }
}

export async function togglePrescriptionStatus(req, res) {
  const { id } = req.params
  try {
    const { data: current, error: fetchErr } = await supabase
      .from('prescriptions')
      .select('status')
      .eq('prescription_id', id)
      .maybeSingle()

    if (fetchErr) throw fetchErr
    if (!current) return res.status(404).json({ error: 'Not found' })

    const newStatus = current.status === 'Taken' ? 'Pending' : 'Taken'
    const { data, error } = await supabase
      .from('prescriptions')
      .update({ status: newStatus })
      .eq('prescription_id', id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('togglePrescriptionStatus error:', err)
    res.status(500).json({ error: 'Failed to update prescription status' })
  }
}
