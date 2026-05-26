import { Router } from 'express'
import { sendNotification, getNotifications, getUnreadCount, markRead } from '../controllers/notificationController.js'
import { verifyToken } from '../middlewares/auth.js'
const router = Router()
router.post('/send', verifyToken, sendNotification)
router.get('/', verifyToken, getNotifications)
router.get('/unread', verifyToken, getUnreadCount)
router.patch('/:id/read', verifyToken, markRead)
export default router
