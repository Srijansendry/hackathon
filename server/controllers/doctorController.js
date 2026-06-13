import { supabase } from '../config/supabase.js'

export async function getPatients(req, res) {
  const userId = req.user.userId
  try {
    let allPatientIds = []

    const { data: docLinks } = await supabase.from('patient_doctor_links').select('patient_id').eq('doctor_id', userId)
    const { data: ctLinks }  = await supabase.from('patient_caretaker_links').select('patient_id').eq('caretaker_id', userId)
    if (docLinks) allPatientIds.push(...docLinks.map(l => l.patient_id))
    if (ctLinks)  allPatientIds.push(...ctLinks.map(l => l.patient_id))

    const { data: oldLinks } = await supabase.from('patients').select('patient_id').or(`doctor_id.eq.${userId},caretaker_id.eq.${userId}`)
    if (oldLinks) allPatientIds.push(...oldLinks.map(l => l.patient_id))

    allPatientIds = [...new Set(allPatientIds)]
    if (allPatientIds.length === 0) return res.json([])

    const { data, error } = await supabase
      .from('users')
      .select('user_id, name, email, phone, blood_type, emergency_contact, created_at')
      .in('user_id', allPatientIds)
      .order('name')

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('getPatients error:', err)
    res.status(500).json({ error: 'Failed to fetch patients' })
  }
}

export async function getPatientById(req, res) {
  const { patientId } = req.params
  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, name, email, role')
      .eq('user_id', patientId)
      .eq('role', 'Patient')
      .maybeSingle()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Patient not found' })
    res.json(data)
  } catch (err) {
    console.error('getPatientById error:', err)
    res.status(500).json({ error: 'Failed to fetch patient' })
  }
}

export async function getMyDoctor(req, res) {
  const patientId = req.user.userId
  try {
    let doctorIds = []
    let caretakerIds = []

    const { data: docLinks } = await supabase.from('patient_doctor_links').select('doctor_id').eq('patient_id', patientId)
    const { data: ctLinks }  = await supabase.from('patient_caretaker_links').select('caretaker_id').eq('patient_id', patientId)
    if (docLinks) doctorIds    = docLinks.map(l => l.doctor_id)
    if (ctLinks)  caretakerIds = ctLinks.map(l => l.caretaker_id)

    const { data: pat } = await supabase.from('patients').select('doctor_id, caretaker_id').eq('patient_id', patientId).maybeSingle()
    if (pat?.doctor_id   && !doctorIds.includes(pat.doctor_id))      doctorIds.push(pat.doctor_id)
    if (pat?.caretaker_id && !caretakerIds.includes(pat.caretaker_id)) caretakerIds.push(pat.caretaker_id)

    let doctors = []
    let caretakers = []
    if (doctorIds.length > 0) {
      const { data } = await supabase.from('users').select('user_id, name, email, role').in('user_id', doctorIds)
      doctors = data || []
    }
    if (caretakerIds.length > 0) {
      const { data } = await supabase.from('users').select('user_id, name, email, role').in('user_id', caretakerIds)
      caretakers = data || []
    }

    res.json({ doctor: doctors[0] || null, caretaker: caretakers[0] || null, doctors, caretakers })
  } catch (err) {
    console.error('getMyDoctor error:', err)
    res.status(500).json({ error: 'Failed to fetch care team' })
  }
}

export async function searchProfessionals(req, res) {
  const { q } = req.query
  if (!q || q.trim().length < 2) return res.json([])
  try {
    const term = q.toLowerCase()
    const { data, error } = await supabase
      .from('users')
      .select('user_id, name, email, role')
      .in('role', ['Doctor', 'Caretaker'])
      .or(`name.ilike.%${term}%,email.ilike.%${term}%`)

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('searchProfessionals error:', err)
    res.status(500).json({ error: 'Search failed' })
  }
}

export async function sendConnectionRequest(req, res) {
  const { toId } = req.body
  const fromId = req.user.userId
  if (!toId) return res.status(400).json({ error: 'Target user required' })
  try {
    const { data: existing } = await supabase
      .from('connection_requests')
      .select('request_id')
      .eq('from_id', fromId)
      .eq('to_id', toId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) return res.json({ success: true, alreadySent: true })

    const { error } = await supabase
      .from('connection_requests')
      .insert({ from_id: fromId, to_id: toId, status: 'pending' })

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    console.error('sendConnectionRequest error:', err)
    res.status(500).json({ error: 'Failed to send request' })
  }
}

export async function getPendingRequests(req, res) {
  const userId = req.user.userId
  try {
    const { data: requests, error } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('to_id', userId)
      .eq('status', 'pending')

    if (error) throw error
    if (!requests || requests.length === 0) return res.json([])

    const fromIds = requests.map(r => r.from_id)
    const { data: users } = await supabase
      .from('users')
      .select('user_id, name, email, photo_url')
      .in('user_id', fromIds)

    const userMap = Object.fromEntries((users || []).map(u => [u.user_id, u]))
    const rows = requests.map(r => ({
      ...r,
      patient_name: userMap[r.from_id]?.name || 'Unknown',
      patient_email: userMap[r.from_id]?.email || '',
      patient_photo: userMap[r.from_id]?.photo_url || null
    }))
    res.json(rows)
  } catch (err) {
    console.error('getPendingRequests error:', err)
    res.status(500).json({ error: 'Failed to fetch pending requests' })
  }
}

export async function respondToRequest(req, res) {
  const { requestId, action } = req.body
  const userId = req.user.userId
  if (!requestId || !['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid request' })
  }
  try {
    const { data: cr, error: crErr } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('request_id', requestId)
      .eq('to_id', userId)
      .maybeSingle()

    if (crErr) throw crErr
    if (!cr) return res.status(404).json({ error: 'Request not found' })

    if (action === 'accept') {
      const { data: roleRow } = await supabase.from('users').select('role').eq('user_id', userId).single()
      const role = roleRow?.role

      try {
        if (role === 'Doctor') {
          await supabase.from('patient_doctor_links').upsert({ patient_id: cr.from_id, doctor_id: userId }, { onConflict: 'patient_id,doctor_id' })
        } else if (role === 'Caretaker') {
          await supabase.from('patient_caretaker_links').upsert({ patient_id: cr.from_id, caretaker_id: userId }, { onConflict: 'patient_id,caretaker_id' })
        }
      } catch {}

      const { data: patRow } = await supabase.from('patients').select('patient_id').eq('patient_id', cr.from_id).maybeSingle()
      if (!patRow) {
        await supabase.from('patients').insert({
          patient_id: cr.from_id,
          doctor_id: role === 'Doctor' ? userId : null,
          caretaker_id: role === 'Caretaker' ? userId : null
        })
      } else if (role === 'Doctor') {
        await supabase.from('patients').update({ doctor_id: userId }).eq('patient_id', cr.from_id)
      } else if (role === 'Caretaker') {
        await supabase.from('patients').update({ caretaker_id: userId }).eq('patient_id', cr.from_id)
      }
    }

    const { error: updErr } = await supabase
      .from('connection_requests')
      .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
      .eq('request_id', requestId)

    if (updErr) throw updErr
    res.json({ success: true })
  } catch (err) {
    console.error('respondToRequest error:', err)
    res.status(500).json({ error: 'Failed to process request' })
  }
}

export async function getMyRequests(req, res) {
  const fromId = req.user.userId
  try {
    const { data: requests, error } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('from_id', fromId)

    if (error) throw error
    if (!requests || requests.length === 0) return res.json([])

    const toIds = requests.map(r => r.to_id)
    const { data: users } = await supabase
      .from('users')
      .select('user_id, name, email, role, photo_url')
      .in('user_id', toIds)

    const userMap = Object.fromEntries((users || []).map(u => [u.user_id, u]))
    const rows = requests.map(r => ({
      ...r,
      to_name: userMap[r.to_id]?.name || 'Unknown',
      to_email: userMap[r.to_id]?.email || '',
      to_role: userMap[r.to_id]?.role || '',
      to_photo: userMap[r.to_id]?.photo_url || null
    }))
    res.json(rows)
  } catch (err) {
    console.error('getMyRequests error:', err)
    res.status(500).json({ error: 'Failed to fetch requests' })
  }
}

export async function unlinkMember(req, res) {
  const patientId = req.user.userId
  const { memberId, memberRole } = req.body
  if (!memberId || !memberRole) return res.status(400).json({ error: 'memberId and memberRole required' })
  try {
    if (memberRole === 'Doctor') {
      await supabase.from('patient_doctor_links').delete().eq('patient_id', patientId).eq('doctor_id', memberId)
      await supabase.from('patients').update({ doctor_id: null }).eq('patient_id', patientId).eq('doctor_id', memberId)
    } else if (memberRole === 'Caretaker') {
      await supabase.from('patient_caretaker_links').delete().eq('patient_id', patientId).eq('caretaker_id', memberId)
      await supabase.from('patients').update({ caretaker_id: null }).eq('patient_id', patientId).eq('caretaker_id', memberId)
    }
    res.json({ success: true })
  } catch (err) {
    console.error('unlinkMember error:', err)
    res.status(500).json({ error: 'Failed to unlink member' })
  }
}

export async function updatePatientContact(req, res) {
  const { patientId } = req.params
  const caregiverId = req.user.userId
  const { phone, emergencyContact } = req.body
  try {
    const { data: oldLink } = await supabase
      .from('patients')
      .select('patient_id')
      .eq('patient_id', patientId)
      .or(`doctor_id.eq.${caregiverId},caretaker_id.eq.${caregiverId}`)
      .maybeSingle()

    let authorized = !!oldLink
    if (!authorized) {
      const { data: dl } = await supabase.from('patient_doctor_links').select('patient_id').eq('patient_id', patientId).eq('doctor_id', caregiverId).maybeSingle()
      const { data: cl } = await supabase.from('patient_caretaker_links').select('patient_id').eq('patient_id', patientId).eq('caretaker_id', caregiverId).maybeSingle()
      authorized = !!(dl || cl)
    }

    if (!authorized) return res.status(403).json({ error: 'Not authorized to update this patient' })

    const updates = {}
    if (phone != null) updates.phone = phone
    if (emergencyContact != null) updates.emergency_contact = emergencyContact

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', patientId)
      .select('user_id, name, phone, emergency_contact')
      .single()

    if (error) throw error
    res.json({ user_id: data.user_id, name: data.name, phone: data.phone, emergencyContact: data.emergency_contact })
  } catch (err) {
    console.error('updatePatientContact error:', err)
    res.status(500).json({ error: 'Failed to update patient contact' })
  }
}
