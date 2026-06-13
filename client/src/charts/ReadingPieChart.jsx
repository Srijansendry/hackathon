import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

const STATUS_COLORS = {
  Normal: '#10B981',
  Low:    '#F59E0B',
  High:   '#EF4444'
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

const percentLabelPlugin = {
  id: 'percentLabels',
  afterDatasetDraw(chart) {
    const { ctx, data } = chart
    const meta = chart.getDatasetMeta(0)
    const total = data.datasets[0].data.reduce((s, v) => s + v, 0)
    if (total === 0) return

    meta.data.forEach((arc, i) => {
      const value = data.datasets[0].data[i]
      const pct = Math.round((value / total) * 100)
      if (pct < 6) return

      const angle = (arc.startAngle + arc.endAngle) / 2
      const r = (arc.innerRadius + arc.outerRadius) / 2
      const x = arc.x + r * Math.cos(angle)
      const y = arc.y + r * Math.sin(angle)

      ctx.save()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${pct}%`, x, y)
      ctx.restore()
    })
  }
}

export default function ReadingPieChart({ data = [] }) {
  const grouped = data.reduce((acc, d) => {
    const status = getStatus(d.sugar_level, d.meal_type)
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const total = data.length
  if (total === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-text-muted text-sm">
        No data to display
      </div>
    )
  }

  const order = ['Normal', 'Low', 'High'].filter(s => grouped[s])

  const chartData = {
    labels: order,
    datasets: [{
      data: order.map(s => grouped[s]),
      backgroundColor: order.map(s => STATUS_COLORS[s]),
      borderWidth: 2,
      borderColor: '#fff',
      hoverBorderWidth: 3,
      hoverOffset: 6
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 18,
          color: '#64748b',
          font: { size: 12, weight: '600' },
          generateLabels: chart => {
            const ds = chart.data.datasets[0]
            return chart.data.labels.map((label, i) => ({
              text: `${label}  (${grouped[label]} readings)`,
              fillStyle: ds.backgroundColor[i],
              strokeStyle: ds.backgroundColor[i],
              hidden: false,
              index: i,
              pointStyle: 'circle'
            }))
          }
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
        callbacks: {
          label: ctx => {
            const pct = Math.round((ctx.raw / total) * 100)
            return ` ${ctx.raw} readings · ${pct}%`
          }
        }
      }
    }
  }

  return (
    <div className="h-72 w-full">
      <Doughnut data={chartData} options={options} plugins={[percentLabelPlugin]} />
    </div>
  )
}
