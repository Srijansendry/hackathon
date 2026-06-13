import { Router } from 'express'
import {
  getPatients, getPatientById, getMyDoctor,
  searchProfessionals, sendConnectionRequest,
  getPendingRequests, respondToRequest, getMyRequests,
  unlinkMember, updatePatientContact
} from '../controllers/doctorController.js'
import { verifyToken, requireRole } from '../middlewares/auth.js'

const router = Router()

router.get('/patients', verifyToken, requireRole('Doctor', 'Caretaker'), getPatients)
router.get('/patient/:patientId', verifyToken, getPatientById)
router.get('/my-doctor', verifyToken, getMyDoctor)
router.patch('/patient/:patientId/contact', verifyToken, requireRole('Doctor', 'Caretaker'), updatePatientContact)

router.get('/search', verifyToken, searchProfessionals)
router.post('/request', verifyToken, requireRole('Patient'), sendConnectionRequest)
router.get('/requests/pending', verifyToken, requireRole('Doctor', 'Caretaker'), getPendingRequests)
router.post('/requests/respond', verifyToken, requireRole('Doctor', 'Caretaker'), respondToRequest)
router.get('/requests/mine', verifyToken, requireRole('Patient'), getMyRequests)
router.post('/unlink', verifyToken, requireRole('Patient'), unlinkMember)

export default router
