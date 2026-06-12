import pg from 'pg'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_FILE = path.join(__dirname, 'db.json')

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'diatrack',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  connectionTimeoutMillis: 1000
})

let useFallback = false

let memoryDb = {
  users: [],
  patients: [],
  sugar_readings: [],
  messages: [],
  notifications: [],
  connection_requests: [],
  prescriptions: []
}

const saveMemoryDb = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf8')
  } catch (err) {
    console.error('Failed to save JSON database backup:', err)
  }
}

const loadMemoryDb = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8')
      memoryDb = JSON.parse(data)
      console.log('Persistent local JSON database loaded successfully from server/config/db.json')
    } else {
      memoryDb = {
        users: [
          {
            user_id: 'p-uuid-1',
            name: 'Emily Davis',
            email: 'patient@glucolyse.com',
            password_hash: '',
            role: 'Patient',
            phone: '+1 555-0101',
            date_of_birth: '1992-06-14',
            blood_type: 'O+',
            emergency_contact: 'John Davis (+1 555-0102)',
            photo_url: null,
            specialty: null,
            created_at: new Date().toISOString()
          },
          {
            user_id: 'd-uuid-1',
            name: 'Dr. Sarah Jenkins',
            email: 'doctor@glucolyse.com',
            password_hash: '',
            role: 'Doctor',
            phone: '+1 555-0201',
            specialty: 'Endocrinology',
            date_of_birth: '1980-03-22',
            blood_type: null,
            emergency_contact: null,
            photo_url: null,
            created_at: new Date().toISOString()
          },
          {
            user_id: 'c-uuid-1',
            name: 'John Miller',
            email: 'caretaker@glucolyse.com',
            password_hash: '',
            role: 'Caretaker',
            phone: '+1 555-0301',
            date_of_birth: '1985-09-10',
            blood_type: null,
            specialty: null,
            emergency_contact: null,
            photo_url: null,
            created_at: new Date().toISOString()
          }
        ],
        patients: [
          { patient_id: 'p-uuid-1', doctor_id: 'd-uuid-1', caretaker_id: 'c-uuid-1' }
        ],
        sugar_readings: [
          { reading_id: 'sr-1', patient_id: 'p-uuid-1', meal_type: 'Breakfast', timing: 'Before Meal', sugar_level: 110, status: 'Normal', recorded_at: new Date(Date.now() - 86400000 * 3).toISOString() },
          { reading_id: 'sr-2', patient_id: 'p-uuid-1', meal_type: 'Lunch', timing: 'After Meal', sugar_level: 155, status: 'High', recorded_at: new Date(Date.now() - 86400000 * 2).toISOString() },
          { reading_id: 'sr-3', patient_id: 'p-uuid-1', meal_type: 'Dinner', timing: 'After Meal', sugar_level: 130, status: 'Normal', recorded_at: new Date(Date.now() - 86400000 * 1).toISOString() },
          { reading_id: 'sr-4', patient_id: 'p-uuid-1', meal_type: 'Breakfast', timing: 'Before Meal', sugar_level: 72, status: 'Low', recorded_at: new Date().toISOString() }
        ],
        messages: [
          { message_id: 'm-1', sender_id: 'd-uuid-1', receiver_id: 'p-uuid-1', message_text: 'Your morning fasting blood sugars are looking much more stable. Keep up the great work!', sent_at: new Date(Date.now() - 3600000 * 4).toISOString() },
          { message_id: 'm-2', sender_id: 'p-uuid-1', receiver_id: 'd-uuid-1', message_text: 'Thank you Dr. Sarah! I have been walking for 20 minutes after dinner as well.', sent_at: new Date(Date.now() - 3600000 * 3).toISOString() }
        ],
        notifications: [
          { notification_id: 'n-1', user_id: 'p-uuid-1', type: 'Alert', message: 'Fasting reading was low yesterday morning.', is_read: false, created_at: new Date().toISOString() }
        ],
        connection_requests: [],
        prescriptions: [
          { prescription_id: 'rx-1', patient_id: 'p-uuid-1', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', time: 'With meals', status: 'Pending', created_at: new Date().toISOString() },
          { prescription_id: 'rx-2', patient_id: 'p-uuid-1', name: 'Jardiance', dosage: '10mg', frequency: 'Once daily', time: 'Morning', status: 'Pending', created_at: new Date().toISOString() }
        ]
      }
      saveMemoryDb()
      console.log('Seeded defaults and created server/config/db.json file')
    }
  } catch (err) {
    console.error('Failed to initialize JSON database:', err)
  }
  if (!memoryDb.prescriptions) memoryDb.prescriptions = []
}

loadMemoryDb()

const seedPasswords = async () => {
  if (memoryDb.users[0] && !memoryDb.users[0].password_hash) {
    const hashPatient = await bcrypt.hash('Patient123', 10)
    const hashDoctor = await bcrypt.hash('Doctor123', 10)
    const hashCaretaker = await bcrypt.hash('Caretaker123', 10)
    memoryDb.users[0].password_hash = hashPatient
    if (memoryDb.users[1]) memoryDb.users[1].password_hash = hashDoctor
    if (memoryDb.users[2]) memoryDb.users[2].password_hash = hashCaretaker
    saveMemoryDb()
  }
}
seedPasswords()

pool.query('SELECT NOW()')
  .then(() => {
    console.log('PostgreSQL database connected successfully.')
  })
  .catch(() => {
    console.log('PostgreSQL offline. Falling back to persistent Local JSON Database for Live Preview!')
    useFallback = true
  })

const ensureSeedData = (patientId) => {
  if (!patientId || typeof patientId !== 'string') return
  if (patientId.length < 10) return

  const reads = memoryDb.sugar_readings.filter(r => r.patient_id === patientId)
  if (reads.length === 0) {
    const defaultReads = [
      { reading_id: uuidv4(), patient_id: patientId, meal_type: 'Breakfast', timing: 'Before Meal', sugar_level: 110, status: 'Normal', recorded_at: new Date(Date.now() - 86400000 * 3).toISOString() },
      { reading_id: uuidv4(), patient_id: patientId, meal_type: 'Lunch', timing: 'After Meal', sugar_level: 155, status: 'High', recorded_at: new Date(Date.now() - 86400000 * 2).toISOString() },
      { reading_id: uuidv4(), patient_id: patientId, meal_type: 'Dinner', timing: 'After Meal', sugar_level: 130, status: 'Normal', recorded_at: new Date(Date.now() - 86400000 * 1).toISOString() },
      { reading_id: uuidv4(), patient_id: patientId, meal_type: 'Breakfast', timing: 'Before Meal', sugar_level: 72, status: 'Low', recorded_at: new Date().toISOString() }
    ]
    memoryDb.sugar_readings.push(...defaultReads)
    saveMemoryDb()
  }

  const msgs = memoryDb.messages.filter(m =>
    (m.sender_id === patientId && m.receiver_id === 'd-uuid-1') ||
    (m.sender_id === 'd-uuid-1' && m.receiver_id === patientId)
  )
  if (msgs.length === 0) {
    const defaultMsgs = [
      { message_id: uuidv4(), sender_id: 'd-uuid-1', receiver_id: patientId, message_text: 'Your morning fasting blood sugars are looking much more stable. Keep up the great work!', sent_at: new Date(Date.now() - 3600000 * 4).toISOString() },
      { message_id: uuidv4(), sender_id: patientId, receiver_id: 'd-uuid-1', message_text: 'Thank you Dr. Sarah! I have been walking for 20 minutes after dinner as well.', sent_at: new Date(Date.now() - 3600000 * 3).toISOString() }
    ]
    memoryDb.messages.push(...defaultMsgs)
    saveMemoryDb()
  }
}

const fallbackQuery = async (text, params = []) => {
  const sql = text.trim().replace(/\s+/g, ' ')

  // SELECT user_id FROM users WHERE email = $1 OR SELECT * FROM users WHERE email = $1
  if (sql.includes('FROM users') && sql.includes('email = $1')) {
    const user = memoryDb.users.find(u => u.email.toLowerCase() === params[0].toLowerCase())
    return { rows: user ? [user] : [] }
  }

  // SELECT fcm_token (or any cols) FROM users WHERE user_id = $1 (no alias, no JOIN)
  if (sql.includes('FROM users') && sql.includes('user_id = $1') && !sql.includes('JOIN') && !sql.includes('role')) {
    const user = memoryDb.users.find(u => u.user_id === params[0])
    return { rows: user ? [user] : [] }
  }

  // INSERT INTO users (extended with optional profile fields)
  if (sql.includes('INSERT INTO users')) {
    const newUser = {
      user_id: uuidv4(),
      name: params[0],
      email: params[1],
      password_hash: params[2],
      role: params[3],
      phone: params[4] || null,
      date_of_birth: params[5] || null,
      specialty: params[6] || null,
      blood_type: params[7] || null,
      emergency_contact: params[8] || null,
      photo_url: params[9] || null,
      created_at: new Date().toISOString()
    }
    memoryDb.users.push(newUser)
    saveMemoryDb()
    return { rows: [newUser] }
  }

  // UPDATE users SET fcm_token = NULL WHERE user_id = $1 (remove token — one param)
  if (sql.includes('UPDATE users SET fcm_token = NULL') && sql.includes('WHERE user_id =')) {
    const u = memoryDb.users.find(u => u.user_id === params[0])
    if (u) { u.fcm_token = null; saveMemoryDb() }
    return { rows: [] }
  }

  // UPDATE users SET fcm_token = $1 WHERE user_id = $2 (save token — two params)
  if (sql.includes('UPDATE users SET fcm_token =') && sql.includes('WHERE user_id =')) {
    const u = memoryDb.users.find(u => u.user_id === params[1])
    if (u) { u.fcm_token = params[0]; saveMemoryDb() }
    return { rows: [] }
  }

  // UPDATE users SET ... (profile update)
  if (sql.includes('UPDATE users SET') && sql.includes('WHERE user_id =')) {
    const userId = params[params.length - 1]
    const u = memoryDb.users.find(u => u.user_id === userId)
    if (!u) return { rows: [] }
    if (params[0] !== null && params[0] !== undefined) u.name = params[0]
    if (params[1] !== null && params[1] !== undefined) u.phone = params[1]
    if (params[2] !== null && params[2] !== undefined) u.date_of_birth = params[2]
    if (params[3] !== null && params[3] !== undefined) u.specialty = params[3]
    if (params[4] !== null && params[4] !== undefined) u.blood_type = params[4]
    if (params[5] !== null && params[5] !== undefined) u.emergency_contact = params[5]
    if (params[6] !== null && params[6] !== undefined) u.photo_url = params[6]
    saveMemoryDb()
    return { rows: [u] }
  }

  // INSERT INTO patients (patient_id, doctor_id) VALUES ($1, $2)
  if (sql.includes('INSERT INTO patients') && !sql.includes('caretaker_id')) {
    const newPat = {
      patient_id: params[0],
      doctor_id: params[1] || 'd-uuid-1',
      caretaker_id: 'c-uuid-1'
    }
    memoryDb.patients.push(newPat)
    saveMemoryDb()
    return { rows: [newPat] }
  }

  // INSERT INTO sugar_readings
  if (sql.includes('INSERT INTO sugar_readings')) {
    const newRead = {
      reading_id: uuidv4(),
      patient_id: params[0],
      meal_type: params[1],
      timing: params[2],
      sugar_level: parseInt(params[3]),
      status: params[4],
      recorded_at: new Date().toISOString()
    }
    memoryDb.sugar_readings.push(newRead)
    saveMemoryDb()
    return { rows: [newRead] }
  }

  // SELECT * FROM sugar_readings WHERE patient_id = $1 (no AVG)
  if (sql.includes('FROM sugar_readings') && !sql.includes('AVG') && sql.includes('patient_id = $1')) {
    ensureSeedData(params[0])
    const reads = memoryDb.sugar_readings.filter(r => r.patient_id === params[0])
    return { rows: reads }
  }

  // AVG(sugar_level) no GROUP BY
  if (sql.includes('AVG(sugar_level)') && sql.includes('patient_id = $1') && !sql.includes('GROUP BY')) {
    ensureSeedData(params[0])
    const reads = memoryDb.sugar_readings.filter(r => r.patient_id === params[0])
    if (reads.length === 0) {
      return { rows: [{ avg_level: null, min_level: null, max_level: null, total_readings: 0 }] }
    }
    const levels = reads.map(r => r.sugar_level)
    const avg = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length)
    const min = Math.min(...levels)
    const max = Math.max(...levels)
    return { rows: [{ avg_level: avg, min_level: min, max_level: max, total_readings: reads.length }] }
  }

  // AVG(sugar_level) GROUP BY meal_type
  if (sql.includes('AVG(sugar_level)') && sql.includes('patient_id = $1') && sql.includes('GROUP BY')) {
    ensureSeedData(params[0])
    const reads = memoryDb.sugar_readings.filter(r => r.patient_id === params[0])
    const grouped = {}
    reads.forEach(r => {
      if (!grouped[r.meal_type]) grouped[r.meal_type] = []
      grouped[r.meal_type].push(r.sugar_level)
    })
    const rows = Object.entries(grouped).map(([meal_type, levels]) => ({
      meal_type,
      average: Math.round(levels.reduce((a, b) => a + b, 0) / levels.length),
      count: levels.length
    }))
    return { rows }
  }

  // caretaker join
  if (sql.includes('ON p.caretaker_id = u.user_id') && sql.includes('p.patient_id = $1')) {
    const pat = memoryDb.patients.find(p => p.patient_id === params[0])
    if (pat && pat.caretaker_id) {
      const ct = memoryDb.users.find(u => u.user_id === pat.caretaker_id)
      return { rows: ct ? [ct] : [] }
    }
    return { rows: [] }
  }

  // SELECT * FROM patients WHERE patient_id = $1 (no join)
  if (sql.includes('FROM patients') && sql.includes('patient_id = $1') && !sql.includes('JOIN') && !sql.includes('AVG')) {
    const pat = memoryDb.patients.find(p => p.patient_id === params[0])
    return { rows: pat ? [pat] : [] }
  }

  // patients JOIN users (doctor's patient list)
  if (sql.includes('FROM patients p JOIN users u')) {
    const doctorId = params[0]
    const matchedPatients = memoryDb.patients.filter(p => p.doctor_id === doctorId || p.caretaker_id === doctorId)
    const patientIds = matchedPatients.map(p => p.patient_id)
    const linkedUsers = memoryDb.users.filter(u => patientIds.includes(u.user_id))
    return { rows: linkedUsers }
  }

  // SELECT ... FROM users u WHERE u.user_id = $1
  if (sql.includes('FROM users u WHERE u.user_id = $1')) {
    const user = memoryDb.users.find(u => u.user_id === params[0])
    return { rows: user ? [user] : [] }
  }

  // FROM messages (SELECT fetch — both JOIN and plain forms)
  if (sql.includes('FROM messages') && !sql.includes('INSERT')) {
    const userA = params[0]
    const userB = params[1]
    let msgs = memoryDb.messages.filter(m =>
      (m.sender_id === userA && m.receiver_id === userB) ||
      (m.sender_id === userB && m.receiver_id === userA)
    )
    // Seed default conversation if none exists between this pair
    if (msgs.length === 0 && userA && userB) {
      const uA = memoryDb.users.find(u => u.user_id === userA)
      const uB = memoryDb.users.find(u => u.user_id === userB)
      if (uA && uB) {
        const [sender, receiver] = uA.role === 'Patient' ? [uB, uA] : [uA, uB]
        const defaultMsgs = [
          { message_id: uuidv4(), sender_id: sender.user_id, receiver_id: receiver.user_id, message_text: `Hi! Just checking in — how are you feeling today?`, sent_at: new Date(Date.now() - 3600000 * 4).toISOString() },
          { message_id: uuidv4(), sender_id: receiver.user_id, receiver_id: sender.user_id, message_text: `I'm doing okay, thank you for checking. Blood sugar was a bit high after lunch.`, sent_at: new Date(Date.now() - 3600000 * 2).toISOString() }
        ]
        memoryDb.messages.push(...defaultMsgs)
        saveMemoryDb()
        msgs = defaultMsgs
      }
    }
    const formatted = msgs.map(m => {
      const userObj = memoryDb.users.find(u => u.user_id === m.sender_id)
      return { ...m, sender_name: userObj?.name || 'Sender', sender_role: userObj?.role || 'Patient' }
    })
    return { rows: formatted }
  }

  // INSERT INTO messages
  if (sql.includes('INSERT INTO messages')) {
    const newMsg = {
      message_id: uuidv4(),
      sender_id: params[0],
      receiver_id: params[1],
      message_text: params[2],
      sent_at: new Date().toISOString()
    }
    memoryDb.messages.push(newMsg)
    saveMemoryDb()
    return { rows: [newMsg] }
  }

  // INSERT INTO notifications
  if (sql.includes('INSERT INTO notifications')) {
    const newNot = {
      notification_id: uuidv4(),
      user_id: params[0],
      type: params[1],
      message: params[2],
      is_read: false,
      created_at: new Date().toISOString()
    }
    memoryDb.notifications.push(newNot)
    saveMemoryDb()
    return { rows: [newNot] }
  }

  // SELECT FROM notifications (list)
  if (sql.includes('FROM notifications') && !sql.includes('COUNT') && sql.includes('user_id = $1')) {
    const nots = memoryDb.notifications.filter(n => n.user_id === params[0])
    return { rows: nots }
  }

  // COUNT unread notifications
  if (sql.includes('COUNT(*) as count FROM notifications')) {
    const count = memoryDb.notifications.filter(n => n.user_id === params[0] && !n.is_read).length
    return { rows: [{ count }] }
  }

  // UPDATE notifications SET is_read = TRUE WHERE user_id = $1 (mark ALL read)
  if (sql.includes('UPDATE notifications SET is_read = TRUE') && sql.includes('user_id = $1')) {
    memoryDb.notifications = memoryDb.notifications.map(n =>
      n.user_id === params[0] ? { ...n, is_read: true } : n
    )
    saveMemoryDb()
    return { rows: [] }
  }

  // UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 (mark single read)
  if (sql.includes('UPDATE notifications SET is_read = TRUE')) {
    memoryDb.notifications = memoryDb.notifications.map(n =>
      n.notification_id === params[0] ? { ...n, is_read: true } : n
    )
    saveMemoryDb()
    return { rows: [] }
  }

  // doctor join for patient's linked doctor
  if (sql.includes('FROM patients p JOIN users u ON p.doctor_id = u.user_id') && sql.includes('p.patient_id = $1')) {
    const patientId = params[0]
    const pat = memoryDb.patients.find(p => p.patient_id === patientId)
    if (pat && pat.doctor_id) {
      const doc = memoryDb.users.find(u => u.user_id === pat.doctor_id)
      return { rows: doc ? [doc] : [] }
    }
    return { rows: [] }
  }

  // SELECT FROM users WHERE role = $1
  if (sql.includes('FROM users') && (sql.includes('role = $1') || sql.includes("role = 'Doctor'"))) {
    const roleVal = params[0] || 'Doctor'
    const docs = memoryDb.users.filter(u => u.role === roleVal)
    return { rows: docs }
  }

  // UPDATE patients SET doctor_id
  if (sql.includes('UPDATE patients SET doctor_id = $1 WHERE patient_id = $2')) {
    const docId = params[0]
    const patId = params[1]
    const pat = memoryDb.patients.find(p => p.patient_id === patId)
    if (pat) { pat.doctor_id = docId } else { memoryDb.patients.push({ patient_id: patId, doctor_id: docId, caretaker_id: null }) }
    saveMemoryDb()
    return { rows: [] }
  }

  // UPDATE patients SET caretaker_id
  if (sql.includes('UPDATE patients SET caretaker_id = $1 WHERE patient_id = $2')) {
    const ctId = params[0]
    const patId = params[1]
    const pat = memoryDb.patients.find(p => p.patient_id === patId)
    if (pat) { pat.caretaker_id = ctId } else { memoryDb.patients.push({ patient_id: patId, doctor_id: null, caretaker_id: ctId }) }
    saveMemoryDb()
    return { rows: [] }
  }

  // INSERT INTO patients (patient_id, doctor_id, caretaker_id)
  if (sql.includes('INSERT INTO patients (patient_id, doctor_id, caretaker_id)')) {
    const newPat = { patient_id: params[0], doctor_id: params[1], caretaker_id: params[2] }
    memoryDb.patients.push(newPat)
    saveMemoryDb()
    return { rows: [newPat] }
  }

  // SELECT role FROM users WHERE user_id = $1
  if (sql.trim().startsWith('SELECT role FROM users') && sql.includes('user_id = $1')) {
    const u = memoryDb.users.find(u => u.user_id === params[0])
    return { rows: u ? [{ role: u.role }] : [] }
  }

  // Search professionals LIKE
  if (sql.includes("role IN") && sql.includes("LIKE $1")) {
    const q = (params[0] || '').replace(/%/g, '').toLowerCase()
    const profs = memoryDb.users.filter(u =>
      (u.role === 'Doctor' || u.role === 'Caretaker') &&
      (u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q))
    )
    return { rows: profs }
  }

  // Check duplicate connection request
  if (sql.includes('FROM connection_requests') && sql.includes('from_id = $1') && sql.includes('to_id = $2')) {
    const reqs = (memoryDb.connection_requests || []).filter(r =>
      r.from_id === params[0] && r.to_id === params[1] && r.status === 'pending'
    )
    return { rows: reqs }
  }

  // INSERT INTO connection_requests
  if (sql.includes('INSERT INTO connection_requests')) {
    if (!memoryDb.connection_requests) memoryDb.connection_requests = []
    const newReq = {
      request_id: uuidv4(),
      from_id: params[0],
      to_id: params[1],
      status: params[2] || 'pending',
      created_at: new Date().toISOString()
    }
    memoryDb.connection_requests.push(newReq)
    saveMemoryDb()
    return { rows: [newReq] }
  }

  // Pending requests (to_id = $1)
  if (sql.includes('FROM connection_requests cr') && sql.includes('to_id = $1') && sql.includes("status = 'pending'")) {
    const reqs = (memoryDb.connection_requests || []).filter(r => r.to_id === params[0] && r.status === 'pending')
    const rows = reqs.map(r => {
      const patient = memoryDb.users.find(u => u.user_id === r.from_id)
      return { ...r, patient_name: patient?.name || 'Unknown', patient_email: patient?.email || '', patient_photo: patient?.photo_url || null }
    })
    return { rows }
  }

  // Outgoing requests (from_id = $1)
  if (sql.includes('FROM connection_requests cr') && sql.includes('from_id = $1')) {
    const reqs = (memoryDb.connection_requests || []).filter(r => r.from_id === params[0])
    const rows = reqs.map(r => {
      const prof = memoryDb.users.find(u => u.user_id === r.to_id)
      return { ...r, to_name: prof?.name || 'Unknown', to_email: prof?.email || '', to_role: prof?.role || '', to_photo: prof?.photo_url || null }
    })
    return { rows }
  }

  // SELECT FROM connection_requests WHERE request_id = $1 AND to_id = $2
  if (sql.includes('FROM connection_requests') && sql.includes('request_id = $1') && sql.includes('to_id = $2')) {
    const req = (memoryDb.connection_requests || []).find(r => r.request_id === params[0] && r.to_id === params[1])
    return { rows: req ? [req] : [] }
  }

  // UPDATE connection_requests SET status
  if (sql.includes('UPDATE connection_requests SET status = $1 WHERE request_id = $2')) {
    if (memoryDb.connection_requests) {
      const req = memoryDb.connection_requests.find(r => r.request_id === params[1])
      if (req) req.status = params[0]
      saveMemoryDb()
    }
    return { rows: [] }
  }

  // DELETE FROM sugar_readings WHERE reading_id = $1 AND patient_id = $2
  if (sql.includes('DELETE FROM sugar_readings') && sql.includes('reading_id = $1')) {
    if (!memoryDb.prescriptions) memoryDb.prescriptions = []
    memoryDb.sugar_readings = memoryDb.sugar_readings.filter(r => !(r.reading_id === params[0] && r.patient_id === params[1]))
    saveMemoryDb()
    return { rows: [] }
  }

  // SELECT * FROM prescriptions WHERE patient_id = $1
  if (sql.includes('FROM prescriptions') && sql.includes('patient_id = $1') && !sql.includes('INSERT') && !sql.includes('UPDATE') && !sql.includes('DELETE')) {
    if (!memoryDb.prescriptions) memoryDb.prescriptions = []
    const rxs = memoryDb.prescriptions.filter(r => r.patient_id === params[0])
    return { rows: rxs }
  }

  // INSERT INTO prescriptions
  if (sql.includes('INSERT INTO prescriptions')) {
    if (!memoryDb.prescriptions) memoryDb.prescriptions = []
    const newRx = {
      prescription_id: uuidv4(),
      patient_id: params[0],
      name: params[1],
      dosage: params[2],
      frequency: params[3] || 'Once daily',
      time: params[4] || '',
      status: 'Pending',
      created_at: new Date().toISOString()
    }
    memoryDb.prescriptions.push(newRx)
    saveMemoryDb()
    return { rows: [newRx] }
  }

  // DELETE FROM prescriptions WHERE prescription_id = $1
  if (sql.includes('DELETE FROM prescriptions') && sql.includes('prescription_id = $1')) {
    if (!memoryDb.prescriptions) memoryDb.prescriptions = []
    memoryDb.prescriptions = memoryDb.prescriptions.filter(r => r.prescription_id !== params[0])
    saveMemoryDb()
    return { rows: [] }
  }

  // SELECT status FROM prescriptions WHERE prescription_id = $1
  if (sql.includes('FROM prescriptions') && sql.includes('prescription_id = $1') && sql.includes('SELECT status')) {
    if (!memoryDb.prescriptions) memoryDb.prescriptions = []
    const rx = memoryDb.prescriptions.find(r => r.prescription_id === params[0])
    return { rows: rx ? [{ status: rx.status }] : [] }
  }

  // UPDATE prescriptions SET status = $1 WHERE prescription_id = $2
  if (sql.includes('UPDATE prescriptions SET status = $1') && sql.includes('prescription_id = $2')) {
    if (!memoryDb.prescriptions) memoryDb.prescriptions = []
    const rx = memoryDb.prescriptions.find(r => r.prescription_id === params[1])
    if (rx) { rx.status = params[0]; saveMemoryDb() }
    return { rows: rx ? [rx] : [] }
  }

  return { rows: [] }
}

const customPool = {
  query: async (text, params) => {
    if (useFallback) {
      return fallbackQuery(text, params)
    }
    try {
      return await pool.query(text, params)
    } catch (err) {
      console.log('Query failed on PostgreSQL. Switching to local JSON database for this session...')
      useFallback = true
      return fallbackQuery(text, params)
    }
  }
}

export default customPool
