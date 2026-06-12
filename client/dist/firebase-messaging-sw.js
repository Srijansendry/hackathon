importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

var _apiKey = '';
if (_apiKey) {
  firebase.initializeApp({
    apiKey: '',
    authDomain: 'glucolyse-6c57e.firebaseapp.com',
    projectId: 'glucolyse-6c57e',
    storageBucket: 'glucolyse-6c57e.firebasestorage.app',
    messagingSenderId: '332019519481',
    appId: '1:332019519481:web:d28043c6feb2032ebdb728'
  })

  var messaging = firebase.messaging()

  messaging.onBackgroundMessage(function(payload) {
    var title = payload.notification && payload.notification.title
    var body = payload.notification && payload.notification.body
    if (!title) return
    self.registration.showNotification(title, {
      body: body || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data || {}
    })
  })

  self.addEventListener('notificationclick', function(event) {
    event.notification.close()
    var url = (event.notification.data && event.notification.data.link) || '/'
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        for (var i = 0; i < clientList.length; i++) {
          if (clientList[i].url.includes(self.location.origin) && 'focus' in clientList[i]) {
            return clientList[i].focus()
          }
        }
        if (clients.openWindow) return clients.openWindow(url)
      })
    )
  })
}
