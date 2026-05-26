import { Router } from 'express'
import { getMessages, sendMessage } from '../controllers/messageController.js'
import { verifyToken } from '../middlewares/auth.js'
const router = Router()
router.get('/:receiverId', verifyToken, getMessages)
router.post('/send', verifyToken, sendMessage)
export default router
