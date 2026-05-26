import React, { useState } from 'react'

export default function ActivityHeatmap({ data = [] }) {
  // Generate the last 14 weeks (98 days)
  const getHeatmapData = () => {
    const days = []
    const today = new Date()
    today.setHours(23, 59, 59, 999) // end of today
    
    // Group readings by date string (YYYY-MM-DD)
    const dailyReadings = data.reduce((acc, curr) => {
      if (curr.recorded_at) {
        const dateStr = new Date(curr.recorded_at).toISOString().split('T')[0]
        if (!acc[dateStr]) acc[dateStr] = []
        acc[dateStr].push(curr.sugar_level)
      }
      return acc
    }, {})

    // Generate 98 days (14 weeks) ending today
    for (let i = 97; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const readings = dailyReadings[dateStr] || []
      const count = readings.length
      const avgSugar = count > 0 ? Math.round(readings.reduce((a, b) => a + b, 0) / count) : 0
      
      days.push({
        date,
        dateStr,
        count,
        avgSugar,
        dayOfWeek: date.getDay(),
        month: date.toLocaleString('en-US', { month: 'short' }),
        dayOfMonth: date.getDate()
      })
    }

    return days
  }

  const days = getHeatmapData()

  // Calculate streaks from the generated days
  const calculateStreaks = () => {
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    // Group days by date string (chronological order)
    const chronologicalDays = [...days].sort((a, b) => a.date - b.date)

    // Calculate longest streak in history (days with logs)
    chronologicalDays.forEach(d => {
      if (d.count > 0) {
        tempStreak++
        if (tempStreak > longestStreak) longestStreak = tempStreak
      } else {
        tempStreak = 0
      }
    })

    // Calculate current streak (counting backwards from today)
    const reversedChronological = [...chronologicalDays].reverse()
    
    // If today has logs or yesterday had logs, calculate streak
    const hasLogsToday = reversedChronological[0]?.count > 0
    const hasLogsYesterday = reversedChronological[1]?.count > 0

    if (hasLogsToday || hasLogsYesterday) {
      for (let i = 0; i < reversedChronological.length; i++) {
        if (reversedChronological[i].count > 0) {
          currentStreak++
        } else {
          // If we hit a gap and it's not today's gap, break
          if (i > 0 || !hasLogsYesterday) break
        }
      }
    }

    return { currentStreak, longestStreak }
  }

  const { currentStreak, longestStreak } = calculateStreaks()

  // Helper to determine color tier based on daily sugar level average
  const getColorTier = (day) => {
    if (day.count === 0) return 'bg-slate-100 dark:bg-slate-800/40'
    if (day.avgSugar < 80) {
      // Low sugar level: low intense green (light soft green)
      return 'bg-emerald-200 dark:bg-emerald-950/60 border border-emerald-300/30'
    }
    if (day.avgSugar > 140) {
      // High sugar level: high intense green (dark rich green)
      return 'bg-emerald-800 dark:bg-emerald-500/80 text-white'
    }
    // Normal sugar level (up to 140): normal green
    return 'bg-emerald-500 dark:bg-emerald-600 text-white'
  }

  // Hover state for interactive tooltip
  const [hoveredDay, setHoveredDay] = useState(null)

  // Chunk days into columns of 7 elements (weeks)
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-soft hover:shadow-card transition-shadow duration-300">
      <div className="flex flex-col md:flex-row gap-6 justify-between md:items-center mb-6">
        <div>
          <h3 className="text-base font-bold text-text-heading">Log Activity Heatmap</h3>
          <p className="text-text-secondary text-xs mt-0.5">Glycemic logging frequency (last 14 weeks)</p>
        </div>

        {/* Streaks Widget */}
        <div className="flex gap-5 items-center bg-gradient-to-r from-orange-500/5 to-amber-500/5 dark:from-orange-500/10 dark:to-amber-500/10 p-3 px-4.5 rounded-xl border border-orange-500/10 dark:border-orange-500/20 shadow-sm transition-all duration-300 hover:shadow-md hover:border-orange-500/20 select-none">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse filter drop-shadow-[0_2px_8px_rgba(249,115,22,0.45)] select-none">🔥</span>
            <div>
              <p className="text-[9px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-none mb-1.5">
                Active Streak
              </p>
              <p className="text-base font-black text-text-heading leading-none">
                {currentStreak} <span className="text-xs font-bold text-text-secondary">Days</span>
              </p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-orange-500/20 dark:bg-orange-500/30"></div>
          
          <div>
            <p className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest leading-none mb-1.5">
              Longest Streak
            </p>
            <p className="text-base font-black text-text-heading leading-none">
              {longestStreak} <span className="text-xs font-bold text-text-secondary">Days</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 overflow-x-auto pb-2">
        {/* Day-of-week indicators */}
        <div className="grid grid-rows-7 gap-1.5 text-[9px] font-semibold text-text-muted select-none mt-5">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Heatmap Grid */}
        <div className="flex-1 flex flex-col space-y-1">
          {/* Month labels — placed above the week column where each new month begins */}
          <div className="flex gap-1.5 mb-1 select-none">
            {weeks.map((week, wIdx) => {
              const firstDay = week.find(d => d)
              const prevWeek = weeks[wIdx - 1]
              const prevFirstDay = prevWeek?.find(d => d)
              const isNewMonth =
                wIdx === 0 ||
                (firstDay && prevFirstDay &&
                  firstDay.date.getMonth() !== prevFirstDay.date.getMonth())
              return (
                <div
                  key={wIdx}
                  className="w-3.5 shrink-0 text-[9px] font-bold text-text-muted overflow-visible whitespace-nowrap"
                >
                  {isNewMonth ? firstDay?.month : ''}
                </div>
              )
            })}
          </div>

          <div className="flex gap-1.5">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5">
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`heatmap-tile w-3.5 h-3.5 rounded-sm cursor-pointer ${getColorTier(day)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Tooltip HUD */}
      <div className="h-6 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-text-secondary select-none">
        <div>
          {hoveredDay ? (
            <span className="animate-fade-in font-medium">
              📅 {hoveredDay.month} {hoveredDay.dayOfMonth}: <strong className="text-text-heading">{hoveredDay.count > 0 ? `${hoveredDay.avgSugar} mg/dL (Avg)` : 'No logs'}</strong> submitted
            </span>
          ) : (
            <span className="text-text-muted">Hover over cells to view daily glycemic averages</span>
          )}
        </div>

        {/* Map Legend */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-text-muted mr-1">No Logs</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-slate-100 dark:bg-slate-800/40" />
          <span className="text-text-muted mx-0.5">|</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-200 border border-emerald-300/30" />
          <span className="text-text-muted text-[9px] mr-1">Low (&lt;80)</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
          <span className="text-text-muted text-[9px] mr-1">Normal (80-140)</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-800" />
          <span className="text-text-muted text-[9px]">High (&gt;140)</span>
        </div>
      </div>
    </div>
  )
}
