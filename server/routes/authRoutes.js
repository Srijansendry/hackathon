import { Router } from 'express'
import { register, login, updateProfile } from '../controllers/authController.js'
import { verifyToken as authenticate } from '../middlewares/auth.js'
const router = Router()
router.post('/register', register)
router.post('/login', login)
router.put('/profile', authenticate, updateProfile)
export default router
