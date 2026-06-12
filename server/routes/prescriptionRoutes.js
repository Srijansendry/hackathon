import { Router } from 'express'
import { getPrescriptions, addPrescription, deletePrescription, togglePrescriptionStatus } from '../controllers/prescriptionController.js'
import { verifyToken } from '../middlewares/auth.js'

const router = Router()
router.get('/:patientId', verifyToken, getPrescriptions)
router.post('/', verifyToken, addPrescription)
router.delete('/:id', verifyToken, deletePrescription)
router.patch('/:id/toggle', verifyToken, togglePrescriptionStatus)
export default router
