import bcrypt from 'bcryptjs'
import { supabase } from '../config/supabase.js'

const DEMO_USERS = [
  {
    name: 'Dr. Sarah Jenkins',
    email: 'doctor@glucolyse.com',
    password: 'Doctor123',
    role: 'Doctor',
    specialty: 'Endocrinology',
    phone: '+1 555-0201',
    date_of_birth: '1980-03-22'
  },
  {
    name: 'John Miller',
    email: 'caretaker@glucolyse.com',
    password: 'Caretaker123',
    role: 'Caretaker',
    phone: '+1 555-0301',
    date_of_birth: '1985-09-10'
  },
  {
    name: 'Emily Davis',
    email: 'patient@glucolyse.com',
    password: 'Patient123',
    role: 'Patient',
    phone: '+1 555-0101',
    date_of_birth: '1992-06-14',
    blood_type: 'O+',
    emergency_contact: 'John Davis (+1 555-0102)'
  }
]

const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString()
const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString()

export async function seedDemoData(req, res) {
  try {
    const results = { created: [], skipped: [], errors: [] }

    // 1. Upsert demo users
    const userIds = {}
    for (const u of DEMO_USERS) {
      const { data: existing } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', u.email)
        .maybeSingle()

      if (existing) {
        userIds[u.role] = existing.user_id
        results.skipped.push(`${u.role} (${u.email}) already exists`)
        continue
      }

      const hash = await bcrypt.hash(u.password, 10)
      const { data: created, error } = await supabase
        .from('users')
        .insert({
          name: u.name,
          email: u.email,
          password_hash: hash,
          role: u.role,
          specialty: u.specialty || null,
          phone: u.phone || null,
          date_of_birth: u.date_of_birth || null,
          blood_type: u.blood_type || null,
          emergency_contact: u.emergency_contact || null
        })
        .select('user_id')
        .single()

      if (error) { results.errors.push(`${u.role}: ${error.message}`); continue }
      userIds[u.role] = created.user_id
      results.created.push(`${u.role} (${u.email})`)
    }

    const patientId = userIds['Patient']
    const doctorId = userIds['Doctor']
    const caretakerId = userIds['Caretaker']

    if (!patientId) {
      return res.status(500).json({ error: 'Patient user missing', results })
    }

    // 2. Link patient to doctor + caretaker
    const { data: existingPat } = await supabase
      .from('patients')
      .select('patient_id')
      .eq('patient_id', patientId)
      .maybeSingle()

    if (!existingPat) {
      await supabase.from('patients').insert({
        patient_id: patientId,
        doctor_id: doctorId || null,
        caretaker_id: caretakerId || null
      })
      results.created.push('patient → doctor/caretaker link')
    } else {
      // Ensure doctor and caretaker are linked even if patient row pre-existed
      await supabase.from('patients').update({
        doctor_id: doctorId || null,
        caretaker_id: caretakerId || null
      }).eq('patient_id', patientId)
      results.skipped.push('patient link (updated doctor/caretaker)')
    }

    // 3. Seed sugar readings (only if none exist for this patient)
    const { data: existingReadings } = await supabase
      .from('sugar_readings')
      .select('reading_id')
      .eq('patient_id', patientId)
      .limit(1)

    if (!existingReadings || existingReadings.length === 0) {
      const readings = [
        { patient_id: patientId, meal_type: 'Breakfast', timing: 'Before Meal', sugar_level: 98,  status: 'Normal', recorded_at: daysAgo(6) },
        { patient_id: patientId, meal_type: 'Lunch',     timing: 'After Meal',  sugar_level: 162, status: 'High',   recorded_at: daysAgo(6) },
        { patient_id: patientId, meal_type: 'Dinner',    timing: 'After Meal',  sugar_level: 134, status: 'Normal', recorded_at: daysAgo(5) },
        { patient_id: patientId, meal_type: 'Breakfast', timing: 'Before Meal', sugar_level: 75,  status: 'Low',    recorded_at: daysAgo(4) },
        { patient_id: patientId, meal_type: 'Lunch',     timing: 'Before Meal', sugar_level: 110, status: 'Normal', recorded_at: daysAgo(4) },
        { patient_id: patientId, meal_type: 'Dinner',    timing: 'After Meal',  sugar_level: 148, status: 'High',   recorded_at: daysAgo(3) },
        { patient_id: patientId, meal_type: 'Breakfast', timing: 'Before Meal', sugar_level: 102, status: 'Normal', recorded_at: daysAgo(2) },
        { patient_id: patientId, meal_type: 'Lunch',     timing: 'After Meal',  sugar_level: 138, status: 'Normal', recorded_at: daysAgo(2) },
        { patient_id: patientId, meal_type: 'Dinner',    timing: 'Before Meal', sugar_level: 95,  status: 'Normal', recorded_at: daysAgo(1) },
        { patient_id: patientId, meal_type: 'Breakfast', timing: 'Before Meal', sugar_level: 88,  status: 'Normal', recorded_at: hoursAgo(3) }
      ]
      await supabase.from('sugar_readings').insert(readings)
      results.created.push(`${readings.length} sugar readings`)
    } else {
      results.skipped.push('sugar readings (already exist)')
    }

    // 4. Seed messages between patient and doctor
    if (doctorId) {
      const { data: existingMsgs } = await supabase
        .from('messages')
        .select('message_id')
        .or(`and(sender_id.eq.${patientId},receiver_id.eq.${doctorId}),and(sender_id.eq.${doctorId},receiver_id.eq.${patientId})`)
        .limit(1)

      if (!existingMsgs || existingMsgs.length === 0) {
        await supabase.from('messages').insert([
          { sender_id: doctorId, receiver_id: patientId, message_text: 'Your morning fasting blood sugars are looking much more stable this week. Keep up the great work!', sent_at: hoursAgo(6) },
          { sender_id: patientId, receiver_id: doctorId, message_text: 'Thank you Dr. Sarah! I have been walking for 20 minutes after dinner as well.', sent_at: hoursAgo(5) },
          { sender_id: doctorId, receiver_id: patientId, message_text: 'Excellent! Exercise after meals really helps with post-meal glucose spikes. Let\'s keep this up for another week and review.', sent_at: hoursAgo(4) }
        ])
        results.created.push('3 demo messages (patient ↔ doctor)')
      } else {
        results.skipped.push('messages (already exist)')
      }
    }

    // 5. Seed prescriptions
    const { data: existingRx } = await supabase
      .from('prescriptions')
      .select('prescription_id')
      .eq('patient_id', patientId)
      .limit(1)

    if (!existingRx || existingRx.length === 0) {
      await supabase.from('prescriptions').insert([
        { patient_id: patientId, name: 'Metformin',  dosage: '500mg', frequency: 'Twice daily', time: 'With meals',  status: 'Pending' },
        { patient_id: patientId, name: 'Jardiance',  dosage: '10mg',  frequency: 'Once daily',  time: 'Morning',     status: 'Pending' },
        { patient_id: patientId, name: 'Lisinopril', dosage: '5mg',   frequency: 'Once daily',  time: 'Evening',     status: 'Taken'   }
      ])
      results.created.push('3 demo prescriptions')
    } else {
      results.skipped.push('prescriptions (already exist)')
    }

    // 6. Seed a welcome notification for patient
    const { data: existingNotifs } = await supabase
      .from('notifications')
      .select('notification_id')
      .eq('user_id', patientId)
      .limit(1)

    if (!existingNotifs || existingNotifs.length === 0) {
      await supabase.from('notifications').insert([
        { user_id: patientId, type: 'Alert',       message: 'Welcome to Glucolyse! Your care team is connected.', is_read: false },
        { user_id: patientId, type: 'Sugar Check', message: 'Reminder: Log your fasting blood sugar first thing in the morning.', is_read: false }
      ])
      results.created.push('2 welcome notifications')
    } else {
      results.skipped.push('notifications (already exist)')
    }

    res.json({
      success: true,
      message: 'Demo data seeded successfully',
      accounts: {
        patient:   { email: 'patient@glucolyse.com',   password: 'Patient123' },
        doctor:    { email: 'doctor@glucolyse.com',    password: 'Doctor123' },
        caretaker: { email: 'caretaker@glucolyse.com', password: 'Caretaker123' }
      },
      results
    })
  } catch (err) {
    console.error('Seed error:', err)
    res.status(500).json({ error: 'Seed failed', message: err.message })
  }
}
