const router = require('express').Router()
const { body } = require('express-validator')
const { validate } = require('../middleware/validate')
const ctrl = require('../controllers/public.controller')

// GET /api/public/specialties
router.get('/specialties', ctrl.getSpecialties)

// GET /api/public/hospitals
router.get('/hospitals', ctrl.getHospitals)

// GET /api/public/doctors
router.get('/doctors', ctrl.getDoctors)

// GET /api/public/doctors/:id/slots?date=YYYY-MM-DD
router.get('/doctors/:id/slots', ctrl.getDoctorSlots)

// GET /api/public/promotions
router.get('/promotions', ctrl.getPromotions)

// POST /api/public/hospital-signup
router.post(
  '/hospital-signup-req',
  [
    body('name').notEmpty().withMessage('Hospital name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('city').notEmpty().withMessage('City required'),
  ],
  validate,
  ctrl.registerHospital
)

module.exports = router
