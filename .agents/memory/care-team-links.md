---
name: Multiple Care Team Links
description: How multiple doctors/caretakers per patient is implemented — schema, server, and client patterns.
---

## Rule
Patient can have multiple doctors AND multiple caretakers. Requires two junction tables in Supabase.

## SQL Migration (run once in Supabase SQL Editor)
```sql
CREATE TABLE IF NOT EXISTS patient_doctor_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, doctor_id)
);

CREATE TABLE IF NOT EXISTS patient_caretaker_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  caretaker_id UUID NOT NULL,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, caretaker_id)
);

INSERT INTO patient_doctor_links (patient_id, doctor_id)
SELECT patient_id, doctor_id FROM patients WHERE doctor_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO patient_caretaker_links (patient_id, caretaker_id)
SELECT patient_id, caretaker_id FROM patients WHERE caretaker_id IS NOT NULL
ON CONFLICT DO NOTHING;
```

## Server pattern
- `getMyDoctor` queries new tables first, falls back to old `patients` table — returns `{ doctors[], caretakers[], doctor, caretaker }`.
- `respondToRequest` (accept path): upserts into new junction table AND updates old `patients` table (backward compat).
- `unlinkMember` (POST /doctor/unlink): deletes from junction table + clears old `patients` table if it was that member.
- `getPatients` and `updatePatientContact` check BOTH new tables and old `patients` table.

## Client pattern (PatientDashboard)
- `linkedDoctors[]` and `linkedCaretakers[]` are the source of truth (arrays).
- `const linkedDoctor = linkedDoctors[0] || null` — kept for backward compat with chat/socket code.
- `const linkedCaretaker = linkedCaretakers[0] || null` — same.
- `addingToTeam` boolean toggles the add-member search form (always accessible via "+ Add Member" button).
- Care Team card shows all members with Remove buttons; chat shown below when `linkedDoctor && !addingToTeam`.

**Why:** The old `patients` table with single `doctor_id`/`caretaker_id` couldn't support multiple links. Junction tables are the correct relational pattern. Old table is still updated so existing queries (notifications, etc.) don't break.

**How to apply:** If a new feature needs to read/write doctor-patient links, always read from/write to BOTH junction tables (preferred) AND the old `patients` table for compat. Never assume only one table exists.
