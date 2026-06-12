import { Router } from 'express'
import { getPrescriptions, addPrescription, updatePrescription, deletePrescription, togglePrescriptionStatus } from '../controllers/prescriptionController.js'
import { verifyToken } from '../middlewares/auth.js'

const router = Router()
router.get('/:patientId', verifyToken, getPrescriptions)
router.post('/', verifyToken, addPrescription)
router.put('/:id', verifyToken, updatePrescription)
router.delete('/:id', verifyToken, deletePrescription)
router.patch('/:id/toggle', verifyToken, togglePrescriptionStatus)
export default router
