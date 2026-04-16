const router = require('express').Router()
const { body, param } = require('express-validator')
const { validate } = require('../middleware/validate')
const { authenticate, authorize } = require('../middleware/auth')
const { uploadRecordAttachments, uploadSkinScan, uploadInsuranceAttachments } = require('../middleware/upload')
const ctrl = require('../controllers/patient.controller')

// All patient routes require auth + patient role
router.use(authenticate, authorize('patient'))

// ─── Profile ──────────────────────────────────────────────────────────────────
router.get('/profile', ctrl.getProfile)
router.put('/profile', ctrl.updateProfile)

// ─── Appointments ─────────────────────────────────────────────────────────────
router.get('/appointments', ctrl.getAppointments)
router.post(
  '/appointments',
  [
    body('doctorId').notEmpty().withMessage('doctorId required'),
    body('hospitalId').notEmpty().withMessage('hospitalId required'),
    body('date').notEmpty().withMessage('date required'),
    body('time').notEmpty().withMessage('time required'),
  ],
  validate,
  ctrl.bookAppointment
)

router.patch('/appointments/:id/cancel', ctrl.cancelAppointment)

// ─── Medical Records ──────────────────────────────────────────────────────────
router.get('/records', ctrl.getMedicalRecords)
router.post(
  '/records',
  [
    body('type').notEmpty().withMessage('type required'),
    body('title').notEmpty().withMessage('title required'),
    body('date').notEmpty().withMessage('date required'),
  ],
  validate,
  ctrl.addMedicalRecord
)
router.delete('/records/:id', ctrl.deleteMedicalRecord)

// ─── Medical Record File Upload (multer) ──────────────────────────────────────
router.post(
  '/records/:id/upload',
  (req, res, next) =>
    uploadRecordAttachments(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message })
      next()
    }),
  ctrl.uploadRecordFiles
)

// ─── Skin Scan Upload (multer) ────────────────────────────────────────────────
router.post(
  '/skin-scan/upload',
  (req, res, next) =>
    uploadSkinScan(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message })
      next()
    }),
  ctrl.uploadSkinImage
)

// ─── Blood Sugar ──────────────────────────────────────────────────────────────
router.get('/health/blood-sugar', ctrl.getBloodSugar)
router.post(
  '/health/blood-sugar',
  [
    body('value').isNumeric().withMessage('value must be a number'),
    body('type').notEmpty().withMessage('type required'),
    body('date').notEmpty().withMessage('date required'),
    body('time').notEmpty().withMessage('time required'),
  ],
  validate,
  ctrl.addBloodSugar
)
router.delete('/health/blood-sugar/:id', ctrl.deleteBloodSugar)

// ─── Blood Pressure ───────────────────────────────────────────────────────────
router.get('/health/blood-pressure', ctrl.getBloodPressure)
router.post(
  '/health/blood-pressure',
  [
    body('systolic').isInt().withMessage('systolic required'),
    body('diastolic').isInt().withMessage('diastolic required'),
    body('date').notEmpty().withMessage('date required'),
    body('time').notEmpty().withMessage('time required'),
  ],
  validate,
  ctrl.addBloodPressure
)
router.delete('/health/blood-pressure/:id', ctrl.deleteBloodPressure)

// ─── Mood ─────────────────────────────────────────────────────────────────────
router.get('/wellness/moods', ctrl.getMoods)
router.post('/wellness/moods', ctrl.addMood)

// ─── Vaccinations ─────────────────────────────────────────────────────────────
router.get('/wellness/vaccinations', ctrl.getVaccinations)
router.post('/wellness/vaccinations', ctrl.addVaccination)

// ─── Reminders ────────────────────────────────────────────────────────────────
router.get('/wellness/reminders', ctrl.getReminders)
router.post('/wellness/reminders', ctrl.addReminder)
router.patch('/wellness/reminders/:id/toggle', ctrl.toggleReminder)
router.delete('/wellness/reminders/:id', ctrl.deleteReminder)

// ─── Family Members ───────────────────────────────────────────────────────────
router.get('/family', ctrl.getFamilyMembers)
router.post('/family', ctrl.addFamilyMember)
router.delete('/family/:id', ctrl.deleteFamilyMember)

// ─── Insurance ────────────────────────────────────────────────────────────────
router.get('/insurance', ctrl.getInsurance)
router.post('/insurance', ctrl.addInsuranceCard)

// ─── Insurance File Upload ────────────────────────────────────────────────────
router.post(
  '/insurance/:id/upload',
  (req, res, next) =>
    uploadInsuranceAttachments(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message })
      next()
    }),
  ctrl.uploadInsuranceFiles
)

// ─── Admissions ───────────────────────────────────────────────────────────────
router.get('/admissions', ctrl.getAdmissions)
router.post('/admissions', ctrl.requestAdmission)

// ─── Notifications ────────────────────────────────────────────────────────────
router.get('/notifications', ctrl.getNotifications)
router.patch('/notifications/:id/read', ctrl.markNotificationRead)

// ─── Consent ──────────────────────────────────────────────────────────────────
router.get('/consent', ctrl.getConsentRequests)
router.patch('/consent/:id', ctrl.respondToConsent)

// ─── Insurance Claims ─────────────────────────────────────────────────────────
router.get('/insurance/claims', ctrl.getInsuranceClaims)
router.post(
  '/insurance/claims',
  [
    body('claimNo').notEmpty().withMessage('claimNo required'),
    body('date').notEmpty().withMessage('date required'),
    body('hospital').notEmpty().withMessage('hospital required'),
  ],
  validate,
  ctrl.addInsuranceClaim
)

// ─── Insurance Claim File Upload ──────────────────────────────────────────────
router.post(
  '/insurance/claims/:id/upload',
  (req, res, next) =>
    uploadInsuranceAttachments(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message })
      next()
    }),
  ctrl.uploadClaimFiles
)

// ─── SOS Contacts ─────────────────────────────────────────────────────────────
router.get('/sos-contacts', ctrl.getSosContacts)
router.post(
  '/sos-contacts',
  [
    body('name').notEmpty().withMessage('name required'),
    body('phone').notEmpty().withMessage('phone required'),
  ],
  validate,
  ctrl.addSosContact
)
router.delete('/sos-contacts/:id', ctrl.deleteSosContact)

module.exports = router
