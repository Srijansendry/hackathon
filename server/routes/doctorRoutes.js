import { Router } from 'express'
import {
  getPatients, getPatientById, getMyDoctor,
  searchProfessionals, sendConnectionRequest,
  getPendingRequests, respondToRequest, getMyRequests
} from '../controllers/doctorController.js'
import { verifyToken, requireRole } from '../middlewares/auth.js'

const router = Router()

// Existing (fixed — Caretakers can also fetch their patients)
router.get('/patients', verifyToken, requireRole('Doctor', 'Caretaker'), getPatients)
router.get('/patient/:patientId', verifyToken, getPatientById)
router.get('/my-doctor', verifyToken, getMyDoctor)

// New connection request system
router.get('/search', verifyToken, searchProfessionals)
router.post('/request', verifyToken, requireRole('Patient'), sendConnectionRequest)
router.get('/requests/pending', verifyToken, requireRole('Doctor', 'Caretaker'), getPendingRequests)
router.post('/requests/respond', verifyToken, requireRole('Doctor', 'Caretaker'), respondToRequest)
router.get('/requests/mine', verifyToken, requireRole('Patient'), getMyRequests)

export default router
