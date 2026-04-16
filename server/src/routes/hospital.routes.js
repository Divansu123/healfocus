const router = require('express').Router()
const { body } = require('express-validator')
const { validate } = require('../middleware/validate')
const { authenticate, authorize } = require('../middleware/auth')
const ctrl = require('../controllers/hospital.controller')

// All hospital routes require auth + hospital role
router.use(authenticate, authorize('hospital'))

// ─── Appointments ─────────────────────────────────────────────────────────────
router.get('/appointments', ctrl.getAppointments)
router.patch(
  '/appointments/:id',
  [body('status').notEmpty().withMessage('status required')],
  validate,
  ctrl.updateAppointment
)

// ─── Doctors ──────────────────────────────────────────────────────────────────
router.get('/doctors', ctrl.getDoctors)
router.post(
  '/doctors',
  [body('name').notEmpty().withMessage('name required'), body('speciality').notEmpty()],
  validate,
  ctrl.addDoctor
)
router.put('/doctors/:id', ctrl.updateDoctor)
router.delete('/doctors/:id', ctrl.deleteDoctor)

// ─── OPD ─────────────────────────────────────────────────────────────────────
router.get('/opd', ctrl.getOpdPatients)
router.post(
  '/opd',
  [body('name').notEmpty().withMessage('Patient name required'), body('visitDate').notEmpty()],
  validate,
  ctrl.addOpdPatient
)
router.put('/opd/:id', ctrl.updateOpdPatient)

// ─── Patients ─────────────────────────────────────────────────────────────────
router.get('/patients', ctrl.getPatients)

// ─── Promotions ───────────────────────────────────────────────────────────────
router.get('/promotions', ctrl.getPromotions)
router.post(
  '/promotions',
  [body('title').notEmpty().withMessage('title required')],
  validate,
  ctrl.addPromotion
)
router.put('/promotions/:id', ctrl.updatePromotion)
router.delete('/promotions/:id', ctrl.deletePromotion)

// ─── Service Requests ─────────────────────────────────────────────────────────
router.get('/service-requests', ctrl.getServiceRequests)
router.post(
  '/service-requests',
  [
    body('title').notEmpty().withMessage('title required'),
    body('category').notEmpty().withMessage('category required'),
  ],
  validate,
  ctrl.addServiceRequest
)

// ─── Indoor Bills ─────────────────────────────────────────────────────────────
router.get('/bills', ctrl.getBills)
router.post('/bills', ctrl.createBill)
router.patch('/bills/:id/status', ctrl.updateBillStatus)

// ─── Discharge Summaries ──────────────────────────────────────────────────────
router.get('/discharge', ctrl.getDischargeSummaries)
router.post('/discharge', ctrl.createDischargeSummary)
router.put('/discharge/:id', ctrl.updateDischargeSummary)

// ─── Notifications ────────────────────────────────────────────────────────────
router.get('/notifications', ctrl.getNotifications)
router.patch('/notifications/:id/read', ctrl.markNotificationRead)

// ─── Consent & Patient Records (consent-gated) ────────────────────────────────
router.get('/consent', ctrl.getConsentRequests)
router.post(
  '/consent/request',
  [
    body('patientId').notEmpty().withMessage('patientId required'),
  ],
  validate,
  ctrl.requestPatientConsent
)
router.get('/patients/:patientId/records', ctrl.getPatientRecords)

module.exports = router
