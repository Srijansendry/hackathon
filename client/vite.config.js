import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

function firebaseSwPlugin() {
  let viteEnv = {}

  return {
    name: 'firebase-sw-inject',
    config(_, { mode }) {
      viteEnv = loadEnv(mode, process.cwd(), '')
    },
    closeBundle() {
      const get = (key) => viteEnv[key] || process.env[key] || ''
      const sw = `importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: '${get('VITE_FIREBASE_API_KEY')}',
  authDomain: '${get('VITE_FIREBASE_AUTH_DOMAIN')}',
  projectId: '${get('VITE_FIREBASE_PROJECT_ID')}',
  storageBucket: '${get('VITE_FIREBASE_STORAGE_BUCKET')}',
  messagingSenderId: '${get('VITE_FIREBASE_MESSAGING_SENDER_ID')}',
  appId: '${get('VITE_FIREBASE_APP_ID')}'
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {}
  if (!title) return
  self.registration.showNotification(title, {
    body: body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {}
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.link || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
`
      const outPath = resolve(__dirname, 'dist', 'firebase-messaging-sw.js')
      try {
        writeFileSync(outPath, sw)
        console.log('[firebase-sw-inject] Service worker written with real config')
      } catch (e) {
        console.error('[firebase-sw-inject] Failed to write service worker:', e.message)
      }
    },
    configureServer(server) {
      const get = (key) => viteEnv[key] || process.env[key] || ''
      server.middlewares.use('/firebase-messaging-sw.js', (req, res) => {
        const sw = `importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: '${get('VITE_FIREBASE_API_KEY')}',
  authDomain: '${get('VITE_FIREBASE_AUTH_DOMAIN')}',
  projectId: '${get('VITE_FIREBASE_PROJECT_ID')}',
  storageBucket: '${get('VITE_FIREBASE_STORAGE_BUCKET')}',
  messagingSenderId: '${get('VITE_FIREBASE_MESSAGING_SENDER_ID')}',
  appId: '${get('VITE_FIREBASE_APP_ID')}'
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {}
  if (!title) return
  self.registration.showNotification(title, {
    body: body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {}
  })
})
`
        res.setHeader('Content-Type', 'application/javascript')
        res.setHeader('Service-Worker-Allowed', '/')
        res.end(sw)
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), firebaseSwPlugin()],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
