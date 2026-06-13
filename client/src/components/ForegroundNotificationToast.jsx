import { useState, useEffect } from 'react'

export default function ForegroundNotificationToast({ notification, onClose }) {
  const [visible, setVisible] = useState(false)
  const [prevNotification, setPrevNotification] = useState(null)

  if (notification !== prevNotification) {
    setPrevNotification(notification)
    setVisible(!!notification)
  }

  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, 5000)
    return () => clearTimeout(timer)
  }, [notification, onClose])

  if (!notification) return null

  const { title, body } = notification.notification || {}

  return (
    <div
      className={`fixed top-5 right-5 z-[9999] w-80 bg-surface-card border border-surface-border rounded-2xl shadow-elevated p-4 flex gap-3 items-start transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-lg">
        🔔
      </div>
      <div className="flex-1 min-w-0">
        {title && <p className="text-xs font-bold text-text-heading truncate">{title}</p>}
        {body && <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed line-clamp-2">{body}</p>}
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(onClose, 300) }}
        className="text-text-muted hover:text-text-secondary transition-colors shrink-0 cursor-pointer text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}
