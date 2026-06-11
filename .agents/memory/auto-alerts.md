---
name: Auto Blood Sugar Alerts
description: How automatic push alerts work when a reading is logged
---

When a patient logs a blood sugar reading via POST /api/readings/add:
1. sugarController.addReading() responds immediately with 201
2. If status is High (>140) or Low (<80), it fires sendBloodSugarAlert() non-blocking (.catch)
3. sendBloodSugarAlert() in notificationService.js:
   - Notifies the patient (DB insert + FCM push)
   - Queries `patients` table to get doctor_id and caretaker_id
   - Notifies doctor and caretaker with patient name + reading details

Thresholds: >140 = High Sugar alert, <80 = Low Sugar alert (same as calcStatus thresholds).
Doctor/caretaker alerts only fire if the linked user exists and has an FCM token.

**Why:** Non-blocking fire-and-forget keeps the API response fast; caregiver alerts require the patients table join to work (handled by fallbackQuery's `FROM patients WHERE patient_id = $1` case).
