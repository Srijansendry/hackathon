import { Router } from 'express'
import { addReading, getReadings, getStats, getMealAverages, deleteReading } from '../controllers/sugarController.js'
import { verifyToken } from '../middlewares/auth.js'
const router = Router()
router.post('/add', verifyToken, addReading)
router.delete('/:readingId', verifyToken, deleteReading)
router.get('/stats/:patientId', verifyToken, getStats)
router.get('/meals/:patientId', verifyToken, getMealAverages)
router.get('/:patientId', verifyToken, getReadings)
export default router
