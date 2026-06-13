import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const MEAL_COLORS = {
  Breakfast: '#10B981',
  Lunch:     '#3B82F6',
  Dinner:    '#8B5CF6'
}

const MEAL_THRESHOLD = {
  Breakfast: 110,
  Lunch:     140,
  Dinner:    140
}

function getStatus(sugar_level, meal_type) {
  const threshold = MEAL_THRESHOLD[meal_type] || 140
  if (sugar_level < 80)         return 'Low'
  if (sugar_level > threshold)  return 'High'
  return 'Normal'
}

function dotColor(value, mealType) {
  const status = getStatus(value, mealType)
  if (status === 'High') return '#EF4444'
  if (status === 'Low')  return '#F59E0B'
  return MEAL_COLORS[mealType] || '#94a3b8'
}

export default function SugarLineChart({ data = [] }) {
  const dateMap = {}
  const sortKeys = {}

  data.forEach(d => {
    const ts = new Date(d.recorded_at)
    const dateKey = ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!dateMap[dateKey]) {
      dateMap[dateKey] = { date: dateKey }
      sortKeys[dateKey] = ts.getTime()
    }
    if (d.meal_type && d.sugar_level != null) {
      if (dateMap[dateKey][d.meal_type] == null) {
        dateMap[dateKey][d.meal_type] = d.sugar_level
      }
    }
  })

  const rows = Object.values(dateMap).sort((a, b) => sortKeys[a.date] - sortKeys[b.date])

  if (rows.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-text-muted text-sm">
        No data to display
      </div>
    )
  }

  const labels = rows.map(r => r.date)
  const presentMeals = ['Breakfast', 'Lunch', 'Dinner'].filter(m => rows.some(r => r[m] != null))

  const datasets = presentMeals.map(meal => {
    const values = rows.map(r => r[meal] ?? null)
    const base = MEAL_COLORS[meal]

    return {
      label: meal,
      data: values,
      borderColor: base,
      borderWidth: 2,
      tension: 0.35,
      spanGaps: true,
      pointRadius: values.map(v => (v != null ? 5 : 0)),
      pointHoverRadius: 7,
      pointBackgroundColor: values.map(v => (v != null ? dotColor(v, meal) : 'transparent')),
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      fill: false
    }
  })

  const chartData = { labels, datasets }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 18,
          color: '#64748b',
          font: { size: 12, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#334155',
        bodyColor: '#64748b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        callbacks: {
          title: items => items[0].label,
          label: ctx => {
            if (ctx.raw == null) return null
            const meal = ctx.dataset.label
            const status = getStatus(ctx.raw, meal)
            const statusTag = status === 'High' ? ' ▲ High' : status === 'Low' ? ' ▼ Low' : ' ✓ Normal'
            return ` ${meal}: ${ctx.raw} mg/dL${statusTag}`
          },
          labelColor: ctx => ({
            borderColor: 'transparent',
            backgroundColor: ctx.dataset.borderColor,
            borderRadius: 4
          })
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } }
      },
      y: {
        min: 0,
        suggestedMax: 210,
        grid: { color: '#f1f5f9', drawBorder: false },
        border: { display: false },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          stepSize: 45,
          callback: v => v === 0 ? '0' : v
        },
        title: {
          display: true,
          text: 'Sugar Level (mg/dL)',
          color: '#94a3b8',
          font: { size: 10 }
        }
      }
    }
  }

  return (
    <div className="h-72 w-full">
      <Line data={chartData} options={options} />
    </div>
  )
}
