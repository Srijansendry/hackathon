---
name: FCM + Local DB Quirks
description: Gotchas with FCM token queries against the fallbackQuery JSON DB
---

The fallbackQuery in server/config/db.js matches SQL by substring. Two critical rules:

1. `SELECT fcm_token FROM users WHERE user_id = $1` — must use non-aliased form (not `FROM users u WHERE u.user_id`). Handler added for `FROM users` + `user_id = $1` without JOIN or role filter.

2. `UPDATE users SET fcm_token = NULL WHERE user_id = $1` (remove, 1 param) vs `UPDATE users SET fcm_token = $1 WHERE user_id = $2` (save, 2 params) — need SEPARATE handlers in this order: NULL case first, then parameterized case.

3. `UPDATE notifications SET is_read = TRUE WHERE user_id = $1` (mark-all) vs `WHERE notification_id = $1` (mark-one) — mark-all handler must come FIRST since it's more specific.

**Why:** fallbackQuery uses sequential if-checks; order matters. The NULL-param remove-token bug would set fcm_token to userId instead of null.
