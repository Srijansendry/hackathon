import React from 'react'

export default function StatCard({ title, value, unit = 'mg/dL', trend, icon, color = 'bg-primary-50 text-primary' }) {
  const trendColors = {
    Normal: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400',
    High: 'text-rose-600 bg-rose-500/10 dark:text-rose-400',
    Low: 'text-amber-600 bg-amber-500/10 dark:text-amber-400'
  }
  
  return (
    <div className="glass-card hover-lift rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group">
      {/* Background glow node on card hover */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors duration-300" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${color}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full ${trendColors[trend] || ''}`}>
            {trend}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-xs text-text-secondary font-bold tracking-wide uppercase mb-1.5">{title}</p>
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
