import { Router } from 'express'
import { seedDemoData } from '../controllers/seedController.js'

const router = Router()

router.post('/demo', seedDemoData)

export default router
