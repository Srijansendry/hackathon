-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This creates all tables needed for the Glucolyse / DiaTrack application

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Doctor', 'Patient', 'Caretaker')),
  phone VARCHAR(30),
  date_of_birth DATE,
  specialty VARCHAR(255),
  blood_type VARCHAR(10),
  emergency_contact VARCHAR(255),
  photo_url TEXT,
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  patient_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES users(user_id),
  caretaker_id UUID REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS sugar_readings (
  reading_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner')),
  timing TEXT NOT NULL CHECK (timing IN ('Before Meal', 'After Meal')),
  sugar_level INT NOT NULL CHECK (sugar_level > 0 AND sugar_level < 1000),
  status TEXT NOT NULL CHECK (status IN ('Low', 'Normal', 'High')),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Medicine', 'Sugar Check', 'Alert', 'High Sugar', 'Low Sugar', 'Appointment', 'Emergency')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS connection_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  to_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescriptions (
  prescription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) DEFAULT 'Once daily',
  time VARCHAR(100),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Taken')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
