import { Router } from 'express'
import {
  sendNotification,
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  saveFCMToken,
  removeFCMToken,
  testPushNotification,
  pushToUser
} from '../controllers/notificationController.js'
import { verifyToken } from '../middlewares/auth.js'

const router = Router()

// Notification CRUD
router.get('/', verifyToken, getNotifications)
router.get('/unread', verifyToken, getUnreadCount)
router.patch('/:id/read', verifyToken, markRead)
router.post('/mark-all-read', verifyToken, markAllRead)

// Legacy direct insert
router.post('/send', verifyToken, sendNotification)

// FCM token management
router.post('/save-token', verifyToken, saveFCMToken)
router.delete('/remove-token', verifyToken, removeFCMToken)

// Push delivery
router.post('/test', verifyToken, testPushNotification)
router.post('/push', verifyToken, pushToUser)

export default router
