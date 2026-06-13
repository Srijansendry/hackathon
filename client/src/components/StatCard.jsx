import React from 'react'
import { motion } from 'framer-motion'

export default function StatCard({ title, value, unit = 'mg/dL', trend, icon, color = 'bg-primary-50 text-primary', delay = 0 }) {
  const trendColors = {
    Normal: 'text-emerald-600 bg-emerald-500/10 border border-emerald-200/50',
    High:   'text-rose-600 bg-rose-500/10 border border-rose-200/50',
    Low:    'text-amber-600 bg-amber-500/10 border border-amber-200/50',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card stat-card-3d rounded-3xl p-6 relative overflow-hidden group cursor-default"
    >
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/12 transition-all duration-700 pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-primary/3 rounded-full blur-xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-400 group-hover:scale-110 group-hover:rotate-3 ${color}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full transition-all duration-200 ${trendColors[trend] || ''}`}>
            {trend === 'Normal' ? 'Average' : trend}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-[10px] text-text-secondary font-bold tracking-widest uppercase mb-2 leading-tight">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-text-heading tracking-tight tabular-nums">
            {value}
          </span>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{unit}</span>
        </div>
      </div>
    </motion.div>
  )
}
