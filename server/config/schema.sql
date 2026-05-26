CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('Doctor', 'Patient', 'Caretaker');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meal_type') THEN
    CREATE TYPE meal_type AS ENUM ('Breakfast', 'Lunch', 'Dinner');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meal_timing') THEN
    CREATE TYPE meal_timing AS ENUM ('Before Meal', 'After Meal');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sugar_status') THEN
    CREATE TYPE sugar_status AS ENUM ('Low', 'Normal', 'High');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notif_type') THEN
    CREATE TYPE notif_type AS ENUM ('Medicine', 'Sugar Check', 'Alert');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  phone VARCHAR(30),
  date_of_birth DATE,
  specialty VARCHAR(255),
  blood_type VARCHAR(10),
  emergency_contact VARCHAR(255),
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
  patient_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES users(user_id),
  caretaker_id UUID REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS sugar_readings (
  reading_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
  meal_type meal_type NOT NULL,
  timing meal_timing NOT NULL,
  sugar_level INT NOT NULL CHECK (sugar_level > 0 AND sugar_level < 1000),
  status sugar_status NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  type notif_type NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
