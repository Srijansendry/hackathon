import React from 'react'

export default function StatCard({ title, value, unit = 'mg/dL', trend, icon, color = 'bg-primary-50 text-primary' }) {
  const trendColors = {
    Normal: 'text-emerald-600 bg-emerald-500/10',
    High: 'text-rose-600 bg-rose-500/10',
    Low: 'text-amber-600 bg-amber-500/10'
  }

  return (
    <div className="glass-card stat-card-3d rounded-3xl p-6 relative overflow-hidden group cursor-default">
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 ${color}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full transition-all duration-200 ${trendColors[trend] || ''}`}>
            {trend}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-xs text-text-secondary font-bold tracking-wide uppercase mb-1.5 leading-tight">{title}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold text-text-heading tracking-tight">
            {value}
          </span>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{unit}</span>
        </div>
      </div>
    </div>
  )
}
