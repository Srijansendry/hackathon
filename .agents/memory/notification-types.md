---
name: Notification Types
description: All supported notification types and where they must be kept in sync
---

Supported notification types (string values stored in DB `type` column):
- Medicine
- Sugar Check
- Alert
- High Sugar
- Low Sugar
- Appointment
- Emergency

These must be kept consistent across:
1. server/services/notificationService.js — sendNotificationToUser type param
2. client/src/components/Navbar.jsx — NOTIF_TYPE config object
3. client/src/pages/NotificationsPage.jsx — TYPE_CONFIG object + FILTERS array
4. client/src/components/SendNotificationModal.jsx — type dropdown options

**Why:** Each location renders type-specific icons/colors; missing a type shows fallback Alert style.
