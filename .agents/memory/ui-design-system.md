---
name: UI Design System
description: Framer Motion setup, Tailwind v4 conventions, and component animation patterns used in DiaTrack/Glucolyse redesign.
---

## Framer Motion
- Installed in `client/` via npm (not workspace root)
- All dashboards and Login import `{ motion, AnimatePresence }` from `'framer-motion'`
- Standard page entrance: `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}`
- StatCard accepts a `delay` prop (number, default 0) — use 0.08 / 0.14 / 0.20 for 3-card grids
- Form panels use AnimatePresence + scale(0.98) exit for smooth show/hide

## Tailwind v4 Conventions
- CSS uses `@utility` blocks, NOT `@layer utilities`
- Theme tokens defined in `@theme {}` block in index.css
- Color tokens: `--color-primary`, `--color-surface-*`, `--color-text-*`
- Dark mode: class-based (`html.dark`), Emerald theme: `html.emerald`

## Key CSS Utilities
- `.hover-lift` — translateY(-4px) + shadow-hover on hover (spring easing)
- `.stat-card-3d` — perspective 3D tilt on hover
- `.glass-card` — frosted glass with backdrop-blur
- `.patient-card` — slide + color transition for doctor's patient list
- `.skeleton` — shimmer loading animation

**Why:** Tailwind v4's @utility syntax was a breaking change from v3's @layer; using wrong syntax causes utilities to silently not apply.
