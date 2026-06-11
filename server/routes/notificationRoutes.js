import { Router } from 'express'
import {
  sendNotification,
  getNotifications,
  getUnreadCount,
  markRead,
  saveFCMToken,
  removeFCMToken,
  testPushNotification
} from '../controllers/notificationController.js'
import { verifyToken } from '../middlewares/auth.js'

const router = Router()

router.post('/send', verifyToken, sendNotification)
router.get('/', verifyToken, getNotifications)
router.get('/unread', verifyToken, getUnreadCount)
router.patch('/:id/read', verifyToken, markRead)

router.post('/save-token', verifyToken, saveFCMToken)
router.delete('/remove-token', verifyToken, removeFCMToken)
router.post('/test', verifyToken, testPushNotification)

export default router
